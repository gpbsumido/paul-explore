import type { Pattern } from "../types";

export const monotonicStack: Pattern = {
  id: "monotonic-stack",
  name: "Monotonic Stack",
  phase: 2,
  tagline: "Keep a stack in sorted order; whatever you pop just found its answer.",
  summary:
    "For \"next greater element\" questions the brute force checks every later element for each position, O(n²). A stack of indices kept in decreasing value order fixes it: when a bigger value arrives, everything smaller on the stack has just met its next greater element, so pop them and record the answer. Each index is pushed and popped once, so it's O(n). Flip the comparison for next smaller; the same idea finds the span of each bar in histogram questions.",
  question: "For each element, do I need the nearest element to one side that's bigger or smaller than it?",
  signals: [
    { phrase: "next greater", why: "Next greater element is the definition of a decreasing stack.", weight: 3 },
    { phrase: "next smaller", why: "Next smaller uses an increasing stack." },
    { phrase: "warmer temperature", why: "Days until warmer is next greater, measured in distance.", weight: 3 },
    { phrase: "how many days", why: "Distance to the next bigger value: index difference on pop." },
    { phrase: "span", why: "Stock span counts consecutive smaller-or-equal days back: pop while smaller." },
    { phrase: "histogram", why: "Largest rectangle: each bar extends until the nearest shorter bar on each side.", weight: 3 },
    { phrase: "largest rectangle", why: "Width comes from the next smaller bar on each side." },
    { phrase: "previous greater", why: "The stack's top after popping is the previous greater element." },
    { phrase: "remove k digits", why: "Greedy smallest number: pop larger digits while removals remain.", weight: 2 },
    { phrase: "car fleet", why: "Cars sorted by position merge when a car behind would catch the one ahead." },
    { phrase: "sum of subarray minimums", why: "Each element's contribution depends on how far it stays the minimum on each side.", weight: 3 },
    { phrase: "visible", why: "Who can see whom past taller items is a nearest-greater question." },
  ],
  antiSignals: [
    "You need the maximum of a sliding window: a monotonic deque, a close cousin of this. Covered under sliding window.",
    "You need global order, not nearest neighbours: sort or use a heap.",
  ],
  complexity: { time: "O(n)", space: "O(n)" },
  template: {
    title: "Pop while the new value beats the top",
    explanation:
      "The stack holds indices still waiting for a warmer day, coldest on top. A warmer day pops every colder one and records the distance. Anything left at the end never found one and keeps 0.",
    code: `function dailyTemperatures(temperatures: number[]): number[] {
  const answer = new Array<number>(temperatures.length).fill(0);
  const waiting: number[] = [];
  for (let i = 0; i < temperatures.length; i++) {
    while (waiting.length > 0 && temperatures[i] > temperatures[waiting[waiting.length - 1]]) {
      const j = waiting.pop() as number;
      answer[j] = i - j;
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
  variants: [
    {
      title: "Largest rectangle: the pop tells you the width",
      explanation:
        "Keep bar indices with increasing heights. A shorter bar pops taller ones, and each popped bar's rectangle runs from just after the new top of the stack to just before the current index. A sentinel 0 at the end flushes the stack.",
      code: `function largestRectangleArea(heights: number[]): number {
  const stack: number[] = [];
  let best = 0;
  for (let i = 0; i <= heights.length; i++) {
    const height = i === heights.length ? 0 : heights[i];
    while (stack.length > 0 && height < heights[stack[stack.length - 1]]) {
      const top = stack.pop() as number;
      const left = stack.length > 0 ? stack[stack.length - 1] + 1 : 0;
      best = Math.max(best, heights[top] * (i - left));
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
  ],
  pitfalls: [
    "Storing values instead of indices, so you can't compute distances or widths on pop.",
    "Strict versus non-strict comparison: > for next strictly greater, >= when equal values should also pop. Duplicates are where this bites.",
    "Forgetting the leftovers. Either the answer array's default covers them, or a sentinel flushes them.",
  ],
  jsNotes: [
    "stack[stack.length - 1] reads the top without popping; stack.at(-1) works too but returns T | undefined, which TypeScript makes you handle.",
  ],
  prerequisites: ["stack"],
  problems: [
    {
      slug: "next-greater-element-i",
      title: "Next Greater Element I",
      difficulty: "Easy",
      prompt: "For each value of nums1, find the next greater element to its right in nums2, or -1.",
      tell: "\"Next greater\" is the name of the pattern. Precompute it for all of nums2 with one stack, store in a map.",
    },
    {
      slug: "daily-temperatures",
      title: "Daily Temperatures",
      difficulty: "Medium",
      prompt: "Given daily temperatures, return for each day how many days you have to wait for a warmer temperature, or 0.",
      tell: "\"How many days\" until a \"warmer temperature\" is next greater, measured as an index distance.",
    },
    {
      slug: "online-stock-span",
      title: "Online Stock Span",
      difficulty: "Medium",
      prompt: "Design a class that receives daily prices and returns the span: how many consecutive days up to today had a price less than or equal to today's.",
      tell: "\"Span\" back to the previous greater price: keep [price, span] pairs and pop smaller ones, adding their spans.",
    },
    {
      slug: "car-fleet",
      title: "Car Fleet",
      difficulty: "Medium",
      prompt: "Cars drive toward a target at fixed speeds and can't pass; a car that catches up joins that car fleet. Return how many fleets arrive.",
      tell: "Sort by position, compute arrival times from the front. A car that would arrive sooner than the fleet ahead merges into it: a stack of fleet times.",
      alsoAccept: ["greedy", "stack"],
    },
    {
      slug: "remove-k-digits",
      title: "Remove K Digits",
      difficulty: "Medium",
      prompt: "Remove k digits from a number string to make the smallest possible number.",
      tell: "To make the number small, a digit bigger than the one after it must go. An increasing stack, popping while removals remain.",
      alsoAccept: ["greedy"],
    },
    {
      slug: "sum-of-subarray-minimums",
      title: "Sum of Subarray Minimums",
      difficulty: "Medium",
      prompt: "Return the sum of min(subarray) over every contiguous subarray, modulo 1e9 + 7.",
      tell: "\"Sum of subarray minimums\": each element is the minimum for (distance to previous smaller) × (distance to next smaller) subarrays.",
    },
    {
      slug: "largest-rectangle-in-histogram",
      title: "Largest Rectangle in Histogram",
      difficulty: "Hard",
      prompt: "Given bar heights of a histogram with width 1 each, return the area of the largest rectangle.",
      tell: "\"Histogram\" plus \"largest rectangle\": each bar's rectangle spans to the nearest shorter bar on each side.",
    },
    {
      slug: "maximal-rectangle",
      title: "Maximal Rectangle",
      difficulty: "Hard",
      prompt: "Given a binary matrix, find the largest rectangle containing only 1s and return its area.",
      tell: "Treat each row as the floor of a histogram of consecutive 1s above it, then run largest rectangle in histogram per row.",
      alsoAccept: ["dp-2d"],
    },
  ],
};
