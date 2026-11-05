import type { Solution } from "../types";

export const prefixSumSolutions: Record<string, Solution> = {
  "running-sum-of-1d-array": {
    approach: [
      "Each output value is the previous output plus the current number.",
      "Carry a running total across the array and record it at every index.",
    ],
    complexity: { time: "O(n)", space: "O(n)" },
    code: `function runningSum(nums: number[]): number[] {
  let total = 0;
  return nums.map((n) => (total += n));
}`,
    cases: [
      { call: "runningSum([1, 2, 3, 4])", expected: [1, 3, 6, 10] },
      { call: "runningSum([3, 1, 2, 10, 1])", expected: [3, 4, 6, 16, 17] },
    ],
  },

  "find-pivot-index": {
    approach: [
      "Get the total sum first.",
      "Walk left to right with the sum of everything before the current index.",
      "The right side's sum is total minus left minus the current value. The first index where they're equal is the pivot.",
    ],
    complexity: { time: "O(n)", space: "O(1)" },
    code: `function pivotIndex(nums: number[]): number {
  const total = nums.reduce((a, b) => a + b, 0);
  let left = 0;
  for (let i = 0; i < nums.length; i++) {
    if (left === total - left - nums[i]) return i;
    left += nums[i];
  }
  return -1;
}`,
    cases: [
      { call: "pivotIndex([1, 7, 3, 6, 5, 6])", expected: 3 },
      { call: "pivotIndex([1, 2, 3])", expected: -1 },
      { call: "pivotIndex([2, 1, -1])", expected: 0 },
    ],
  },

  "range-sum-query-immutable": {
    approach: [
      "Build prefix[i] as the sum of the first i numbers, with prefix[0] = 0.",
      "The sum from left to right inclusive is prefix[right + 1] - prefix[left].",
      "Building is done once in O(n), and every query is O(1).",
    ],
    complexity: { time: "O(1) per query", space: "O(n)" },
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
      {
        call: "(() => { const a = new NumArray([-2, 0, 3, -5, 2, -1]); return [a.sumRange(0, 2), a.sumRange(2, 5), a.sumRange(0, 5)]; })()",
        expected: [1, -1, -3],
      },
      { call: "new NumArray([5]).sumRange(0, 0)", expected: 5 },
    ],
  },

  "product-of-array-except-self": {
    approach: [
      "Each answer is the product of everything to the left times everything to the right.",
      "First pass, left to right: write the running product of what came before into the output.",
      "Second pass, right to left: multiply each slot by the running product of what comes after. No division needed.",
    ],
    complexity: { time: "O(n)", space: "O(1) extra" },
    code: `function productExceptSelf(nums: number[]): number[] {
  const result = new Array<number>(nums.length).fill(1);
  let left = 1;
  for (let i = 0; i < nums.length; i++) {
    result[i] = left;
    left *= nums[i];
  }
  let right = 1;
  for (let i = nums.length - 1; i >= 0; i--) {
    result[i] *= right;
    right *= nums[i];
  }
  return result;
}`,
    cases: [
      { call: "productExceptSelf([1, 2, 3, 4])", expected: [24, 12, 8, 6] },
      { call: "productExceptSelf([2, 3, 5])", expected: [15, 10, 6] },
    ],
  },

  "subarray-sum-equals-k": {
    approach: [
      "A subarray from i to j sums to k when prefix[j] - prefix[i] = k.",
      "Walk once, keeping a running prefix sum and a Map of how often each prefix has appeared, seeded with 0 seen once.",
      "At each step, add how many earlier prefixes equal current - k, then record the current prefix. Negative numbers rule out a sliding window here.",
    ],
    complexity: { time: "O(n)", space: "O(n)" },
    code: `function subarraySum(nums: number[], k: number): number {
  const seen = new Map<number, number>([[0, 1]]);
  let prefix = 0;
  let count = 0;
  for (const n of nums) {
    prefix += n;
    count += seen.get(prefix - k) ?? 0;
    seen.set(prefix, (seen.get(prefix) ?? 0) + 1);
  }
  return count;
}`,
    cases: [
      { call: "subarraySum([1, 1, 1], 2)", expected: 2 },
      { call: "subarraySum([1, 2, 3], 3)", expected: 2 },
      { call: "subarraySum([1, -1, 0], 0)", expected: 3 },
    ],
  },

  "continuous-subarray-sum": {
    approach: [
      "Two prefix sums with the same remainder mod k bound a subarray whose sum is a multiple of k.",
      "Store the first index where each remainder appears, seeded with remainder 0 at index -1.",
      "If a remainder repeats at least two indices later, the subarray is long enough.",
    ],
    complexity: { time: "O(n)", space: "O(k)" },
    code: `function checkSubarraySum(nums: number[], k: number): boolean {
  const firstIndex = new Map<number, number>([[0, -1]]);
  let remainder = 0;
  for (let i = 0; i < nums.length; i++) {
    remainder = (remainder + nums[i]) % k;
    const earlier = firstIndex.get(remainder);
    if (earlier === undefined) firstIndex.set(remainder, i);
    else if (i - earlier >= 2) return true;
  }
  return false;
}`,
    cases: [
      { call: "checkSubarraySum([23, 2, 4, 6, 7], 6)", expected: true },
      { call: "checkSubarraySum([23, 2, 6, 4, 7], 13)", expected: false },
      { call: "checkSubarraySum([5, 0, 0, 0], 3)", expected: true },
    ],
  },

  "range-sum-query-2d-immutable": {
    approach: [
      "Build a prefix grid one row and column larger, where each cell holds the sum of the rectangle from the origin to it.",
      "Each cell is its value plus the cell above plus the cell to the left, minus the overlap counted twice.",
      "A query takes the big rectangle, subtracts the strip above and the strip to the left, and adds back the corner removed twice.",
    ],
    complexity: { time: "O(1) per query", space: "O(m · n)" },
    code: `class NumMatrix {
  private prefix: number[][];
  constructor(matrix: number[][]) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    this.prefix = Array.from({ length: rows + 1 }, () => new Array<number>(cols + 1).fill(0));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        this.prefix[r + 1][c + 1] = matrix[r][c] + this.prefix[r][c + 1] + this.prefix[r + 1][c] - this.prefix[r][c];
      }
    }
  }
  sumRegion(row1: number, col1: number, row2: number, col2: number): number {
    const p = this.prefix;
    return p[row2 + 1][col2 + 1] - p[row1][col2 + 1] - p[row2 + 1][col1] + p[row1][col1];
  }
}`,
    cases: [
      {
        call: "(() => { const m = new NumMatrix([[3, 0, 1, 4, 2], [5, 6, 3, 2, 1], [1, 2, 0, 1, 5], [4, 1, 0, 1, 7], [1, 0, 3, 0, 5]]); return [m.sumRegion(2, 1, 4, 3), m.sumRegion(1, 1, 2, 2), m.sumRegion(1, 2, 2, 4)]; })()",
        expected: [8, 11, 12],
      },
      { call: "new NumMatrix([[7]]).sumRegion(0, 0, 0, 0)", expected: 7 },
    ],
  },

  "count-number-of-nice-subarrays": {
    approach: [
      "Treat odd numbers as 1 and even numbers as 0. Now it's counting subarrays that sum to k.",
      "Keep a running count of odds and a Map of how often each count has appeared, seeded with 0 seen once.",
      "At each step, add how many earlier counts equal current - k.",
    ],
    complexity: { time: "O(n)", space: "O(n)" },
    code: `function numberOfSubarrays(nums: number[], k: number): number {
  const seen = new Map<number, number>([[0, 1]]);
  let odds = 0;
  let count = 0;
  for (const n of nums) {
    odds += n % 2;
    count += seen.get(odds - k) ?? 0;
    seen.set(odds, (seen.get(odds) ?? 0) + 1);
  }
  return count;
}`,
    cases: [
      { call: "numberOfSubarrays([1, 1, 2, 1, 1], 3)", expected: 2 },
      { call: "numberOfSubarrays([2, 4, 6], 1)", expected: 0 },
      { call: "numberOfSubarrays([2, 2, 2, 1, 2, 2, 1, 2, 2, 2], 2)", expected: 16 },
    ],
  },
};
