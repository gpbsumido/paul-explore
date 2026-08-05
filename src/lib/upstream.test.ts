import { describe, it, expect, afterEach, vi } from "vitest";
import { proxyUpstream } from "./upstream";

afterEach(() => vi.restoreAllMocks());

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

  it("returns 502 when the upstream body isn't valid JSON", async () => {
    stubFetch(() => new Response("<html>", { status: 200 }));
    const res = await proxyUpstream("https://api/x", { errorLabel: "x" });
    expect(res.status).toBe(502);
    expect(await res.json()).toMatchObject({ error: "Backend unavailable" });
  });
});
