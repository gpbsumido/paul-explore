import type { Pattern } from "../types";

export const twoPointers: Pattern = {
  id: "two-pointers",
  name: "Two Pointers",
  phase: 1,
  tagline: "Two indices, each move ruling out a whole row of pairs.",
  summary:
    "When the input is sorted (or you can sort it), comparing the values at two indices tells you which one can't be part of the answer, so you move it and never look back. Opposite ends walking inward handle pair-sum and palindrome questions; a slow write pointer behind a fast read pointer handles in-place filtering. Either way it's O(n) time and O(1) space, which is the usual follow-up to a hash-map answer.",
  question: "If I compare the two ends, does the result tell me which end can't possibly be in the answer?",
  signals: [
    { phrase: "sorted array", why: "Sorted order is what lets one comparison discard a pointer's whole row of pairs.", weight: 2 },
    { phrase: "sorted in non-decreasing order", why: "LeetCode's way of saying sorted, which is the precondition for walking inward." },
    { phrase: "palindrome", why: "Compare the outermost pair and walk inward." },
    { phrase: "in-place", why: "In-place filtering is a read pointer and a write pointer." },
    { phrase: "triplets", why: "Fix one element, then two pointers on the rest: 3Sum and friends.", weight: 2 },
    { phrase: "sum to zero", why: "k-sum questions reduce to two-pointer pair sums on sorted input." },
    { phrase: "container", why: "Container With Most Water: always move the shorter wall.", weight: 2 },
    { phrase: "move all", why: "Move zeroes and similar: a write pointer collects the keepers." },
    { phrase: "remove duplicates", why: "In a sorted array, a slow pointer marks the end of the unique prefix." },
    { phrase: "constant extra space", why: "O(1) space on an array question usually means two pointers instead of a hash map." },
    { phrase: "merge", why: "Merging sorted sequences walks one pointer per sequence." },
    { phrase: "trap", why: "Trapping Rain Water: two pointers carry the running max from each side." },
  ],
  antiSignals: [
    "The input is unsorted and you need original indices: sorting loses them, so reach for a hash map.",
    "The answer is a contiguous window with a condition on its contents: that's a sliding window (which is a same-direction two-pointer, with state).",
  ],
  complexity: { time: "O(n), or O(n log n) if you sort first", space: "O(1)" },
  template: {
    title: "Opposite ends, walk inward",
    explanation:
      "The sum is too small, so the left value can't pair with anything to the right of the current right pointer either. Move it. Too big: move right. Each step discards a whole set of pairs, which is why it's linear.",
    code: `function twoSumSorted(numbers: number[], target: number): number[] {
  let left = 0;
  let right = numbers.length - 1;
  while (left < right) {
    const sum = numbers[left] + numbers[right];
    if (sum === target) return [left + 1, right + 1];
    if (sum < target) left++;
    else right--;
  }
  return [];
}`,
    cases: [
      { call: "twoSumSorted([2, 7, 11, 15], 9)", expected: [1, 2] },
      { call: "twoSumSorted([-1, 0], -1)", expected: [1, 2] },
    ],
  },
  variants: [
    {
      title: "Read and write pointers",
      explanation:
        "The write pointer marks the end of the kept prefix; the read pointer scans everything. Anything kept is copied to write, then write advances. It's the shape behind Remove Duplicates, Move Zeroes and Remove Element.",
      code: `function removeDuplicates(nums: number[]): number {
  let write = 0;
  for (let read = 0; read < nums.length; read++) {
    if (read === 0 || nums[read] !== nums[write - 1]) {
      nums[write] = nums[read];
      write++;
    }
  }
  return write;
}`,
      cases: [
        { call: "removeDuplicates([1, 1, 2])", expected: 2 },
        { call: "(() => { const a = [0, 0, 1, 1, 1, 2, 2, 3, 3, 4]; const k = removeDuplicates(a); return a.slice(0, k); })()", expected: [0, 1, 2, 3, 4] },
      ],
    },
    {
      title: "Fix one, two-pointer the rest",
      explanation:
        "3Sum: sort, then for each anchor run the inward walk on the suffix. Skip equal anchors and equal neighbours after a hit, or the answer fills with duplicate triplets.",
      code: `function threeSum(nums: number[]): number[][] {
  const sorted = [...nums].sort((a, b) => a - b);
  const result: number[][] = [];
  for (let i = 0; i < sorted.length - 2; i++) {
    if (i > 0 && sorted[i] === sorted[i - 1]) continue;
    let left = i + 1;
    let right = sorted.length - 1;
    while (left < right) {
      const sum = sorted[i] + sorted[left] + sorted[right];
      if (sum < 0) left++;
      else if (sum > 0) right--;
      else {
        result.push([sorted[i], sorted[left], sorted[right]]);
        left++;
        right--;
        while (left < right && sorted[left] === sorted[left - 1]) left++;
      }
    }
  }
  return result;
}`,
      cases: [
        { call: "threeSum([-1, 0, 1, 2, -1, -4])", expected: [[-1, -1, 2], [-1, 0, 1]] },
        { call: "threeSum([0, 0, 0, 0])", expected: [[0, 0, 0]] },
      ],
    },
  ],
  pitfalls: [
    "while (left <= right) on a pair search lets an element pair with itself. Pairs need left < right.",
    "Forgetting to skip duplicates in 3Sum. Interviewers check for it with [0, 0, 0, 0].",
    "Sorting destroys original indices. If the question wants indices from unsorted input, sort [value, index] pairs or use a hash map instead.",
  ],
  jsNotes: [
    "sort() without a comparator sorts numbers as strings. Always (a, b) => a - b.",
    "Swap in place with destructuring: [nums[i], nums[j]] = [nums[j], nums[i]].",
  ],
  deepDive: "/learn/two-pointers",
  prerequisites: ["arrays-hashing"],
  problems: [
    {
      slug: "valid-palindrome",
      title: "Valid Palindrome",
      difficulty: "Easy",
      prompt: "After lowercasing and dropping non-alphanumeric characters, does the string read the same forwards and backwards? Return whether it is a palindrome.",
      tell: "\"Palindrome\" means comparing mirrored positions: one pointer from each end, skipping characters that don't count.",
    },
    {
      slug: "merge-sorted-array",
      title: "Merge Sorted Array",
      difficulty: "Easy",
      prompt: "Merge the second sorted array into the first, which has spare room at the end. Do it in-place and keep the result sorted.",
      tell: "\"Merge\" two sorted arrays \"in-place\": fill from the back with one pointer per array, so nothing gets overwritten before it's read.",
    },
    {
      slug: "move-zeroes",
      title: "Move Zeroes",
      difficulty: "Easy",
      prompt: "Move all zeros to the end of the array in-place, keeping the relative order of the non-zero elements.",
      tell: "\"Move all\" plus \"in-place\": a write pointer collects non-zero values in order, then the tail is zero.",
    },
    {
      slug: "remove-duplicates-from-sorted-array",
      title: "Remove Duplicates from Sorted Array",
      difficulty: "Easy",
      prompt: "Given a sorted array, remove duplicates in-place so each value appears once, and return how many unique values remain.",
      tell: "Sorted means duplicates are adjacent. \"Remove duplicates in-place\" is the read and write pointer shape.",
    },
    {
      slug: "two-sum-ii-input-array-is-sorted",
      title: "Two Sum II - Input Array Is Sorted",
      difficulty: "Medium",
      prompt: "The array is sorted in non-decreasing order. Find the pair that sums to target and return their 1-based indices, using only constant extra space.",
      tell: "Same question as Two Sum, but \"sorted\" and \"constant extra space\" take the hash map away and hand you two pointers instead.",
    },
    {
      slug: "3sum",
      title: "3Sum",
      difficulty: "Medium",
      prompt: "Return all unique triplets in the array that sum to zero. The answer must not contain duplicate triplets.",
      tell: "\"Triplets\" that \"sum to zero\": sort, fix the first element, two-pointer the rest, skip repeats.",
    },
    {
      slug: "container-with-most-water",
      title: "Container With Most Water",
      difficulty: "Medium",
      prompt: "Given wall heights, pick two walls that together with the x-axis form a container holding the most water. Return that area.",
      tell: "Start widest. The shorter wall caps the height, so moving the taller one can never help. Always move the shorter pointer.",
    },
    {
      slug: "sort-colors",
      title: "Sort Colors",
      difficulty: "Medium",
      prompt: "Sort an array of 0s, 1s and 2s in-place in one pass, without the library sort.",
      tell: "Three values, one pass, \"in-place\": Dutch national flag with three pointers (low, mid, high).",
    },
    {
      slug: "trapping-rain-water",
      title: "Trapping Rain Water",
      difficulty: "Hard",
      prompt: "Given bar heights, compute how much rain water is trapped between the bars after it rains.",
      tell: "Water above a bar is min(max left, max right) minus its height. Two pointers carry both maxima inward, moving whichever side is lower.",
      alsoAccept: ["monotonic-stack", "prefix-sum"],
    },
  ],
};
