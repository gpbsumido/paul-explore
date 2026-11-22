import { format } from "node:util";
import { afterEach } from "vitest";

/**
 * Turns console noise into test failures.
 *
 * A full CI run printed 94 "not wrapped in act()" warnings, 25 unmatched mock
 * requests and about a hundred error and warning blocks while the changelog
 * called the run clean. Each is either a test observing the app mid-update, the
 * app calling an endpoint nothing answers, or the app logging a failure a test
 * provoked on purpose. None of them fails anything on its own, so the output
 * just grew until nobody read it, and a real warning (two cards sharing a key,
 * a response body read twice) sat in it unnoticed. Failing the test that caused
 * each one is what keeps it at zero.
 *
 * Every `console.error` and `console.warn` is recorded instead of printed. A
 * test that provokes one on purpose calls `forgiveUnexpectedOutput()` and
 * asserts on what it returns, so the log line is checked, not just hidden.
 */
const unexpected: string[] = [];

export function recordUnexpectedRequest(method: string, url: string): void {
  unexpected.push(`unmatched request: ${method} ${url}`);
}

/** Takes the recorded output so the test that caused it can assert on it. */
export function forgiveUnexpectedOutput(): string[] {
  return unexpected.splice(0);
}

for (const method of ["error", "warn"] as const) {
  // Not printed: it reaches the output once, in the failure it causes.
  console[method] = (...args: unknown[]) => {
    unexpected.push(format(...args).split("\n")[0]);
  };
}

afterEach(() => {
  const found = forgiveUnexpectedOutput();
  if (found.length > 0) {
    throw new Error(
      `${found.length} piece(s) of unexpected console output:\n${found.join("\n")}`,
    );
  }
});
