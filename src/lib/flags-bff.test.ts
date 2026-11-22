import { describe, it, expect, vi, afterEach } from "vitest";
import { forgiveUnexpectedOutput } from "@/test/unexpectedOutput";
import { loadFleet, loadAuditLog, applyFlagPatch, patchSeedStore } from "./flags-bff";
import { FlagsApiError, FlagsContractError, FlagsWriteTimeoutError } from "./flags-client";
import { getAudit, getFlag, getFlags } from "./flags-data";
import { ENVIRONMENTS } from "@/types/flags";
import { buildFlag, percentRollout } from "@/test/factories/flags";

vi.mock("./flags-client", async () => {
  const actual =
    await vi.importActual<typeof import("./flags-client")>("./flags-client");
  return {
    ...actual,
    fetchFlagsFromApi: vi.fn(),
    fetchAuditFromApi: vi.fn(),
    patchFlagOnApi: vi.fn(),
  };
});

import {
  fetchFlagsFromApi,
  fetchAuditFromApi,
  patchFlagOnApi,
} from "./flags-client";

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("loadFleet", () => {
  it("returns the live API fleet when the API answers", async () => {
    const flag = buildFlag({ key: "from-api" });
    vi.mocked(fetchFlagsFromApi).mockResolvedValue({
      flags: [flag],
      environments: ["production"],
    });

    const result = await loadFleet();

    expect(result.source).toBe("api");
    expect(result.flags.map((f) => f.key)).toEqual(["from-api"]);
  });

  it("falls back to the seed fleet when the API is unreachable", async () => {
    vi.mocked(fetchFlagsFromApi).mockRejectedValue(new Error("ECONNREFUSED"));

    const result = await loadFleet();

    expect(result.source).toBe("seed");
    expect(result.flags.map((f) => f.key)).toEqual(getFlags().map((f) => f.key));
    expect(result.environments).toEqual([...ENVIRONMENTS]);
    expect(forgiveUnexpectedOutput()).toEqual([
      "[flags] loadFleet fell back to the seed: ECONNREFUSED",
    ]);
  });

  it("hands back a copy of the seed, so a caller cannot reorder the store", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.mocked(fetchFlagsFromApi).mockRejectedValue(new Error("ECONNREFUSED"));

    const result = await loadFleet();
    result.flags.reverse();

    expect(getFlags()[0].key).not.toBe(result.flags[0].key);
  });

  it("says why it fell back, so a rejected read isn't mistaken for an outage", async () => {
    const warned = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.mocked(fetchFlagsFromApi).mockRejectedValue(new FlagsApiError(500));

    const result = await loadFleet();

    expect(result.source).toBe("seed");
    expect(warned.mock.calls[0][0]).toMatch(/responded 500/);
  });
});

describe("loadAuditLog", () => {
  it("returns the live API audit when the API answers", async () => {
    vi.mocked(fetchAuditFromApi).mockResolvedValue({
      audit: [
        {
          id: "audit-live",
          flagKey: "new-checkout",
          environment: "production",
          action: "enabled",
          summary: "Enabled in production",
          actor: "ava@acme.com",
          timestamp: "2026-07-20T18:12:00.000Z",
        },
      ],
    });

    const result = await loadAuditLog();

    expect(result.source).toBe("api");
    expect(result.audit[0].id).toBe("audit-live");
  });

  it("falls back to the seed audit when the API is unreachable", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.mocked(fetchAuditFromApi).mockRejectedValue(new Error("down"));

    const result = await loadAuditLog();

    expect(result.source).toBe("seed");
    expect(result.audit.map((a) => a.id)).toEqual(getAudit().map((a) => a.id));
  });
});

describe("applyFlagPatch", () => {
  it("writes through to the API when it answers", async () => {
    const flag = buildFlag({ key: "new-checkout" });
    vi.mocked(patchFlagOnApi).mockResolvedValue({ flag });

    const result = await applyFlagPatch(
      "new-checkout",
      { environment: "production", enabled: false },
      { bearer: "token-123" },
    );

    expect(result.status).toBe(200);
    expect(result.flag?.key).toBe("new-checkout");
    expect(patchFlagOnApi).toHaveBeenCalledWith(
      "new-checkout",
      { environment: "production", enabled: false },
      { bearer: "token-123" },
    );
  });

  it("propagates a real HTTP error from the API instead of masking it", async () => {
    vi.mocked(patchFlagOnApi).mockRejectedValue(new FlagsApiError(401));

    const result = await applyFlagPatch("new-checkout", {
      environment: "production",
      enabled: false,
    });

    expect(result.status).toBe(401);
    expect(result.flag).toBeUndefined();
  });

  it("falls back to the seed store when the API is unreachable", async () => {
    // start from "on" so the write has something to change
    patchSeedStore("new-checkout", { environment: "production", enabled: true });
    vi.mocked(patchFlagOnApi).mockRejectedValue(new Error("ECONNREFUSED"));

    const result = await applyFlagPatch("new-checkout", {
      environment: "production",
      enabled: false,
    });

    expect(result.status).toBe(200);
    expect(result.flag?.key).toBe("new-checkout");
    expect(result.flag?.environments.production?.enabled).toBe(false);
  });

  it("returns 404 from the seed store for an unknown flag when the API is down", async () => {
    vi.mocked(patchFlagOnApi).mockRejectedValue(new Error("down"));

    const result = await applyFlagPatch("does-not-exist", {
      environment: "production",
      enabled: false,
    });

    expect(result.status).toBe(404);
    expect(result.flag).toBeUndefined();
  });

  it("does not write a rejected change into the seed store", async () => {
    patchSeedStore("new-checkout", { environment: "production", enabled: true });
    vi.mocked(patchFlagOnApi).mockRejectedValue(new FlagsApiError(403));

    const result = await applyFlagPatch("new-checkout", {
      environment: "production",
      enabled: false,
    });

    expect(result).toEqual({ status: 403 });
    expect(getFlag("new-checkout")?.environments.production?.enabled).toBe(true);
  });

  it("answers an unreadable API response with 502 instead of pretending the write landed", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    patchSeedStore("new-checkout", { environment: "production", enabled: true });
    vi.mocked(patchFlagOnApi).mockRejectedValue(new FlagsContractError(new Error("bad shape")));

    const result = await applyFlagPatch("new-checkout", {
      environment: "production",
      enabled: false,
    });

    expect(result).toEqual({ status: 502 });
    expect(getFlag("new-checkout")?.environments.production?.enabled).toBe(true);
    expect(logged).toHaveBeenCalledOnce();
  });
});

describe("applyFlagPatch when the API runs out of time", () => {
  it("answers 504 and leaves the seed store alone, since the write may have landed", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    patchSeedStore("new-checkout", { environment: "production", enabled: true });
    vi.mocked(patchFlagOnApi).mockRejectedValue(new FlagsWriteTimeoutError());

    const result = await applyFlagPatch("new-checkout", {
      environment: "production",
      enabled: false,
    });

    expect(result).toEqual({ status: 504 });
    expect(getFlag("new-checkout")?.environments.production?.enabled).toBe(true);
    expect(logged).toHaveBeenCalledOnce();
  });
});

describe("patchSeedStore", () => {
  it("flips the kill switch for one environment and leaves the others alone", () => {
    patchSeedStore("dark-mode", { environment: "staging", enabled: true });
    const before = getFlag("dark-mode");

    const result = patchSeedStore("dark-mode", { environment: "staging", enabled: false });

    expect(result.status).toBe(200);
    expect(result.flag?.environments.staging?.enabled).toBe(false);
    expect(result.flag?.environments.production).toEqual(before?.environments.production);
  });

  it("replaces the rollout weights when a fallthrough is sent", () => {
    const result = patchSeedStore("dark-mode", {
      environment: "development",
      fallthrough: percentRollout(30),
    });

    expect(result.status).toBe(200);
    expect(result.flag?.environments.development?.fallthrough).toEqual(percentRollout(30));
  });

  it("applies both changes when the body carries both", () => {
    patchSeedStore("dark-mode", { environment: "development", enabled: true });

    const result = patchSeedStore("dark-mode", {
      environment: "development",
      enabled: false,
      fallthrough: percentRollout(60),
    });

    expect(result.flag?.environments.development?.enabled).toBe(false);
    expect(result.flag?.environments.development?.fallthrough).toEqual(percentRollout(60));
  });

  it("records the change in the audit log", () => {
    const before = getAudit().length;

    patchSeedStore("dark-mode", { environment: "staging", enabled: true });
    patchSeedStore("dark-mode", { environment: "staging", enabled: false });

    expect(getAudit().length).toBe(before + 2);
    expect(getAudit()[0]).toMatchObject({
      flagKey: "dark-mode",
      environment: "staging",
      action: "disabled",
    });
  });

  it("answers 404 for an unknown flag", () => {
    expect(patchSeedStore("nope", { environment: "production", enabled: true })).toEqual({
      status: 404,
    });
  });

  it("answers 404 when the body changes nothing", () => {
    expect(patchSeedStore("dark-mode", { environment: "production" })).toEqual({ status: 404 });
  });
});
