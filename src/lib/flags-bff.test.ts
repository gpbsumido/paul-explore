import { describe, it, expect, vi, afterEach } from "vitest";
import { loadFleet, loadAuditLog, applyFlagPatch } from "./flags-bff";
import { FlagsApiError } from "./flags-client";
import { buildFlag } from "@/test/factories/flags";

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

afterEach(() => vi.clearAllMocks());

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
    expect(result.flags.length).toBeGreaterThan(0);
    expect(result.environments.length).toBeGreaterThan(0);
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
    vi.mocked(fetchAuditFromApi).mockRejectedValue(new Error("down"));

    const result = await loadAuditLog();

    expect(result.source).toBe("seed");
    expect(Array.isArray(result.audit)).toBe(true);
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
});
