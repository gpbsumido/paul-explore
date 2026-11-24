// @vitest-environment node
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * A green run only means something if nothing in it was quietly switched off.
 * These fail the build when a test is skipped, left as a todo, narrowed with
 * .only, or marked as an expected failure without saying which bug it is
 * waiting on.
 */

const ROOTS = ["src", "scripts", "e2e"];
const TEST_FILE = /\.test\.tsx?$/;

function testFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      return entry.name === "node_modules" ? [] : testFiles(path);
    }
    return TEST_FILE.test(entry.name) ? [path] : [];
  });
}

const FILES = ROOTS.flatMap((root) => testFiles(root));
const SELF = join("src", "test", "hiddenTests.test.ts");

/** Every line of every test file, minus this one, which has to name the patterns. */
const LINES = FILES.filter((file) => file !== SELF).flatMap((file) =>
  readFileSync(file, "utf8")
    .split("\n")
    .map((text, index) => ({ file, line: index + 1, text })),
);

describe("tests that are switched off or narrowed", () => {
  it("finds the test files it is meant to police", () => {
    expect(FILES.length).toBeGreaterThan(400);
  });

  it("has no skipped or todo test", () => {
    const hidden = LINES.filter(({ text }) =>
      /\b(it|test|describe)\.(skip|todo)\b|\bx(it|describe)\(/.test(text),
    );
    expect(hidden.map(({ file, line }) => `${file}:${line}`)).toEqual([]);
  });

  it("has no .only left in", () => {
    const narrowed = LINES.filter(({ text }) =>
      /\b(it|test|describe)\.only\b/.test(text),
    );
    expect(narrowed.map(({ file, line }) => `${file}:${line}`)).toEqual([]);
  });

  it("says which bug each expected failure is waiting on", () => {
    const unexplained = LINES.filter(({ text, file, line }) => {
      if (/^\s*(\/\/|\/\*|\*)/.test(text)) return false;
      if (!/\b(it|test)\.fails\b/.test(text)) return false;
      const above = LINES.filter(
        (other) =>
          other.file === file && other.line < line && other.line >= line - 8,
      );
      return !above.some(
        ({ text: comment }) =>
          /^\s*(\/\/|\/\*|\*)/.test(comment) && /known bug/i.test(comment),
      );
    });
    expect(unexplained.map(({ file, line }) => `${file}:${line}`)).toEqual([]);
  });
});
