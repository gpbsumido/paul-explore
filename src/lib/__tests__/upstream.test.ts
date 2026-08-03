import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";

afterEach(() => vi.unstubAllGlobals());

/** A fetch that never settles, which is what a stalled upstream looks like. */
function hangingFetch() {
  return vi.fn(
    (_url: string, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () =>
          reject(
            Object.assign(new Error("The operation was aborted"), {
              name: "TimeoutError",
            }),
          ),
        );
      }),
  );
}

describe("fetchUpstream", () => {
  it("gives up on a stalled upstream instead of waiting forever", async () => {
    // The production symptom: stats.nba.com stopped answering, the API took
    // 71s to fail, and the BFF waited the whole time because nothing bounded it.
    vi.stubGlobal("fetch", hangingFetch());

    const result = await fetchUpstream("http://api.test/api/nba/teams", {
      timeoutMs: 20,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.cause).toBe("timeout");
  });

  it("reports a refused connection as unreachable, not as a timeout", async () => {
    // Different operational facts. One means slow, the other means down, and
    // collapsing them into one status loses the only useful distinction.
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new TypeError("fetch failed"))),
    );

    const result = await fetchUpstream("http://api.test/x");

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.cause).toBe("unreachable");
  });

  it("hands back a successful response untouched", async () => {
    const response = new Response('{"data":[]}', { status: 200 });
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(response)));

    const result = await fetchUpstream("http://api.test/x");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.response).toBe(response);
  });

  it("treats a non-2xx upstream as a real answer, not a transport failure", async () => {
    // A genuine 404 from the API is information. Rewriting it into a 502 would
    // throw away the one thing the upstream actually told us.
    const response = new Response("nope", { status: 404 });
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(response)));

    const result = await fetchUpstream("http://api.test/x");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.response.status).toBe(404);
  });

  it("passes an abort signal so the request is actually cancelled", async () => {
    const spy = vi.fn(() => Promise.resolve(new Response("{}")));
    vi.stubGlobal("fetch", spy);

    await fetchUpstream("http://api.test/x");

    const init = spy.mock.calls[0][1] as RequestInit;
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });
});

describe("upstreamErrorResponse", () => {
  it("answers 504 for a timeout, so slow is distinguishable from down", async () => {
    const res = upstreamErrorResponse({
      ok: false,
      cause: "timeout",
      message: "took too long",
    });

    expect(res.status).toBe(504);
    await expect(res.json()).resolves.toMatchObject({ cause: "timeout" });
  });

  it("answers 502 when the upstream could not be reached", async () => {
    const res = upstreamErrorResponse({
      ok: false,
      cause: "unreachable",
      message: "refused",
    });

    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toMatchObject({ cause: "unreachable" });
  });
});
