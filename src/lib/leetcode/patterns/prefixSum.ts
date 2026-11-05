import type { Pattern } from "../types";

export const prefixSum: Pattern = {
  id: "prefix-sum",
  name: "Prefix Sums",
  phase: 1,
  tagline: "Precompute running totals once, answer any range in O(1).",
  summary:
    "prefix[i] is the sum of everything before index i, so the sum of any range [l, r] is prefix[r + 1] - prefix[l]. That turns repeated range queries from O(n) each into O(1) each. Paired with a hash map of prefixes seen so far, it also counts subarrays with a given sum, and unlike a sliding window it still works when numbers are negative.",
  question: "Could I answer this from the difference between two running totals?",
  signals: [
    { phrase: "subarray sum equals", why: "Count prefixes: how many earlier prefixes equal current - k.", weight: 2 },
    { phrase: "sum of the elements between", why: "Range sums are differences of prefix sums.", weight: 2 },
    { phrase: "range sum", why: "Range sum queries are the textbook prefix-sum use.", weight: 2 },
    { phrase: "multiple queries", why: "Repeated queries pay for one O(n) precomputation." },
    { phrase: "running sum", why: "A running sum is a prefix sum." },
    { phrase: "pivot index", why: "Left sum equals right sum: total minus prefix minus the element.", weight: 2 },
    { phrase: "product of all the elements except", why: "Prefix products from the left times suffix products from the right.", weight: 2 },
    { phrase: "without using the division", why: "No division means prefix and suffix products." },
    { phrase: "multiple of k", why: "Equal prefix remainders mod k bracket a subarray whose sum is a multiple of k.", weight: 2 },
    { phrase: "number of subarrays", why: "Counting subarrays by sum is prefix sums with a frequency map." },
    { phrase: "sum of elements", why: "Sum questions over ranges suggest precomputing totals." },
    { phrase: "odd numbers", why: "Count of odds in a range is a prefix count; nice subarrays use the prefix-count map." },
    { phrase: "rectangle", why: "2D prefix sums answer any rectangle sum with inclusion-exclusion." },
    { phrase: "negative", why: "Negatives break sliding windows, so subarray sums fall back to prefix sums." },
  ],
  antiSignals: [
    "All numbers are positive and you want the shortest or longest window: a sliding window does it in O(1) space.",
    "The array changes between queries: prefix sums go stale; that's a Fenwick or segment tree.",
  ],
  complexity: { time: "O(n) to build, O(1) per query", space: "O(n)" },
  template: {
    title: "Prefix sums with a frequency map",
    explanation:
      "A subarray ending here sums to k exactly when some earlier prefix equals running - k. Counting earlier prefixes in a Map answers it in one pass. Seed the map with {0: 1} for subarrays that start at index 0.",
    code: `function subarraySum(nums: number[], k: number): number {
  const seen = new Map<number, number>([[0, 1]]);
  let running = 0;
  let count = 0;
  for (const n of nums) {
    running += n;
    count += seen.get(running - k) ?? 0;
    seen.set(running, (seen.get(running) ?? 0) + 1);
  }
  return count;
}`,
    cases: [
      { call: "subarraySum([1, 1, 1], 2)", expected: 2 },
      { call: "subarraySum([1, 2, 3], 3)", expected: 2 },
      { call: "subarraySum([1, -1, 0], 0)", expected: 3 },
    ],
  },
  variants: [
    {
      title: "Range sum queries",
      explanation: "One extra slot at the front (prefix[0] = 0) means no special case for l = 0.",
      code: `class NumArray {
  private prefix: number[];
  constructor(nums: number[]) {
    this.prefix = [0];
    for (const n of nums) this.prefix.push(this.prefix[this.prefix.length - 1] + n);
  }
  sumRange(left: number, right: number): number {
    return this.prefix[right + 1] - this.prefix[left];
  }
}`,
      cases: [
        { call: "new NumArray([-2, 0, 3, -5, 2, -1]).sumRange(0, 2)", expected: 1 },
        { call: "new NumArray([-2, 0, 3, -5, 2, -1]).sumRange(2, 5)", expected: -1 },
      ],
    },
    {
      title: "Prefix and suffix products",
      explanation:
        "Product of Array Except Self: answer[i] is the product to its left times the product to its right. One pass left to right, one right to left, no division.",
      code: `function productExceptSelf(nums: number[]): number[] {
  const answer = new Array<number>(nums.length).fill(1);
  let left = 1;
  for (let i = 0; i < nums.length; i++) {
    answer[i] = left;
    left *= nums[i];
  }
  let right = 1;
  for (let i = nums.length - 1; i >= 0; i--) {
    answer[i] *= right;
    right *= nums[i];
  }
  return answer;
}`,
      cases: [{ call: "productExceptSelf([1, 2, 3, 4])", expected: [24, 12, 8, 6] }],
    },
  ],
  pitfalls: [
    "Forgetting to seed {0: 1}, which misses every subarray that starts at index 0.",
    "Updating the map before reading it, which lets an empty subarray count when k is 0.",
    "Off-by-one between prefix[r + 1] - prefix[l] and prefix[r] - prefix[l - 1]. Pick the extra-leading-zero convention and stick to it.",
  ],
  jsNotes: [
    "In JavaScript a remainder keeps the sign of the dividend: -1 % 5 is -1. Normalise with ((x % k) + k) % k before using it as a map key.",
    "Products can exceed 2^53 on large inputs. LeetCode's version guarantees they fit in 32 bits, so say that you checked.",
  ],
  prerequisites: ["arrays-hashing"],
  problems: [
    {
      slug: "running-sum-of-1d-array",
      title: "Running Sum of 1d Array",
      difficulty: "Easy",
      prompt: "Return the running sum of an array, where each position holds the sum of all elements up to and including it.",
      tell: "\"Running sum\" is the definition of a prefix sum. The warm-up for everything else here.",
    },
    {
      slug: "find-pivot-index",
      title: "Find Pivot Index",
      difficulty: "Easy",
      prompt: "Find the leftmost pivot index, where the sum of elements strictly to the left equals the sum of elements strictly to the right.",
      tell: "Left sum equals right sum: keep a running left sum; right is total - left - nums[i].",
    },
    {
      slug: "range-sum-query-immutable",
      title: "Range Sum Query - Immutable",
      difficulty: "Easy",
      prompt: "Design a class that answers multiple queries for the sum of the elements between two indices of a fixed array.",
      tell: "\"Multiple queries\" over \"range sum\" of data that never changes: precompute prefix sums once.",
    },
    {
      slug: "product-of-array-except-self",
      title: "Product of Array Except Self",
      difficulty: "Medium",
      prompt: "Return an array where each position holds the product of all the elements except the one there, in O(n), without using the division operator.",
      tell: "\"Except self\" plus \"without using the division\": prefix products from the left times suffix products from the right.",
    },
    {
      slug: "subarray-sum-equals-k",
      title: "Subarray Sum Equals K",
      difficulty: "Medium",
      prompt: "Return the total number of contiguous subarrays whose sum equals k. Numbers may be negative.",
      tell: "\"Number of subarrays\" whose \"sum equals k\" with negatives allowed: a window can't shrink reliably, so count prefixes in a map.",
      alsoAccept: ["arrays-hashing"],
    },
    {
      slug: "continuous-subarray-sum",
      title: "Continuous Subarray Sum",
      difficulty: "Medium",
      prompt: "Return true if there is a subarray of length at least two whose sum is a multiple of k.",
      tell: "\"Multiple of k\": two prefixes with the same remainder mod k bracket a qualifying subarray. Map remainder to earliest index.",
    },
    {
      slug: "range-sum-query-2d-immutable",
      title: "Range Sum Query 2D - Immutable",
      difficulty: "Medium",
      prompt: "Answer multiple queries for the sum of elements inside a rectangle of a fixed matrix.",
      tell: "2D \"range sum\" over a \"rectangle\": a 2D prefix table and inclusion-exclusion (add the whole, subtract two strips, add back the corner).",
    },
    {
      slug: "count-number-of-nice-subarrays",
      title: "Count Number of Nice Subarrays",
      difficulty: "Medium",
      prompt: "A subarray is nice if it contains exactly k odd numbers. Return the number of nice subarrays.",
      tell: "\"Exactly k\" odd numbers: map each element to 1 if odd, and it becomes subarray sum equals k. Prefix counts again.",
      alsoAccept: ["sliding-window"],
    },
  ],
};
