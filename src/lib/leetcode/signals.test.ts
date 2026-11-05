import { describe, it, expect } from "vitest";
import {
  rankPatternsForText,
  findSignalSpans,
  complexityBudgetForInputSize,
} from "./signals";
import { PATTERNS } from "./patterns";

describe("rankPatternsForText", () => {
  it("puts sliding window first for a longest-substring question", () => {
    const ranked = rankPatternsForText(
      "Given a string s, find the length of the longest substring without repeating characters.",
    );
    expect(ranked[0]?.patternId).toBe("sliding-window");
    expect(ranked[0]?.matchedPhrases).toContain("longest substring");
  });

  it("reads 'kth largest' as a heap question", () => {
    const ranked = rankPatternsForText("Return the kth largest element in an unsorted array.");
    expect(ranked[0]?.patternId).toBe("heap");
  });

  it("reads prerequisites as a topological sort", () => {
    const ranked = rankPatternsForText(
      "There are numCourses courses. Some courses have prerequisites. Return an ordering of courses you should take.",
    );
    expect(ranked[0]?.patternId).toBe("topological-sort");
  });

  it("is case-insensitive and ignores matches inside other words", () => {
    const upper = rankPatternsForText("RETURN THE KTH LARGEST ELEMENT");
    expect(upper[0]?.patternId).toBe("heap");
    // "stack" inside "haystack" is not a stack signal
    const hay = rankPatternsForText("find the needle in the haystack");
    expect(hay.flatMap((m) => m.matchedPhrases)).not.toContain("stack");
  });

  it("returns nothing for text with no signals", () => {
    expect(rankPatternsForText("hello there")).toEqual([]);
    expect(rankPatternsForText("")).toEqual([]);
  });

  it("recognises its own curriculum: each problem's prompt ranks its pattern in the top three for at least 80% of problems", () => {
    const problems = PATTERNS.flatMap((p) =>
      p.problems.map((problem) => ({ owner: p.id, problem })),
    );
    const hits = problems.filter(({ owner, problem }) => {
      const accepted = [owner, ...(problem.alsoAccept ?? [])];
      return rankPatternsForText(problem.prompt)
        .slice(0, 3)
        .some((m) => accepted.includes(m.patternId));
    });
    const accuracy = hits.length / problems.length;
    expect(problems.length).toBeGreaterThan(150);
    expect(accuracy).toBeGreaterThanOrEqual(0.8);
  });
});

describe("findSignalSpans", () => {
  it("returns non-overlapping spans in reading order so the phrase can be highlighted", () => {
    const text = "Find the longest substring with at most k distinct characters";
    const spans = findSignalSpans(text, ["at most k", "longest substring", "substring"]);
    expect(spans.map((s) => text.slice(s.start, s.end))).toEqual([
      "longest substring",
      "at most k",
    ]);
  });

  it("returns no spans when nothing matches", () => {
    expect(findSignalSpans("plain words", ["heap"])).toEqual([]);
  });
});

describe("complexityBudgetForInputSize", () => {
  it.each([
    [10, "O(n!)"],
    [20, "O(2^n)"],
    [400, "O(n^3)"],
    [5_000, "O(n^2)"],
    [100_000, "O(n log n)"],
    [10_000_000, "O(n)"],
    [10 ** 12, "O(log n)"],
  ])("n = %d leaves room for %s", (n, budget) => {
    expect(complexityBudgetForInputSize(n).budget).toBe(budget);
  });

  it("treats the boundary as inclusive, the way constraints are written", () => {
    expect(complexityBudgetForInputSize(100_000).budget).toBe("O(n log n)");
    expect(complexityBudgetForInputSize(10_000).budget).toBe("O(n^2)");
  });

  it("refuses a size that is not a positive number", () => {
    expect(() => complexityBudgetForInputSize(0)).toThrow();
    expect(() => complexityBudgetForInputSize(Number.NaN)).toThrow();
  });
});
