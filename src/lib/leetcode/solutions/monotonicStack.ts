import type { Solution } from "../types";

export const monotonicStackSolutions: Record<string, Solution> = {
  "next-greater-element-i": {
    approach: [
      "Work out the next greater value for every number in nums2 with one pass and a decreasing stack.",
      "When a bigger number arrives, it's the answer for everything smaller on the stack, so pop those and record it in a Map.",
      "Answer each nums1 value from the Map, or -1 if it never got one.",
    ],
    complexity: { time: "O(m + n)", space: "O(n)" },
    code: `function nextGreaterElement(nums1: number[], nums2: number[]): number[] {
  const nextGreater = new Map<number, number>();
  const stack: number[] = [];
  for (const n of nums2) {
    while (stack.length > 0 && stack[stack.length - 1] < n) nextGreater.set(stack.pop() as number, n);
    stack.push(n);
  }
  return nums1.map((n) => nextGreater.get(n) ?? -1);
}`,
    cases: [
      { call: "nextGreaterElement([4, 1, 2], [1, 3, 4, 2])", expected: [-1, 3, -1] },
      { call: "nextGreaterElement([2, 4], [1, 2, 3, 4])", expected: [3, -1] },
    ],
  },

  "daily-temperatures": {
    approach: [
      "Keep a stack of the indices of days still waiting for a warmer day. Their temperatures decrease from bottom to top.",
      "When a warmer day arrives, pop every colder day off the stack. Each one's answer is the gap in indices.",
      "Days left on the stack at the end never warm up, so they stay 0.",
    ],
    complexity: { time: "O(n)", space: "O(n)" },
    code: `function dailyTemperatures(temperatures: number[]): number[] {
  const answer = new Array<number>(temperatures.length).fill(0);
  const waiting: number[] = [];
  for (let i = 0; i < temperatures.length; i++) {
    while (waiting.length > 0 && temperatures[waiting[waiting.length - 1]] < temperatures[i]) {
      const day = waiting.pop() as number;
      answer[day] = i - day;
    }
    waiting.push(i);
  }
  return answer;
}`,
    cases: [
      { call: "dailyTemperatures([73, 74, 75, 71, 69, 72, 76, 73])", expected: [1, 1, 4, 2, 1, 1, 0, 0] },
      { call: "dailyTemperatures([30, 60, 90])", expected: [1, 1, 0] },
    ],
  },

  "online-stock-span": {
    approach: [
      "Keep a stack of [price, span] pairs with prices decreasing from bottom to top.",
      "For a new price, pop every pair whose price is at or below it and add their spans to its own span of 1.",
      "Push the new pair. Each price is pushed and popped once, so it's amortised O(1).",
    ],
    complexity: { time: "O(1) amortised", space: "O(n)" },
    code: `class StockSpanner {
  private stack: [number, number][] = [];
  next(price: number): number {
    let span = 1;
    while (this.stack.length > 0 && this.stack[this.stack.length - 1][0] <= price) {
      span += (this.stack.pop() as [number, number])[1];
    }
    this.stack.push([price, span]);
    return span;
  }
}`,
    cases: [
      {
        call: "(() => { const s = new StockSpanner(); return [100, 80, 60, 70, 60, 75, 85].map((p) => s.next(p)); })()",
        expected: [1, 1, 1, 2, 1, 4, 6],
      },
      { call: "(() => { const s = new StockSpanner(); return [5, 5, 5].map((p) => s.next(p)); })()", expected: [1, 2, 3] },
    ],
  },

  "car-fleet": {
    approach: [
      "Sort the cars by position, closest to the target first.",
      "Work out the time each car needs to arrive on its own.",
      "A car that would arrive no later than the fleet in front catches it and joins. Only a slower car starts a new fleet, so count those.",
    ],
    complexity: { time: "O(n log n)", space: "O(n)" },
    code: `function carFleet(target: number, position: number[], speed: number[]): number {
  const cars = position.map((p, i) => [p, (target - p) / speed[i]]).sort((a, b) => b[0] - a[0]);
  let fleets = 0;
  let slowest = 0;
  for (const [, time] of cars) {
    if (time > slowest) {
      fleets++;
      slowest = time;
    }
  }
  return fleets;
}`,
    cases: [
      { call: "carFleet(12, [10, 8, 0, 5, 3], [2, 4, 1, 1, 3])", expected: 3 },
      { call: "carFleet(10, [3], [3])", expected: 1 },
      { call: "carFleet(100, [0, 2, 4], [4, 2, 1])", expected: 1 },
    ],
  },

  "remove-k-digits": {
    approach: [
      "To keep the number small, a digit should go when the next digit is smaller than it.",
      "Build the result as an increasing stack: while k is left and the top is bigger than the new digit, pop it.",
      "If k remains, drop digits from the end. Strip leading zeros, and return '0' for an empty result.",
    ],
    complexity: { time: "O(n)", space: "O(n)" },
    code: `function removeKdigits(num: string, k: number): string {
  const stack: string[] = [];
  let remaining = k;
  for (const digit of num) {
    while (remaining > 0 && stack.length > 0 && stack[stack.length - 1] > digit) {
      stack.pop();
      remaining--;
    }
    stack.push(digit);
  }
  const kept = stack.slice(0, stack.length - remaining).join("");
  const trimmed = kept.replace(/^0+/, "");
  return trimmed === "" ? "0" : trimmed;
}`,
    cases: [
      { call: 'removeKdigits("1432219", 3)', expected: "1219" },
      { call: 'removeKdigits("10200", 1)', expected: "200" },
      { call: 'removeKdigits("10", 2)', expected: "0" },
    ],
  },

  "sum-of-subarray-minimums": {
    approach: [
      "Count how many subarrays have each element as their minimum, rather than listing subarrays.",
      "For each index, find how far it can reach left before a smaller value and right before a smaller-or-equal value. The strict and non-strict split stops ties being counted twice.",
      "Its contribution is value × left reach × right reach. Sum them modulo 1e9 + 7.",
    ],
    complexity: { time: "O(n)", space: "O(n)" },
    code: `function sumSubarrayMins(arr: number[]): number {
  const MOD = 1_000_000_007;
  const n = arr.length;
  const left = new Array<number>(n);
  const right = new Array<number>(n);
  const stack: number[] = [];
  for (let i = 0; i < n; i++) {
    while (stack.length > 0 && arr[stack[stack.length - 1]] > arr[i]) stack.pop();
    left[i] = stack.length === 0 ? i + 1 : i - stack[stack.length - 1];
    stack.push(i);
  }
  stack.length = 0;
  for (let i = n - 1; i >= 0; i--) {
    while (stack.length > 0 && arr[stack[stack.length - 1]] >= arr[i]) stack.pop();
    right[i] = stack.length === 0 ? n - i : stack[stack.length - 1] - i;
    stack.push(i);
  }
  let total = 0;
  for (let i = 0; i < n; i++) total = (total + arr[i] * left[i] * right[i]) % MOD;
  return total;
}`,
    cases: [
      { call: "sumSubarrayMins([3, 1, 2, 4])", expected: 17 },
      { call: "sumSubarrayMins([11, 81, 94, 43, 3])", expected: 444 },
    ],
  },

  "largest-rectangle-in-histogram": {
    approach: [
      "Keep a stack of bar indices with heights increasing from bottom to top.",
      "When a shorter bar arrives, every taller bar on the stack has found its right edge. Pop it; its left edge is the new top of the stack.",
      "Its rectangle is height × (right - left - 1). A height-0 bar at the end flushes whatever is left.",
    ],
    complexity: { time: "O(n)", space: "O(n)" },
    code: `function largestRectangleArea(heights: number[]): number {
  const stack: number[] = [];
  let best = 0;
  for (let i = 0; i <= heights.length; i++) {
    const current = i === heights.length ? 0 : heights[i];
    while (stack.length > 0 && heights[stack[stack.length - 1]] >= current) {
      const height = heights[stack.pop() as number];
      const left = stack.length === 0 ? -1 : stack[stack.length - 1];
      best = Math.max(best, height * (i - left - 1));
    }
    stack.push(i);
  }
  return best;
}`,
    cases: [
      { call: "largestRectangleArea([2, 1, 5, 6, 2, 3])", expected: 10 },
      { call: "largestRectangleArea([2, 4])", expected: 4 },
    ],
  },

  "maximal-rectangle": {
    approach: [
      "Go row by row, keeping a histogram of how many consecutive 1s stand above each column, including this row.",
      "A 0 resets that column to zero.",
      "Each row's histogram is a Largest Rectangle in Histogram problem, so run the monotonic stack on it and keep the best.",
    ],
    complexity: { time: "O(m · n)", space: "O(n)" },
    code: `function maximalRectangle(matrix: string[][]): number {
  if (matrix.length === 0) return 0;
  const heights = new Array<number>(matrix[0].length).fill(0);
  let best = 0;
  for (const row of matrix) {
    row.forEach((cell, c) => {
      heights[c] = cell === "1" ? heights[c] + 1 : 0;
    });
    const stack: number[] = [];
    for (let i = 0; i <= heights.length; i++) {
      const current = i === heights.length ? 0 : heights[i];
      while (stack.length > 0 && heights[stack[stack.length - 1]] >= current) {
        const height = heights[stack.pop() as number];
        const left = stack.length === 0 ? -1 : stack[stack.length - 1];
        best = Math.max(best, height * (i - left - 1));
      }
      stack.push(i);
    }
  }
  return best;
}`,
    cases: [
      {
        call: 'maximalRectangle([["1", "0", "1", "0", "0"], ["1", "0", "1", "1", "1"], ["1", "1", "1", "1", "1"], ["1", "0", "0", "1", "0"]])',
        expected: 6,
      },
      { call: 'maximalRectangle([["0"]])', expected: 0 },
      { call: 'maximalRectangle([["1"]])', expected: 1 },
    ],
  },
};
