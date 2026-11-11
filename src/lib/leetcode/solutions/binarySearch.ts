import type { Solution } from "../types";

export const binarySearchSolutions: Record<string, Solution> = {
  "binary-search": {
    approach: [
      "Keep a range [low, high] that would contain the target if it's there.",
      "Look at the middle. If it's the target, done; if it's too small, the target is to the right; otherwise it's to the left.",
      "When the range is empty, the target isn't there.",
    ],
    complexity: { time: "O(log n)", space: "O(1)" },
    code: `function search(nums: number[], target: number): number {
  let low = 0;
  let high = nums.length - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  return -1;
}`,
    cases: [
      { call: "search([-1, 0, 3, 5, 9, 12], 9)", expected: 4 },
      { call: "search([-1, 0, 3, 5, 9, 12], 2)", expected: -1 },
    ],
  },

  "search-insert-position": {
    approach: [
      "This asks for the first index whose value is at least the target, which is a lower bound.",
      "Search over [0, n], where n means after everything.",
      "If the middle is too small, the answer is to the right of it; otherwise the middle might be the answer, so keep it.",
    ],
    complexity: { time: "O(log n)", space: "O(1)" },
    code: `function searchInsert(nums: number[], target: number): number {
  let low = 0;
  let high = nums.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (nums[mid] < target) low = mid + 1;
    else high = mid;
  }
  return low;
}`,
    cases: [
      { call: "searchInsert([1, 3, 5, 6], 5)", expected: 2 },
      { call: "searchInsert([1, 3, 5, 6], 2)", expected: 1 },
      { call: "searchInsert([1, 3, 5, 6], 7)", expected: 4 },
    ],
  },

  "first-bad-version": {
    approach: [
      "Versions go good, good, ..., bad, bad. Find the first bad one.",
      "If the middle is bad, the answer is it or something before it; if it's good, the answer is after it.",
      "Shrink until low meets high.",
    ],
    complexity: { time: "O(log n)", space: "O(1)" },
    code: `function solution(isBadVersion: (version: number) => boolean) {
  return function (n: number): number {
    let low = 1;
    let high = n;
    while (low < high) {
      const mid = low + Math.floor((high - low) / 2);
      if (isBadVersion(mid)) high = mid;
      else low = mid + 1;
    }
    return low;
  };
}`,
    cases: [
      { call: "solution((v) => v >= 4)(5)", expected: 4 },
      { call: "solution((v) => v >= 1)(1)", expected: 1 },
    ],
  },

  "search-a-2d-matrix": {
    approach: [
      "Each row starts after the previous row ends, so the matrix reads as one sorted array.",
      "Binary search over indices 0 to rows · cols - 1.",
      "Index i maps to row floor(i / cols), column i % cols.",
    ],
    complexity: { time: "O(log(m · n))", space: "O(1)" },
    code: `function searchMatrix(matrix: number[][], target: number): boolean {
  const cols = matrix[0].length;
  let low = 0;
  let high = matrix.length * cols - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    const value = matrix[Math.floor(mid / cols)][mid % cols];
    if (value === target) return true;
    if (value < target) low = mid + 1;
    else high = mid - 1;
  }
  return false;
}`,
    cases: [
      { call: "searchMatrix([[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], 3)", expected: true },
      { call: "searchMatrix([[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], 13)", expected: false },
    ],
  },

  "find-first-and-last-position-of-element-in-sorted-array": {
    approach: [
      "Run two lower-bound searches.",
      "The first position is the lower bound of target. The last position is the lower bound of target + 1, minus one.",
      "If the first position is past the end or doesn't hold target, it isn't there.",
    ],
    complexity: { time: "O(log n)", space: "O(1)" },
    code: `function searchRange(nums: number[], target: number): number[] {
  const lowerBound = (value: number) => {
    let low = 0;
    let high = nums.length;
    while (low < high) {
      const mid = (low + high) >> 1;
      if (nums[mid] < value) low = mid + 1;
      else high = mid;
    }
    return low;
  };
  const first = lowerBound(target);
  if (first === nums.length || nums[first] !== target) return [-1, -1];
  return [first, lowerBound(target + 1) - 1];
}`,
    cases: [
      { call: "searchRange([5, 7, 7, 8, 8, 10], 8)", expected: [3, 4] },
      { call: "searchRange([5, 7, 7, 8, 8, 10], 6)", expected: [-1, -1] },
      { call: "searchRange([], 0)", expected: [-1, -1] },
    ],
  },

  "koko-eating-bananas": {
    approach: [
      "Binary search on the answer: the eating speed, from 1 to the biggest pile.",
      "For a speed, the hours needed is the sum of ceil(pile / speed). It only goes down as speed goes up.",
      "Find the smallest speed whose hours fit in h.",
    ],
    complexity: { time: "O(n log m)", space: "O(1)" },
    code: `function minEatingSpeed(piles: number[], h: number): number {
  let low = 1;
  let high = Math.max(...piles);
  while (low < high) {
    const speed = (low + high) >> 1;
    const hours = piles.reduce((total, pile) => total + Math.ceil(pile / speed), 0);
    if (hours <= h) high = speed;
    else low = speed + 1;
  }
  return low;
}`,
    cases: [
      { call: "minEatingSpeed([3, 6, 7, 11], 8)", expected: 4 },
      { call: "minEatingSpeed([30, 11, 23, 4, 20], 5)", expected: 30 },
      { call: "minEatingSpeed([30, 11, 23, 4, 20], 6)", expected: 23 },
    ],
  },

  "find-minimum-in-rotated-sorted-array": {
    approach: [
      "Compare the middle with the right end.",
      "If the middle is bigger, the drop (and the minimum) is to the right of it.",
      "Otherwise the right half is sorted, so the minimum is the middle or to its left.",
    ],
    complexity: { time: "O(log n)", space: "O(1)" },
    code: `function findMin(nums: number[]): number {
  let low = 0;
  let high = nums.length - 1;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (nums[mid] > nums[high]) low = mid + 1;
    else high = mid;
  }
  return nums[low];
}`,
    cases: [
      { call: "findMin([3, 4, 5, 1, 2])", expected: 1 },
      { call: "findMin([4, 5, 6, 7, 0, 1, 2])", expected: 0 },
      { call: "findMin([11, 13, 15, 17])", expected: 11 },
    ],
  },

  "search-in-rotated-sorted-array": {
    approach: [
      "At any middle, at least one half is properly sorted.",
      "Work out which half is sorted by comparing its ends.",
      "If the target falls inside the sorted half's range, search there; otherwise search the other half.",
    ],
    complexity: { time: "O(log n)", space: "O(1)" },
    code: `function search(nums: number[], target: number): number {
  let low = 0;
  let high = nums.length - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (nums[mid] === target) return mid;
    if (nums[low] <= nums[mid]) {
      if (nums[low] <= target && target < nums[mid]) high = mid - 1;
      else low = mid + 1;
    } else {
      if (nums[mid] < target && target <= nums[high]) low = mid + 1;
      else high = mid - 1;
    }
  }
  return -1;
}`,
    cases: [
      { call: "search([4, 5, 6, 7, 0, 1, 2], 0)", expected: 4 },
      { call: "search([4, 5, 6, 7, 0, 1, 2], 3)", expected: -1 },
      { call: "search([1], 0)", expected: -1 },
    ],
  },

  "time-based-key-value-store": {
    approach: [
      "Store, per key, a list of [timestamp, value] pairs. Timestamps arrive increasing, so each list is already sorted.",
      "To get, binary search that list for the last timestamp at or before the one asked for.",
      "If there's none, return an empty string.",
    ],
    complexity: { time: "O(log n) per get", space: "O(n)" },
    code: `class TimeMap {
  private store = new Map<string, [number, string][]>();
  set(key: string, value: string, timestamp: number): void {
    const entries = this.store.get(key);
    if (entries) entries.push([timestamp, value]);
    else this.store.set(key, [[timestamp, value]]);
  }
  get(key: string, timestamp: number): string {
    const entries = this.store.get(key) ?? [];
    let low = 0;
    let high = entries.length;
    while (low < high) {
      const mid = (low + high) >> 1;
      if (entries[mid][0] <= timestamp) low = mid + 1;
      else high = mid;
    }
    return low === 0 ? "" : entries[low - 1][1];
  }
}`,
    cases: [
      {
        call: '(() => { const t = new TimeMap(); t.set("foo", "bar", 1); const a = [t.get("foo", 1), t.get("foo", 3)]; t.set("foo", "bar2", 4); return [...a, t.get("foo", 4), t.get("foo", 5)]; })()',
        expected: ["bar", "bar", "bar2", "bar2"],
      },
      { call: '(() => { const t = new TimeMap(); t.set("a", "x", 5); return [t.get("a", 4), t.get("b", 9)]; })()', expected: ["", ""] },
    ],
  },

  "capacity-to-ship-packages-within-d-days": {
    approach: [
      "Binary search on the ship's capacity, between the heaviest package and the total weight.",
      "For a capacity, load packages in order greedily and count the days. More capacity never needs more days.",
      "Find the smallest capacity that fits in the allowed days.",
    ],
    complexity: { time: "O(n log(sum))", space: "O(1)" },
    code: `function shipWithinDays(weights: number[], days: number): number {
  let low = Math.max(...weights);
  let high = weights.reduce((a, b) => a + b, 0);
  const daysNeeded = (capacity: number) => {
    let used = 1;
    let load = 0;
    for (const w of weights) {
      if (load + w > capacity) {
        used++;
        load = 0;
      }
      load += w;
    }
    return used;
  };
  while (low < high) {
    const mid = (low + high) >> 1;
    if (daysNeeded(mid) <= days) high = mid;
    else low = mid + 1;
  }
  return low;
}`,
    cases: [
      { call: "shipWithinDays([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 5)", expected: 15 },
      { call: "shipWithinDays([3, 2, 2, 4, 1, 4], 3)", expected: 6 },
      { call: "shipWithinDays([1, 2, 3, 1, 1], 4)", expected: 3 },
    ],
  },

  "median-of-two-sorted-arrays": {
    approach: [
      "Binary search a cut in the shorter array. The cut in the longer one follows, so the left side holds half the elements.",
      "A cut is right when the biggest value on the left of each array is no larger than the smallest on the right of the other.",
      "If the shorter array's left side is too big, move its cut left; otherwise move it right. The median comes from the four values at the cut.",
    ],
    complexity: { time: "O(log(min(m, n)))", space: "O(1)" },
    code: `function findMedianSortedArrays(nums1: number[], nums2: number[]): number {
  const [a, b] = nums1.length <= nums2.length ? [nums1, nums2] : [nums2, nums1];
  const half = Math.floor((a.length + b.length + 1) / 2);
  let low = 0;
  let high = a.length;
  while (low <= high) {
    const cutA = (low + high) >> 1;
    const cutB = half - cutA;
    const leftA = cutA === 0 ? -Infinity : a[cutA - 1];
    const rightA = cutA === a.length ? Infinity : a[cutA];
    const leftB = cutB === 0 ? -Infinity : b[cutB - 1];
    const rightB = cutB === b.length ? Infinity : b[cutB];
    if (leftA <= rightB && leftB <= rightA) {
      const leftMax = Math.max(leftA, leftB);
      if ((a.length + b.length) % 2 === 1) return leftMax;
      return (leftMax + Math.min(rightA, rightB)) / 2;
    }
    if (leftA > rightB) high = cutA - 1;
    else low = cutA + 1;
  }
  return 0;
}`,
    cases: [
      { call: "findMedianSortedArrays([1, 3], [2])", expected: 2 },
      { call: "findMedianSortedArrays([1, 2], [3, 4])", expected: 2.5 },
      { call: "findMedianSortedArrays([], [1])", expected: 1 },
    ],
  },
};
