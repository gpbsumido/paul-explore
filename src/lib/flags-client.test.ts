import { describe, it, expect, vi, afterEach } from "vitest";
import {
  fetchFlagsFromApi,
  fetchAuditFromApi,
  patchFlagOnApi,
} from "./flags-client";
import { buildFlag } from "@/test/factories/flags";
import type { AuditEntry } from "@/types/flags";

function mockFetch(status: number, body: unknown) {
  const fn = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

afterEach(() => vi.unstubAllGlobals());

const auditEntry: AuditEntry = {
  id: "audit-001",
  flagKey: "new-checkout",
  environment: "production",
  action: "enabled",
  summary: "Enabled in production",
  actor: "ava@acme.com",
  timestamp: "2026-07-20T18:12:00.000Z",
};

describe("flags-client", () => {
  it("fetches the fleet from the feature-flags endpoint and validates it", async () => {
    const flag = buildFlag();
    const fetchMock = mockFetch(200, {
      flags: [flag],
      environments: ["development", "staging", "production"],
    });

    const result = await fetchFlagsFromApi();

    expect(result.flags).toHaveLength(1);
    expect(result.flags[0].key).toBe(flag.key);
    expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/api\/feature-flags$/);
  });

  it("throws when the flags endpoint responds with an error status", async () => {
    mockFetch(503, { error: "unavailable" });
    await expect(fetchFlagsFromApi()).rejects.toThrow();
  });

  it("throws when the payload does not match the flag contract", async () => {
    mockFetch(200, { flags: [{ key: "broken" }], environments: [] });
    await expect(fetchFlagsFromApi()).rejects.toThrow();
  });

  it("fetches the audit log from the audit endpoint", async () => {
    const fetchMock = mockFetch(200, { audit: [auditEntry] });

    const result = await fetchAuditFromApi();

    expect(result.audit).toHaveLength(1);
    expect(result.audit[0].id).toBe("audit-001");
    expect(String(fetchMock.mock.calls[0][0])).toMatch(
      /\/api\/feature-flags\/audit$/,
    );
  });

  it("patches a flag and returns the updated flag", async () => {
    const flag = buildFlag();
    const fetchMock = mockFetch(200, { flag });

    const result = await patchFlagOnApi("new-checkout", {
      environment: "production",
      enabled: true,
    });

    expect(result.flag.key).toBe(flag.key);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(/\/api\/feature-flags\/new-checkout$/);
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body)).toEqual({
      environment: "production",
      enabled: true,
    });
  });

  it("surfaces a not-found patch (404) as an error", async () => {
    mockFetch(404, { error: "Flag not found" });
    await expect(
      patchFlagOnApi("missing", { environment: "production", enabled: true }),
    ).rejects.toThrow();
  });
});
