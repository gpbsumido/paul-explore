import { describe, it, expect } from "vitest";
import { fuzzyMatch } from "../fuzzy";

describe("fuzzyMatch", () => {
  it("matches an empty query with a zero score and no ranges", () => {
    const result = fuzzyMatch("Calendar", "");
    expect(result).toEqual({ matched: true, score: 0, ranges: [] });
  });

  it("fails when the query is not a subsequence of the text", () => {
    const result = fuzzyMatch("Calendar", "xyz");
    expect(result.matched).toBe(false);
    expect(result.ranges).toEqual([]);
  });

  it("matches a scattered subsequence", () => {
    const result = fuzzyMatch("Calendar", "cln");
    expect(result.matched).toBe(true);
  });

  it("is case insensitive", () => {
    expect(fuzzyMatch("Calendar", "CAL").matched).toBe(true);
    expect(fuzzyMatch("calendar", "Cal").matched).toBe(true);
  });

  it("reports contiguous ranges over the matched characters", () => {
    // "cal" matches the first three characters as one contiguous run.
    const result = fuzzyMatch("Calendar", "cal");
    expect(result.ranges).toEqual([{ start: 0, end: 3 }]);
  });

  it("splits ranges when matched characters are not adjacent", () => {
    // In "Calendar" c=0 and n=4, so two separate single-character ranges.
    const result = fuzzyMatch("Calendar", "cn");
    expect(result.ranges).toEqual([
      { start: 0, end: 1 },
      { start: 4, end: 5 },
    ]);
  });

  it("scores a prefix match higher than a mid-word match", () => {
    const prefix = fuzzyMatch("Calendar", "cal");
    const midWord = fuzzyMatch("Vertical", "cal");
    expect(prefix.matched && midWord.matched).toBe(true);
    expect(prefix.score).toBeGreaterThan(midWord.score);
  });

  it("scores a consecutive match higher than a scattered one", () => {
    const consecutive = fuzzyMatch("abcd", "abc");
    const scattered = fuzzyMatch("axbxc", "abc");
    expect(consecutive.score).toBeGreaterThan(scattered.score);
  });

  it("rewards matches at word boundaries", () => {
    // "wp" hits the start of two words in "Work Portfolio".
    const boundary = fuzzyMatch("Work Portfolio", "wp");
    const nonBoundary = fuzzyMatch("Wrapper Panel", "wp");
    expect(boundary.matched && nonBoundary.matched).toBe(true);
    expect(boundary.score).toBeGreaterThan(nonBoundary.score);
  });
});
