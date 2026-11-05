import type { Pattern } from "../types";
import { arraysHashing } from "./arraysHashing";
import { twoPointers } from "./twoPointers";
import { slidingWindow } from "./slidingWindow";
import { prefixSum } from "./prefixSum";
import { stack } from "./stack";
import { binarySearch } from "./binarySearch";
import { linkedList } from "./linkedList";
import { monotonicStack } from "./monotonicStack";
import { treeDfs } from "./treeDfs";
import { treeBfs } from "./treeBfs";
import { bst } from "./bst";
import { heap } from "./heap";
import { intervals } from "./intervals";
import { trie } from "./trie";
import { backtracking } from "./backtracking";
import { graphs } from "./graphs";
import { topologicalSort } from "./topologicalSort";
import { unionFind } from "./unionFind";
import { shortestPath } from "./shortestPath";
import { greedy } from "./greedy";
import { dp1d } from "./dp1d";
import { dp2d } from "./dp2d";
import { bitManipulation } from "./bitManipulation";

/**
 * Every pattern in roadmap order. The order is the study order: each one only
 * builds on patterns that come before it, and the phases never go backwards.
 */
export const PATTERNS: readonly Pattern[] = [
  arraysHashing,
  twoPointers,
  slidingWindow,
  prefixSum,
  stack,
  binarySearch,
  linkedList,
  monotonicStack,
  treeDfs,
  treeBfs,
  bst,
  heap,
  intervals,
  trie,
  backtracking,
  graphs,
  topologicalSort,
  unionFind,
  shortestPath,
  greedy,
  dp1d,
  dp2d,
  bitManipulation,
];

/**
 * Looks a pattern up by its url id.
 * @param id - the pattern id, like "sliding-window"
 * @returns the pattern, or undefined when nothing has that id
 */
export function patternById(id: string): Pattern | undefined {
  return PATTERNS.find((pattern) => pattern.id === id);
}

/**
 * Builds the LeetCode problem link for a slug.
 * @param slug - the problem slug, like "two-sum"
 * @returns the full problem url with a trailing slash
 */
export function leetCodeUrl(slug: string): string {
  return `https://leetcode.com/problems/${slug}/`;
}
