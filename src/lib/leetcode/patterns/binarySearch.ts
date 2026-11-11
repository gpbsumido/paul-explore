import type { Pattern } from "../types";

export const binarySearch: Pattern = {
  id: "binary-search",
  name: "Binary Search",
  phase: 1,
  tagline: "If you can tell which half the answer is in, throw the other half away.",
  summary:
    "Binary search needs a monotonic yes/no question, not necessarily a sorted array. On a sorted array the question is \"is this value at least the target?\". On a rotated array it's \"which half is sorted, and is the target in it?\". On the answer itself it's \"can I finish with speed x?\", where every x above the minimum also works. Find that boundary and you halve the space each step: O(log n), or O(n log range) when each check is linear.",
  question: "Is there a yes/no test that is false up to some point and true after it?",
  signals: [
    { phrase: "sorted", why: "Sorted data is the classic precondition for halving.", weight: 1 },
    { phrase: "o(log n)", why: "A log-time requirement is a near-certain binary search.", weight: 3 },
    { phrase: "rotated", why: "One half of a rotated sorted array is always sorted; decide which.", weight: 2 },
    { phrase: "minimum speed", why: "Minimise a rate such that a deadline is met: binary search the answer.", weight: 2 },
    { phrase: "minimum capacity", why: "Smallest capacity that works: binary search over capacities with a greedy check.", weight: 2 },
    { phrase: "within d days", why: "A deadline with a feasibility check is binary search on the answer." },
    { phrase: "within h hours", why: "Feasible-by-deadline is monotonic in the rate." },
    { phrase: "first and last position", why: "Two boundary searches: leftmost and rightmost.", weight: 2 },
    { phrase: "insert position", why: "The lower bound: first index whose value is at least target.", weight: 2 },
    { phrase: "first bad version", why: "False, false, ..., true, true: find the first true.", weight: 2 },
    { phrase: "search a 2d matrix", why: "A row-major sorted matrix is one sorted list in disguise.", weight: 2 },
    { phrase: "peak", why: "Compare with a neighbour to know which side rises." },
    { phrase: "median of two sorted", why: "Binary search the partition of the smaller array.", weight: 2 },
    { phrase: "timestamp", why: "Values stored in time order: find the latest at or before a time." },
    { phrase: "minimize the maximum", why: "Min-max questions binary search the max and check feasibility greedily.", weight: 2 },
  ],
  antiSignals: [
    "No monotonic property exists: if a yes at x tells you nothing about x + 1, halving can't work.",
    "You only need one pass over unsorted data: O(n) beats sorting just to search.",
  ],
  complexity: { time: "O(log n), or O(n log range) on the answer", space: "O(1)" },
  template: {
    title: "One template: find the first index where the test is true",
    explanation:
      "lo and hi bracket the answer, with hi starting one past the end so \"not found\" has somewhere to land. If mid passes, the answer is mid or earlier, so hi = mid. If it fails, lo = mid + 1. The loop ends with lo === hi on the first passing index. Every binary search question is this with a different test.",
    code: `function lowerBound(nums: number[], target: number): number {
  let lo = 0;
  let hi = nums.length;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (nums[mid] >= target) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}

function search(nums: number[], target: number): number {
  const i = lowerBound(nums, target);
  return nums[i] === target ? i : -1;
}`,
    cases: [
      { call: "search([-1, 0, 3, 5, 9, 12], 9)", expected: 4 },
      { call: "search([-1, 0, 3, 5, 9, 12], 2)", expected: -1 },
      { call: "lowerBound([1, 3, 5, 6], 7)", expected: 4 },
      { call: "lowerBound([1, 3, 5, 6], 0)", expected: 0 },
    ],
  },
  variants: [
    {
      title: "Binary search on the answer",
      explanation:
        "Koko Eating Bananas: the speed is the search space, 1 to the largest pile. canFinish is monotonic (faster always still finishes), so find the first speed where it's true. The same shape solves shipping capacity, splitting arrays and minimum days.",
      code: `function minEatingSpeed(piles: number[], h: number): number {
  const canFinish = (speed: number) =>
    piles.reduce((hours, pile) => hours + Math.ceil(pile / speed), 0) <= h;
  let lo = 1;
  let hi = Math.max(...piles);
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (canFinish(mid)) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}`,
      cases: [
        { call: "minEatingSpeed([3, 6, 7, 11], 8)", expected: 4 },
        { call: "minEatingSpeed([30, 11, 23, 4, 20], 5)", expected: 30 },
      ],
    },
    {
      title: "Rotated sorted array",
      explanation:
        "Find Minimum in Rotated Sorted Array: compare mid with the right end. If nums[mid] > nums[hi], the drop is to the right of mid; otherwise mid could be the minimum, so keep it.",
      code: `function findMin(nums: number[]): number {
  let lo = 0;
  let hi = nums.length - 1;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (nums[mid] > nums[hi]) lo = mid + 1;
    else hi = mid;
  }
  return nums[lo];
}`,
      cases: [
        { call: "findMin([3, 4, 5, 1, 2])", expected: 1 },
        { call: "findMin([11, 13, 15, 17])", expected: 11 },
      ],
    },
  ],
  pitfalls: [
    "Mixing conventions: hi = n with while (lo < hi) is half-open; hi = n - 1 with while (lo <= hi) is closed. Mixing them is how infinite loops and skipped elements happen.",
    "lo = mid instead of mid + 1 when mid fails. With two elements left, mid equals lo and the loop never ends.",
    "Searching the answer space with bounds that don't include the answer. Write down why lo and hi are the smallest and largest possible answers.",
  ],
  jsNotes: [
    "There's no integer division: Math.floor((lo + hi) / 2), or (lo + hi) >> 1 when you know the sum stays under 2^31.",
    "Math.max(...arr) spreads every element as an argument and throws past roughly 100k elements. Use a loop or reduce on huge inputs.",
  ],
  deepDive: "/learn/binary-search",
  prerequisites: [],
  problems: [
    {
      slug: "binary-search",
      title: "Binary Search",
      difficulty: "Easy",
      prompt: "Given a sorted array of integers and a target, return the target's index or -1. You must write an algorithm with O(log n) runtime.",
      tell: "\"Sorted\" plus \"O(log n)\". Write the template from memory until it's automatic.",
    },
    {
      slug: "search-insert-position",
      title: "Search Insert Position",
      difficulty: "Easy",
      prompt: "Given a sorted array and a target, return the index where the target is, or the insert position where it would go, in O(log n).",
      tell: "\"Insert position\" is the lower bound, the first index with value at least target. Exactly the template.",
    },
    {
      slug: "first-bad-version",
      title: "First Bad Version",
      difficulty: "Easy",
      prompt: "Versions 1 to n: once one is bad, every later version is bad. Using an isBadVersion API, find the first bad version with as few calls as possible.",
      tell: "\"First bad version\" over a good...good bad...bad sequence is the textbook monotonic test.",
    },
    {
      slug: "search-a-2d-matrix",
      title: "Search a 2D Matrix",
      difficulty: "Medium",
      prompt: "Each row is sorted and each row starts after the previous row ends. Search a 2D matrix for a target in O(log(m * n)).",
      tell: "Rows chained in order make one sorted list. Binary search index i as matrix[Math.floor(i / n)][i % n].",
    },
    {
      slug: "find-first-and-last-position-of-element-in-sorted-array",
      title: "Find First and Last Position of Element in Sorted Array",
      difficulty: "Medium",
      prompt: "In a sorted array, find the first and last position of a target value in O(log n), or [-1, -1].",
      tell: "\"First and last position\": lowerBound(target) and lowerBound(target + 1) - 1. Two boundary searches.",
    },
    {
      slug: "koko-eating-bananas",
      title: "Koko Eating Bananas",
      difficulty: "Medium",
      prompt: "Koko eats from piles at k bananas per hour and must finish within h hours. Return the minimum speed k that lets her finish.",
      tell: "\"Minimum speed\" to finish \"within h hours\": a faster speed always still works, so binary search the speed.",
    },
    {
      slug: "find-minimum-in-rotated-sorted-array",
      title: "Find Minimum in Rotated Sorted Array",
      difficulty: "Medium",
      prompt: "A sorted array of unique values has been rotated. Find the minimum element in O(log n).",
      tell: "\"Rotated\" sorted plus \"O(log n)\": compare mid with the right end to find which side holds the drop.",
    },
    {
      slug: "search-in-rotated-sorted-array",
      title: "Search in Rotated Sorted Array",
      difficulty: "Medium",
      prompt: "A sorted array has been rotated at an unknown pivot. Return the index of target, or -1, in O(log n).",
      tell: "One half around mid is always sorted. Check whether the target lies in that sorted half; if not, it's in the other.",
    },
    {
      slug: "time-based-key-value-store",
      title: "Time Based Key-Value Store",
      difficulty: "Medium",
      prompt: "Design a store that saves values per key with a timestamp, and returns the value with the largest timestamp at or before a query time.",
      tell: "Timestamps arrive increasing, so each key's list is sorted. \"Largest timestamp at or before\" is a boundary search.",
      alsoAccept: ["arrays-hashing"],
    },
    {
      slug: "capacity-to-ship-packages-within-d-days",
      title: "Capacity To Ship Packages Within D Days",
      difficulty: "Medium",
      prompt: "Packages must ship in order within d days. Return the minimum capacity of the ship that makes it possible.",
      tell: "\"Minimum capacity\" \"within d days\": binary search capacity from max(weight) to sum(weights), with a greedy day count as the test.",
    },
    {
      slug: "median-of-two-sorted-arrays",
      title: "Median of Two Sorted Arrays",
      difficulty: "Hard",
      prompt: "Return the median of two sorted arrays in O(log (m + n)) time.",
      tell: "\"Median of two sorted\" arrays in log time: binary search how many elements the smaller array contributes to the left half.",
    },
  ],
};
