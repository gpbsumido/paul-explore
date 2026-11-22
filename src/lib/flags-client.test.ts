import { describe, it, expect, vi, afterEach } from "vitest";
import {
  FLAGS_TOKEN_HEADER,
  FlagsApiError,
  FlagsContractError,
  FlagsWriteTimeoutError,
  fetchFlagsFromApi,
  fetchAuditFromApi,
  patchFlagOnApi,
} from "./flags-client";
import { InvalidSegmentError } from "./safeSegment";
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

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

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
    await expect(fetchFlagsFromApi()).rejects.toMatchObject({
      name: "FlagsApiError",
      status: 503,
    });
  });

  it("asks for a fresh copy every time rather than a cached fleet", async () => {
    const fetchMock = mockFetch(200, { flags: [], environments: [] });

    await fetchFlagsFromApi();

    expect(fetchMock.mock.calls[0][1]).toMatchObject({ cache: "no-store" });
  });

  it("gives up on a stalled API so the gate can fall back to the seed", { timeout: 1000 }, async () => {
    // /tcg/pocket reads its gate from here before anything else, so a hang
    // here hung the page even after the catalog request had a deadline.
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_url: string, init?: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            const fail = () => reject(Object.assign(new Error("timed out"), { name: "TimeoutError" }));
            if (init?.signal?.aborted) fail();
            init?.signal?.addEventListener("abort", fail);
          }),
      ),
    );
    const deadline = vi
      .spyOn(AbortSignal, "timeout")
      .mockImplementation(() => AbortSignal.abort(new DOMException("timed out", "TimeoutError")));

    await expect(fetchFlagsFromApi()).rejects.toThrow(/timed out/);
    expect(deadline).toHaveBeenCalledWith(8_000);
  });

  it("throws when the payload does not match the flag contract", async () => {
    mockFetch(200, { flags: [{ key: "broken" }], environments: [] });
    const failure = await fetchFlagsFromApi().catch((err: unknown) => err);
    expect(failure).toBeInstanceOf(Error);
    expect(failure).not.toBeInstanceOf(FlagsApiError);
    expect((failure as Error).name).toBe("ZodError");
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

  it("raises a FlagsApiError with the status when the audit endpoint refuses", async () => {
    mockFetch(500, { error: "boom" });
    await expect(fetchAuditFromApi()).rejects.toMatchObject({ name: "FlagsApiError", status: 500 });
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
    ).rejects.toMatchObject({ name: "FlagsApiError", status: 404 });
  });
});

describe("patchFlagOnApi credentials and guards", () => {
  const body = { environment: "production", enabled: true } as const;
  const headersSent = (fetchMock: ReturnType<typeof mockFetch>) =>
    fetchMock.mock.calls[0][1].headers as Record<string, string>;

  it("sends a visitor's token as a bearer", async () => {
    const fetchMock = mockFetch(200, { flag: buildFlag() });

    await patchFlagOnApi("new-checkout", body, { bearer: "visitor-token" });

    expect(headersSent(fetchMock)).toMatchObject({
      authorization: "Bearer visitor-token",
      "content-type": "application/json",
    });
    expect(headersSent(fetchMock)).not.toHaveProperty(FLAGS_TOKEN_HEADER);
  });

  it("sends the server's shared secret in its own header, never as a bearer", async () => {
    const fetchMock = mockFetch(200, { flag: buildFlag() });

    await patchFlagOnApi("new-checkout", body, { serviceToken: "shared-secret" });

    expect(headersSent(fetchMock)[FLAGS_TOKEN_HEADER]).toBe("shared-secret");
    expect(headersSent(fetchMock)).not.toHaveProperty("authorization");
  });

  it("sends no credential when the caller has none", async () => {
    const fetchMock = mockFetch(200, { flag: buildFlag() });

    await patchFlagOnApi("new-checkout", body);

    expect(Object.keys(headersSent(fetchMock))).toEqual(["content-type"]);
  });

  it("refuses a flag key that would change the upstream path, before any request", async () => {
    const fetchMock = mockFetch(200, { flag: buildFlag() });

    await expect(patchFlagOnApi("../admin", body, { bearer: "t" })).rejects.toBeInstanceOf(
      InvalidSegmentError,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses a body that changes nothing, before any request", async () => {
    const fetchMock = mockFetch(200, { flag: buildFlag() });

    await expect(
      patchFlagOnApi("new-checkout", { environment: "production" }),
    ).rejects.toThrow(/at least one of enabled or fallthrough/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("patchFlagOnApi response shape", () => {
  const env = {
    enabled: true,
    offVariation: "off",
    rules: [],
    fallthrough: [{ variation: "on", weight: 100 }],
  };
  const flag = {
    key: "dark-mode",
    name: "Dark mode",
    description: "d",
    kind: "boolean" as const,
    tags: [],
    variations: [
      { key: "on", name: "Enabled", value: true },
      { key: "off", name: "Disabled", value: false },
    ],
    createdAt: "2026-01-01T00:00:00.000Z",
    environments: {
      development: env,
      staging: env,
      production: env,
    },
  };

  afterEach(() => vi.unstubAllGlobals());

  function stubJson(body: unknown) {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => body,
      }),
    );
  }

  it("accepts the flag returned bare at the top level", async () => {
    // The API answers a PATCH with the flag itself. Expecting only the wrapped
    // shape made every write throw a parse error, which the BFF then mistook
    // for the API being unreachable and quietly answered from memory instead.
    stubJson(flag);
    const result = await patchFlagOnApi("dark-mode", {
      environment: "production",
      enabled: false,
    });
    expect(result.flag.key).toBe("dark-mode");
  });

  it("still accepts the wrapped shape", async () => {
    stubJson({ flag });
    const result = await patchFlagOnApi("dark-mode", {
      environment: "production",
      enabled: false,
    });
    expect(result.flag.key).toBe("dark-mode");
  });

  it("throws on a body that is neither", async () => {
    stubJson({ nonsense: true });
    await expect(
      patchFlagOnApi("dark-mode", { environment: "production", enabled: false }),
    ).rejects.toBeInstanceOf(FlagsContractError);
  });
});

/**
 * The audit read and the flag write had no deadline, unlike the fleet read.
 * A write that runs out of time may have landed, so it gets its own error.
 */
describe("flags-client deadlines", () => {
  it("bounds the audit read with an abort signal", async () => {
    const fetchMock = mockFetch(200, { audit: [] });
    await fetchAuditFromApi();
    expect((fetchMock.mock.calls[0][1] as RequestInit).signal).toBeInstanceOf(AbortSignal);
  });

  it("bounds a flag write with an abort signal", async () => {
    const fetchMock = mockFetch(200, { flag: buildFlag({ key: "new-checkout" }) });
    await patchFlagOnApi("new-checkout", { environment: "production", enabled: true }).catch(() => {
      // the body shape isn't the point; only that the write carries a deadline
    });
    expect((fetchMock.mock.calls[0][1] as RequestInit).signal).toBeInstanceOf(AbortSignal);
  });

  it("names a flag write that ran out of time as its own error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("The operation was aborted due to timeout", "TimeoutError")));
    await expect(
      patchFlagOnApi("new-checkout", { environment: "production", enabled: true }),
    ).rejects.toBeInstanceOf(FlagsWriteTimeoutError);
  });
});
