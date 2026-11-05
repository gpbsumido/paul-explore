import type { Pattern, Solution } from "./types";
import { arraysHashingSolutions } from "./solutions/arraysHashing";
import { twoPointersSolutions } from "./solutions/twoPointers";
import { slidingWindowSolutions } from "./solutions/slidingWindow";
import { prefixSumSolutions } from "./solutions/prefixSum";
import { stackSolutions } from "./solutions/stack";
import { binarySearchSolutions } from "./solutions/binarySearch";
import { linkedListSolutions } from "./solutions/linkedList";
import { monotonicStackSolutions } from "./solutions/monotonicStack";
import { treeDfsSolutions } from "./solutions/treeDfs";
import { treeBfsSolutions } from "./solutions/treeBfs";
import { bstSolutions } from "./solutions/bst";
import { heapSolutions } from "./solutions/heap";
import { intervalsSolutions } from "./solutions/intervals";
import { trieSolutions } from "./solutions/trie";
import { backtrackingSolutions } from "./solutions/backtracking";
import { graphsSolutions } from "./solutions/graphs";
import { topologicalSortSolutions } from "./solutions/topologicalSort";
import { unionFindSolutions } from "./solutions/unionFind";
import { shortestPathSolutions } from "./solutions/shortestPath";

/**
 * Every ladder problem's solution, keyed by LeetCode slug. It's kept apart
 * from PATTERNS on purpose: the hub and the drill ship PATTERNS to the
 * browser, and 223 solutions would roughly double what they download. Only
 * the pattern page's server component reads this, and it hands the client
 * just that pattern's share.
 */
export const SOLUTIONS: Readonly<Record<string, Solution>> = {
  ...arraysHashingSolutions,
  ...twoPointersSolutions,
  ...slidingWindowSolutions,
  ...prefixSumSolutions,
  ...stackSolutions,
  ...binarySearchSolutions,
  ...linkedListSolutions,
  ...monotonicStackSolutions,
  ...treeDfsSolutions,
  ...treeBfsSolutions,
  ...bstSolutions,
  ...heapSolutions,
  ...intervalsSolutions,
  ...trieSolutions,
  ...backtrackingSolutions,
  ...graphsSolutions,
  ...topologicalSortSolutions,
  ...unionFindSolutions,
  ...shortestPathSolutions,
};

/**
 * The solutions for one pattern's ladder.
 * @param pattern - the pattern whose problems to look up
 * @returns the solutions keyed by slug, leaving out any problem without one
 */
export function solutionsForPattern(pattern: Pattern): Readonly<Record<string, Solution>> {
  return Object.fromEntries(
    pattern.problems.flatMap((problem) => {
      const solution = SOLUTIONS[problem.slug];
      return solution ? [[problem.slug, solution]] : [];
    }),
  );
}
