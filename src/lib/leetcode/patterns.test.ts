import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { PATTERNS, patternById, leetCodeUrl } from "./patterns";

/**
 * The curriculum is data, so it gets checked like data. These are the
 * mistakes that slip through a review of 200 rows: a slug filed under two
 * patterns, a prerequisite that points forward in the roadmap, a deep-dive
 * link to a page that was renamed, a ladder with nothing easy to start on.
 */

const allProblems = PATTERNS.flatMap((p) => p.problems.map((problem) => ({ owner: p.id, ...problem })));

describe("the pattern catalogue", () => {
  it("covers the patterns interviews actually draw from", () => {
    expect(PATTERNS.length).toBeGreaterThanOrEqual(22);
    for (const id of [
      "arrays-hashing",
      "two-pointers",
      "sliding-window",
      "prefix-sum",
      "stack",
      "monotonic-stack",
      "binary-search",
      "linked-list",
      "tree-dfs",
      "tree-bfs",
      "heap",
      "backtracking",
      "graphs",
      "topological-sort",
      "union-find",
      "dp-1d",
      "dp-2d",
      "intervals",
      "greedy",
      "trie",
    ]) {
      expect(patternById(id)?.id).toBe(id);
    }
  });

  it("gives every pattern a unique, url-safe id", () => {
    const ids = PATTERNS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("only builds on patterns that come earlier in the roadmap", () => {
    PATTERNS.forEach((pattern, index) => {
      for (const prerequisite of pattern.prerequisites) {
        const at = PATTERNS.findIndex((p) => p.id === prerequisite);
        expect(at, `${pattern.id} needs ${prerequisite}`).toBeGreaterThanOrEqual(0);
        expect(at, `${pattern.id} needs ${prerequisite}`).toBeLessThan(index);
      }
    });
  });

  it("orders phases without going backwards", () => {
    const phases = PATTERNS.map((p) => p.phase);
    expect([...phases].sort((a, b) => a - b)).toEqual(phases);
  });

  it("teaches recognition: enough signals, an anti-signal, and the question to ask", () => {
    for (const pattern of PATTERNS) {
      expect(pattern.signals.length, pattern.id).toBeGreaterThanOrEqual(5);
      expect(pattern.antiSignals.length, pattern.id).toBeGreaterThanOrEqual(1);
      expect(pattern.question.endsWith("?"), pattern.id).toBe(true);
      for (const signal of pattern.signals) {
        expect(signal.phrase, pattern.id).toBe(signal.phrase.toLowerCase());
        expect(signal.why.length, `${pattern.id}: ${signal.phrase}`).toBeGreaterThan(10);
      }
    }
  });

  it("gives every pattern a template, pitfalls and JavaScript notes", () => {
    for (const pattern of PATTERNS) {
      expect(pattern.template.code.length, pattern.id).toBeGreaterThan(40);
      expect(pattern.pitfalls.length, pattern.id).toBeGreaterThanOrEqual(2);
      expect(pattern.jsNotes.length, pattern.id).toBeGreaterThanOrEqual(1);
    }
  });

  it("links deep-dives only to learn pages that exist", () => {
    for (const pattern of PATTERNS.filter((p) => p.deepDive)) {
      const page = join(process.cwd(), "src/app", pattern.deepDive!, "page.tsx");
      expect(existsSync(page), pattern.deepDive).toBe(true);
    }
  });
});

describe("the problem ladders", () => {
  it("lists each problem once across the whole catalogue", () => {
    const slugs = allProblems.map((p) => p.slug);
    const duplicates = slugs.filter((s, i) => slugs.indexOf(s) !== i);
    expect(duplicates).toEqual([]);
  });

  it("gives every pattern a ladder of at least six that starts no harder than medium", () => {
    for (const pattern of PATTERNS) {
      expect(pattern.problems.length, pattern.id).toBeGreaterThanOrEqual(6);
      expect(pattern.problems[0].difficulty, pattern.id).not.toBe("Hard");
    }
  });

  it("orders each ladder easy to hard", () => {
    const rank = { Easy: 0, Medium: 1, Hard: 2 } as const;
    for (const pattern of PATTERNS) {
      const ranks = pattern.problems.map((p) => rank[p.difficulty]);
      expect([...ranks].sort((a, b) => a - b), pattern.id).toEqual(ranks);
    }
  });

  it("uses LeetCode slugs and writes a prompt and a tell for each", () => {
    for (const problem of allProblems) {
      expect(problem.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(problem.prompt.length, problem.slug).toBeGreaterThan(30);
      expect(problem.tell.length, problem.slug).toBeGreaterThan(20);
    }
  });

  it("only lists alternatives that are other real patterns", () => {
    for (const problem of allProblems) {
      for (const alternative of problem.alsoAccept ?? []) {
        expect(patternById(alternative), `${problem.slug} → ${alternative}`).toBeDefined();
        expect(alternative).not.toBe(problem.owner);
      }
    }
  });

  it("builds the LeetCode link from the slug", () => {
    expect(leetCodeUrl("two-sum")).toBe("https://leetcode.com/problems/two-sum/");
  });
});
