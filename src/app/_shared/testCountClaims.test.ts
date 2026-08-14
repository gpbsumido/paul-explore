import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { TEST_COUNT } from "./testCount.generated";

/**
 * Prose that states the test count has to use the generated one.
 *
 * The count is regenerated on every build by scripts/count-tests.mjs, and the
 * v2 stats strip has always rendered it. Two other places wrote it out by hand
 * and stopped at "640+ tests (623 unit + 17 e2e)" while the real number went
 * past 2,500 -- so the site quoted two different figures for the same thing,
 * four times apart, on pages a click from each other.
 *
 * A number that regenerates itself every build is the last thing that should
 * be retyped, which is why this checks for the retyping rather than the value.
 */
const ROOT = process.cwd();

const CLAIM_FILES = [
  "src/app/_shared/featureData.data.ts",
  "src/app/thoughts/testing/TestingContent.tsx",
  "src/app/thoughts/testing/page.tsx",
];

/**
 * Three digits or more. The suite passed a thousand long ago, so anything
 * smaller is a number about something else, and matching it would mean
 * flagging every "108 tests" in a dated transcript.
 */
const HARDCODED_COUNT = /(\d[\d,]{2,})\+?\s*(?:tests?|unit|e2e)\b/gi;

/**
 * Numbers that are true about a moment and must not be updated.
 *
 * The testing write-up's chat is an account of adding the first tests to a
 * codebase that had none. "108 tests across 7 files" was the state at the end
 * of that work. Rewriting it to today's number would turn a record of what
 * happened into a claim that never happened.
 */
const FROZEN_IN_HISTORY = new Set([108]);

const read = (file: string): string => readFileSync(join(ROOT, file), "utf-8");

const countsIn = (source: string): number[] =>
  [...source.matchAll(HARDCODED_COUNT)]
    .map((m) => Number(m[1].replace(/,/g, "")))
    .filter((n) => !FROZEN_IN_HISTORY.has(n));

describe("test count claims", () => {
  it.each(CLAIM_FILES)("does not hardcode a test count in %s", (file) => {
    expect(countsIn(read(file))).toEqual([]);
  });

  it("has a real count to derive from", () => {
    expect(TEST_COUNT).toBeGreaterThan(0);
  });

  it("actually spots a hardcoded count, so the check can fail", () => {
    expect(countsIn("640+ tests (623 unit + 17 e2e)")).toEqual([640, 623]);
  });

  it("leaves the historical ones alone", () => {
    expect(countsIn("108 tests across 7 files")).toEqual([]);
  });
});
