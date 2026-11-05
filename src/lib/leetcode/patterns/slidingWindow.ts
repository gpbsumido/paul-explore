import type { Pattern } from "../types";

export const slidingWindow: Pattern = {
  id: "sliding-window",
  name: "Sliding Window",
  phase: 1,
  tagline: "Grow the right edge, shrink the left, never restart.",
  summary:
    "Questions about the best contiguous subarray or substring have an O(n²) brute force: try every start, extend every end. A window keeps the state of the current range (a count, a sum, a map of letters) and updates it incrementally as the right edge grows and the left edge shrinks. Each index enters once and leaves once, so it's O(n). Fixed-size windows slide both edges together; variable windows grow until the condition breaks, then shrink until it holds again.",
  question: "Is the answer a contiguous range, and can I tell from the window's running state whether it's still valid?",
  signals: [
    { phrase: "longest substring", why: "Longest contiguous range meeting a condition is a variable-size window.", weight: 2 },
    { phrase: "shortest subarray", why: "Shrink-while-valid finds the minimum window." },
    { phrase: "minimum window", why: "Grow until it contains everything needed, then shrink from the left.", weight: 2 },
    { phrase: "contiguous", why: "Contiguous ranges are what windows slide over." },
    { phrase: "subarray", why: "Subarray questions are window or prefix-sum questions." },
    { phrase: "substring", why: "Substring is the string version of a contiguous range." },
    { phrase: "at most k", why: "\"At most k\" distinct, replacements or flips is the condition the window maintains.", weight: 2 },
    { phrase: "without repeating characters", why: "No-repeats is a window with a last-seen map.", weight: 2 },
    { phrase: "of size k", why: "A fixed-size window: add the new right, drop the old left." },
    { phrase: "consecutive", why: "Consecutive elements form a window." },
    { phrase: "permutation", why: "A permutation of p inside s is a fixed window of length p with matching counts." },
    { phrase: "replace", why: "Character Replacement: window length minus its most common letter must stay within k." },
    { phrase: "sum is greater than or equal to", why: "With positive numbers, a running sum can shrink from the left." },
    { phrase: "maximum average", why: "Fixed-length average is a fixed window sum." },
    { phrase: "buy", why: "Best time to buy and sell: track the lowest price on the left as the right edge moves." },
  ],
  antiSignals: [
    "Elements can be negative and you need a sum target: shrinking no longer behaves monotonically, so use prefix sums with a hash map.",
    "The elements don't need to be contiguous: that's a subsequence, usually DP.",
  ],
  complexity: { time: "O(n)", space: "O(k) for the window state" },
  template: {
    title: "Variable window: grow, then shrink while invalid",
    explanation:
      "The right edge always advances. When the window becomes invalid (here, a repeated character), the left edge advances until it's valid again. Record the answer after the window is valid. Every problem in this family is this loop with a different validity check and window state.",
    code: `function lengthOfLongestSubstring(s: string): number {
  const inWindow = new Map<string, number>();
  let left = 0;
  let best = 0;
  for (let right = 0; right < s.length; right++) {
    const ch = s[right];
    inWindow.set(ch, (inWindow.get(ch) ?? 0) + 1);
    while ((inWindow.get(ch) ?? 0) > 1) {
      const out = s[left];
      inWindow.set(out, (inWindow.get(out) ?? 0) - 1);
      left++;
    }
    best = Math.max(best, right - left + 1);
  }
  return best;
}`,
    cases: [
      { call: "lengthOfLongestSubstring('abcabcbb')", expected: 3 },
      { call: "lengthOfLongestSubstring('bbbbb')", expected: 1 },
      { call: "lengthOfLongestSubstring('pwwkew')", expected: 3 },
      { call: "lengthOfLongestSubstring('')", expected: 0 },
    ],
  },
  variants: [
    {
      title: "Fixed window of size k",
      explanation: "Add the element entering on the right, subtract the one leaving on the left. Start recording once the window reaches k.",
      code: `function findMaxAverage(nums: number[], k: number): number {
  let sum = 0;
  let best = Number.NEGATIVE_INFINITY;
  for (let right = 0; right < nums.length; right++) {
    sum += nums[right];
    if (right >= k) sum -= nums[right - k];
    if (right >= k - 1) best = Math.max(best, sum);
  }
  return best / k;
}`,
      cases: [
        { call: "findMaxAverage([1, 12, -5, -6, 50, 3], 4)", expected: 12.75 },
        { call: "findMaxAverage([5], 1)", expected: 5 },
      ],
    },
    {
      title: "Shortest window: shrink while still valid",
      explanation:
        "For a minimum, flip the inner loop: while the window satisfies the condition, record it, then shrink. Works here because all numbers are positive, so shrinking always lowers the sum.",
      code: `function minSubArrayLen(target: number, nums: number[]): number {
  let left = 0;
  let sum = 0;
  let best = Number.POSITIVE_INFINITY;
  for (let right = 0; right < nums.length; right++) {
    sum += nums[right];
    while (sum >= target) {
      best = Math.min(best, right - left + 1);
      sum -= nums[left];
      left++;
    }
  }
  return best === Number.POSITIVE_INFINITY ? 0 : best;
}`,
      cases: [
        { call: "minSubArrayLen(7, [2, 3, 1, 2, 4, 3])", expected: 2 },
        { call: "minSubArrayLen(11, [1, 1, 1, 1])", expected: 0 },
      ],
    },
  ],
  pitfalls: [
    "Recording the answer before the window is valid again, so an invalid window gets counted.",
    "Using if instead of while to shrink. One removal isn't always enough.",
    "Applying a shrinking window to sums with negative numbers. The sum no longer falls monotonically as you shrink, so the window gives wrong answers. Use prefix sums.",
    "Window length is right - left + 1, not right - left.",
  ],
  jsNotes: [
    "For lowercase-only input, a number[26] count array indexed by charCodeAt(i) - 97 is faster and simpler to compare than a Map.",
    "Comparing two count arrays every step is O(26), which is still O(n) overall. Fine to say out loud.",
  ],
  deepDive: "/learn/sliding-window",
  prerequisites: ["arrays-hashing", "two-pointers"],
  problems: [
    {
      slug: "best-time-to-buy-and-sell-stock",
      title: "Best Time to Buy and Sell Stock",
      difficulty: "Easy",
      prompt: "Given daily prices, choose one day to buy and a later day to sell to maximise profit. Return the best profit, or 0.",
      tell: "Buy before sell: a window whose left edge is the cheapest price so far, while the right edge walks forward.",
      alsoAccept: ["greedy", "dp-1d"],
    },
    {
      slug: "maximum-average-subarray-i",
      title: "Maximum Average Subarray I",
      difficulty: "Easy",
      prompt: "Find the contiguous subarray of size k with the maximum average value and return that average.",
      tell: "\"Contiguous subarray of size k\" is the fixed window: add the new right, subtract the old left.",
    },
    {
      slug: "longest-substring-without-repeating-characters",
      title: "Longest Substring Without Repeating Characters",
      difficulty: "Medium",
      prompt: "Find the length of the longest substring without repeating characters.",
      tell: "\"Longest substring\" plus a condition on its contents is the variable window. Shrink whenever a character repeats.",
    },
    {
      slug: "longest-repeating-character-replacement",
      title: "Longest Repeating Character Replacement",
      difficulty: "Medium",
      prompt: "You may replace at most k characters in the string. Return the length of the longest substring containing a single repeated letter after the replacements.",
      tell: "\"At most k\" replacements: the window is valid while its length minus its most frequent letter's count is at most k.",
    },
    {
      slug: "permutation-in-string",
      title: "Permutation in String",
      difficulty: "Medium",
      prompt: "Return true if some permutation of s1 appears as a substring of s2.",
      tell: "A permutation of s1 is any window of length s1 with the same letter counts. Fixed window, compare 26 counts.",
    },
    {
      slug: "minimum-size-subarray-sum",
      title: "Minimum Size Subarray Sum",
      difficulty: "Medium",
      prompt: "Given positive integers and a target, return the minimal length of a contiguous subarray whose sum is greater than or equal to target, or 0.",
      tell: "Positive numbers plus \"minimal length\" of a contiguous subarray: grow until the sum reaches target, then shrink while it still does.",
    },
    {
      slug: "fruit-into-baskets",
      title: "Fruit Into Baskets",
      difficulty: "Medium",
      prompt: "Walking along a row of fruit trees, you can carry at most two types of fruit. Pick a contiguous run of trees and return the most fruit you can collect.",
      tell: "Under the story it's \"longest subarray with at most k distinct values\", with k = 2. A window and a count map.",
    },
    {
      slug: "max-consecutive-ones-iii",
      title: "Max Consecutive Ones III",
      difficulty: "Medium",
      prompt: "Given a binary array and k, return the maximum number of consecutive 1s if you can flip at most k zeros.",
      tell: "\"Consecutive\" plus \"at most k\" flips: the window may contain at most k zeros.",
    },
    {
      slug: "minimum-window-substring",
      title: "Minimum Window Substring",
      difficulty: "Hard",
      prompt: "Return the minimum window substring of s that contains every character of t, duplicates included, or an empty string.",
      tell: "\"Minimum window\" that covers a multiset: grow until every needed count is met, then shrink while it still is, tracking how many letters are satisfied.",
    },
    {
      slug: "sliding-window-maximum",
      title: "Sliding Window Maximum",
      difficulty: "Hard",
      prompt: "A window of size k slides from left to right across the array. Return the maximum of each window position.",
      tell: "A fixed window, but max can't be un-added. A deque of indices with decreasing values gives each window's max in O(1).",
      alsoAccept: ["monotonic-stack", "heap"],
    },
  ],
};
