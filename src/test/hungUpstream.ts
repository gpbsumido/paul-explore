import { vi } from "vitest";

/**
 * Makes every fetch hang until its own deadline fires, on fake timers.
 *
 * Node's `AbortSignal.timeout` runs on an internal timer that fake timers
 * can't reach, so it's rebuilt here on `setTimeout`, aborting with the same
 * TimeoutError Node uses. The fetch stub never answers and only rejects once
 * its signal aborts, so a test can advance the clock and see exactly when a
 * call gives up. Callers restore with `vi.useRealTimers()` and
 * `vi.restoreAllMocks()` plus `vi.unstubAllGlobals()`.
 */
export function hangEveryFetchUntilItsDeadline(): void {
  vi.useFakeTimers();
  vi.spyOn(AbortSignal, "timeout").mockImplementation((ms) => {
    const controller = new AbortController();
    setTimeout(
      () => controller.abort(new DOMException("The operation was aborted due to timeout", "TimeoutError")),
      ms,
    );
    return controller.signal;
  });
  vi.stubGlobal(
    "fetch",
    vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => reject(init.signal?.reason));
        }),
    ),
  );
}

/** Watches a promise so a test can ask whether it has settled yet without awaiting it. */
export function watchSettling(promise: Promise<unknown>): { readonly settled: boolean } {
  const watch = { settled: false };
  const markSettled = () => {
    watch.settled = true;
  };
  promise.then(markSettled, markSettled);
  return watch;
}
