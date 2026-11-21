import { describe, it, expect, afterEach, vi } from "vitest";
import { fetchUpstream, proxyUpstream, upstreamErrorResponse } from "./upstream";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function stubFetch(impl: () => Promise<Response> | Response) {
  vi.stubGlobal("fetch", vi.fn(impl));
}

describe("proxyUpstream", () => {
  it("returns the upstream JSON with the cache header on success", async () => {
    stubFetch(() => new Response(JSON.stringify({ teams: [1] }), { status: 200 }));
    const res = await proxyUpstream("https://api/x", {
      errorLabel: "Failed to fetch teams",
      cacheControl: "public, s-maxage=300",
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("public, s-maxage=300");
    expect(await res.json()).toEqual({ teams: [1] });
  });

  it("maps a non-ok upstream to the labeled error at the same status", async () => {
    stubFetch(() => new Response("nope", { status: 404 }));
    const res = await proxyUpstream("https://api/x", {
      errorLabel: "Failed to fetch teams",
    });
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Failed to fetch teams" });
  });

  it("returns 502 when the upstream is unreachable", async () => {
    stubFetch(() => {
      throw new TypeError("fetch failed");
    });
    const res = await proxyUpstream("https://api/x", { errorLabel: "x" });
    expect(res.status).toBe(502);
    expect(await res.json()).toMatchObject({ error: "Backend unavailable" });
  });

  it("returns 504 when the upstream times out", async () => {
    stubFetch(() => {
      const err = new Error("timed out");
      err.name = "TimeoutError";
      throw err;
    });
    const res = await proxyUpstream("https://api/x", { errorLabel: "x" });
    expect(res.status).toBe(504);
  });

  it("reads an aborted request as a timeout too", async () => {
    stubFetch(() => {
      const err = new Error("The operation was aborted");
      err.name = "AbortError";
      throw err;
    });
    const res = await proxyUpstream("https://api/x", { errorLabel: "x" });
    expect(res.status).toBe(504);
    expect(await res.json()).toEqual({ error: "Upstream timed out", cause: "timeout" });
  });

  it("sends no Cache-Control header when the route didn't ask for one", async () => {
    stubFetch(() => new Response(JSON.stringify({ ok: true }), { status: 200 }));
    const res = await proxyUpstream("https://api/x", { errorLabel: "x" });
    expect(res.headers.get("Cache-Control")).toBeNull();
  });

  it("returns 502 when the upstream body isn't valid JSON", async () => {
    stubFetch(() => new Response("<html>", { status: 200 }));
    const res = await proxyUpstream("https://api/x", { errorLabel: "x" });
    expect(res.status).toBe(502);
    expect(await res.json()).toMatchObject({ error: "Backend unavailable" });
  });
});

describe("fetchUpstream", () => {
  it("hands back a non-2xx response as a success so the route can read it", async () => {
    stubFetch(() => new Response("missing", { status: 404 }));
    const result = await fetchUpstream("https://api/x");
    expect(result.ok).toBe(true);
    expect(result.ok && result.response.status).toBe(404);
  });

  it("calls the url it was given with a deadline attached", async () => {
    const fetchSpy = vi.fn(async () => new Response("{}"));
    vi.stubGlobal("fetch", fetchSpy);
    await fetchUpstream("https://api/teams", { method: "POST" });
    const [url, init] = fetchSpy.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api/teams");
    expect(init.method).toBe("POST");
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("reports a request that outlives its deadline as a timeout", async () => {
    vi.stubGlobal(
      "fetch",
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener("abort", () => reject(init.signal?.reason));
        }),
    );
    const result = await fetchUpstream("https://api/slow", { timeoutMs: 20 });
    expect(result).toMatchObject({ ok: false, cause: "timeout" });
  });

  it("keeps a caller's own signal instead of replacing it with the deadline", async () => {
    const fetchSpy = vi.fn(async () => new Response("{}"));
    vi.stubGlobal("fetch", fetchSpy);
    const callersSignal = new AbortController().signal;
    await fetchUpstream("https://api/x", { signal: callersSignal });
    const [, init] = fetchSpy.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.signal).toBe(callersSignal);
  });

  it("reports a failure that isn't an Error as unreachable, with its text", async () => {
    stubFetch(() => Promise.reject("socket hang up"));
    const result = await fetchUpstream("https://api/x");
    expect(result).toEqual({ ok: false, cause: "unreachable", message: "socket hang up" });
  });
});

describe("upstreamErrorResponse", () => {
  it("answers 504 for a deadline and 502 for an unreachable backend", async () => {
    const slow = upstreamErrorResponse({ ok: false, cause: "timeout", message: "t" });
    const down = upstreamErrorResponse({ ok: false, cause: "unreachable", message: "d" });
    expect([slow.status, down.status]).toEqual([504, 502]);
    expect(await down.json()).toEqual({ error: "Backend unavailable", cause: "unreachable" });
  });
});
