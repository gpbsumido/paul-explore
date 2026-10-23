import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchCatalog } from "./tcg-catalog";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

/**
 * A fetch that never answers until its signal gives up, which is what the API
 * looked like while a crashed deploy sat behind Railway's edge.
 */
function stalledFetch() {
  return vi.fn(
    (_url: string, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        const signal = init?.signal;
        const fail = () => reject(Object.assign(new Error("timed out"), { name: "TimeoutError" }));
        if (signal?.aborted) fail();
        signal?.addEventListener("abort", fail);
      }),
  );
}

/** Every deadline has already passed, so the test doesn't wait for a real one. */
function expireDeadlines() {
  return vi
    .spyOn(AbortSignal, "timeout")
    .mockImplementation(() => AbortSignal.abort(new DOMException("timed out", "TimeoutError")));
}

describe("fetchCatalog", () => {
  it("gives up on a stalled API and reports the catalog as unreadable", { timeout: 1000 }, async () => {
    vi.stubGlobal("fetch", stalledFetch());
    const deadline = expireDeadlines();

    await expect(fetchCatalog()).resolves.toBeNull();
    expect(deadline).toHaveBeenCalledWith(8_000);
  });
});
