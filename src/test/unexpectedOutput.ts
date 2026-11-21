import { format } from "node:util";
import { afterEach } from "vitest";

/**
 * Turns two kinds of console noise into test failures.
 *
 * A full CI run printed 94 "not wrapped in act()" warnings and 25 unmatched
 * mock requests while the changelog called the run clean. Both are a test
 * observing the app mid-update or the app calling an endpoint nothing answers,
 * and neither fails anything on its own, so the output just grew until nobody
 * read it. Failing the test that caused each one is what keeps it at zero.
 *
 * A test that provokes one on purpose calls `forgiveUnexpectedOutput()` and
 * asserts on what it returns.
 */
const ACT_WARNING = /was not wrapped in act\(|not configured to support act\(/;

const unexpected: string[] = [];

export function recordUnexpectedRequest(method: string, url: string): void {
  unexpected.push(`unmatched request: ${method} ${url}`);
}

/** Takes the recorded output so the test that caused it can assert on it. */
export function forgiveUnexpectedOutput(): string[] {
  return unexpected.splice(0);
}

const printError = console.error;
console.error = (...args: unknown[]) => {
  const text = format(...args);
  if (ACT_WARNING.test(text)) {
    // Not printed: it reaches the output once, in the failure it causes.
    unexpected.push(text.split("\n")[0]);
    return;
  }
  printError(...args);
};

afterEach(() => {
  const found = forgiveUnexpectedOutput();
  if (found.length > 0) {
    throw new Error(
      `${found.length} piece(s) of unexpected console output:\n${found.join("\n")}`,
    );
  }
});
