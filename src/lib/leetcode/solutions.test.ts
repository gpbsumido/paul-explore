import { describe, it, expect } from "vitest";
import { PATTERNS } from "./patterns";
import { SOLUTIONS, solutionsForPattern } from "./solutionCatalog";

const problems = PATTERNS.flatMap((pattern) => pattern.problems.map((problem) => ({ pattern, problem })));

describe("the solution catalogue", () => {
  it("has a solution for every problem on every ladder", () => {
    const missing = problems.filter(({ problem }) => SOLUTIONS[problem.slug] === undefined).map(({ problem }) => problem.slug);
    expect(missing).toEqual([]);
  });

  it("has no solutions for problems that aren't on a ladder", () => {
    const listed = new Set(problems.map(({ problem }) => problem.slug));
    expect(Object.keys(SOLUTIONS).filter((slug) => !listed.has(slug))).toEqual([]);
  });

  it.each(problems.map(({ problem }) => problem.slug))(
    "%s explains the logic in steps, states its cost, and proves itself with checks",
    (slug) => {
      const solution = SOLUTIONS[slug];
      if (!solution) return;
      expect(solution.approach.length).toBeGreaterThanOrEqual(2);
      expect(solution.complexity.time).toMatch(/^O\(/);
      expect(solution.complexity.space).toMatch(/^O\(/);
      expect(solution.cases.length).toBeGreaterThanOrEqual(2);
    },
  );

  it.each(Object.entries(SOLUTIONS).flatMap(([slug, solution]) => (solution.alternative ? [{ slug, alternative: solution.alternative }] : [])))(
    "$slug's second way is named and held to the same bar",
    ({ alternative }) => {
      expect(alternative.name.length).toBeGreaterThan(0);
      expect(alternative.approach.length).toBeGreaterThanOrEqual(2);
      expect(alternative.complexity.time).toMatch(/^O\(/);
      expect(alternative.complexity.space).toMatch(/^O\(/);
      expect(alternative.cases.length).toBeGreaterThanOrEqual(2);
    },
  );

  it("hands a pattern page only its own problems' solutions", () => {
    const pattern = PATTERNS[0];
    expect(Object.keys(solutionsForPattern(pattern)).sort()).toEqual(pattern.problems.map((p) => p.slug).sort());
  });
});
