import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The handlers have to match the absolute URL the BFF requests, or MSW misses
 * them, the BFF falls back to its seed, and the tests pass while asserting
 * against fixture data instead of the API.
 *
 * That happened, was fixed, and then happened again: the first fix used a
 * pattern that only saw registrations where the path sat on the same line as
 * the http.* call, so four multi-line ones kept their bare paths for another
 * round. This asserts on the file itself because the symptom is invisible in
 * test results — everything passes either way.
 */
describe("operator MSW handlers", () => {
  const source = readFileSync(
    join(process.cwd(), "src/test/handlers/operator.ts"),
    "utf-8",
  );

  it("registers every path against the API base, including multi-line ones", () => {
    const bare = source
      .split("\n")
      .filter((line) => /^\s+"\/api\//.test(line));

    expect(bare, `bare paths found:\n${bare.join("\n")}`).toEqual([]);
  });

  it("covers every http.* registration", () => {
    const registrations = source.match(/http\.(get|post|patch|put|delete)\(/g) ?? [];
    const withBase = source.match(/\$\{API_BASE\}/g) ?? [];

    expect(registrations.length).toBeGreaterThan(0);
    expect(withBase.length).toBeGreaterThanOrEqual(registrations.length);
  });
});
