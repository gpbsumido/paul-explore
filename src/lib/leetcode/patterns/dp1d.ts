import type { Pattern } from "../types";

export const dp1d: Pattern = {
  id: "dp-1d",
  name: "1-D Dynamic Programming",
  phase: 4,
  tagline: "Define what dp[i] means, find how it depends on smaller i, then fill it in order.",
  summary:
    "DP is recursion where the same subproblems keep coming back, so you remember their answers. The work is entirely in the definition: say in words what dp[i] means (\"the most money robbing houses 0..i\"), write how it follows from smaller indices, set the base cases, and fill left to right. Questions asking for a count of ways, a minimum, a maximum or a yes/no over choices, where greedy has a counter-example, are DP. Start from the brute-force recursion, add a memo, then turn it into a table if you have time.",
  question: "Can I say in one sentence what dp[i] means, and build it from dp of smaller i?",
  signals: [
    { phrase: "number of ways", why: "Counting ways adds up the counts of smaller subproblems.", weight: 3 },
    { phrase: "how many distinct ways", why: "Climbing Stairs and every counting cousin.", weight: 3 },
    { phrase: "minimum number of coins", why: "Coin Change: dp[amount] = 1 + min over coins.", weight: 3 },
    { phrase: "fewest", why: "Fewest of something over choices, where greedy fails." },
    { phrase: "maximum amount", why: "Maximise over take-or-skip choices." },
    { phrase: "adjacent houses", why: "House Robber: take this one and skip the previous, or skip this one.", weight: 3 },
    { phrase: "longest increasing subsequence", why: "LIS: dp[i] is the longest ending at i.", weight: 3 },
    { phrase: "subsequence", why: "Subsequences skip elements, so each index is a take-or-skip choice." },
    { phrase: "segmented", why: "Word Break: dp[i] is whether the prefix of length i can be segmented.", weight: 2 },
    { phrase: "decode", why: "Decode Ways: one-digit or two-digit step, like stairs." },
    { phrase: "climb", why: "Climbing stairs is the hello world of DP.", weight: 2 },
    { phrase: "contiguous subarray", why: "Kadane: the best subarray ending here extends the previous or starts fresh." },
    { phrase: "largest sum", why: "Maximum Subarray with Kadane's running best." },
    { phrase: "equal sum", why: "Partition Equal Subset Sum is 0/1 knapsack on half the total.", weight: 2 },
    { phrase: "palindromic substring", why: "Expand around each centre, or dp over substrings." },
  ],
  antiSignals: [
    "You need every arrangement, not a count or a best: that's backtracking.",
    "A simple local rule is provably safe: greedy is simpler.",
    "The state needs two indices (two strings, a grid): that's 2-D DP.",
  ],
  complexity: { time: "O(n × choices per step)", space: "O(n), often O(1) with rolling variables" },
  template: {
    title: "Take or skip, with rolling variables",
    explanation:
      "House Robber: dp[i] = max(dp[i - 1], dp[i - 2] + nums[i]), either skip this house or rob it and the best from two back. Only the last two values are ever read, so two variables replace the array.",
    code: `function rob(nums: number[]): number {
  let twoBack = 0;
  let oneBack = 0;
  for (const money of nums) {
    const best = Math.max(oneBack, twoBack + money);
    twoBack = oneBack;
    oneBack = best;
  }
  return oneBack;
}`,
    cases: [
      { call: "rob([1, 2, 3, 1])", expected: 4 },
      { call: "rob([2, 7, 9, 3, 1])", expected: 12 },
      { call: "rob([])", expected: 0 },
    ],
  },
  variants: [
    {
      title: "Unbounded choices: coin change",
      explanation:
        "dp[a] is the fewest coins making amount a. Every coin is a choice that leaves a smaller amount. Infinity marks amounts that can't be made, and survives the + 1 unchanged.",
      code: `function coinChange(coins: number[], amount: number): number {
  const dp = new Array<number>(amount + 1).fill(Number.POSITIVE_INFINITY);
  dp[0] = 0;
  for (let a = 1; a <= amount; a++) {
    for (const coin of coins) {
      if (coin <= a) dp[a] = Math.min(dp[a], dp[a - coin] + 1);
    }
  }
  return dp[amount] === Number.POSITIVE_INFINITY ? -1 : dp[amount];
}`,
      cases: [
        { call: "coinChange([1, 2, 5], 11)", expected: 3 },
        { call: "coinChange([2], 3)", expected: -1 },
        { call: "coinChange([1, 3, 4], 6)", expected: 2 },
      ],
    },
    {
      title: "Ending-at-i: longest increasing subsequence",
      explanation:
        "dp[i] is the length of the longest increasing subsequence ending at index i, so it looks back at every smaller value. O(n²); patience sorting with binary search is the O(n log n) follow-up.",
      code: `function lengthOfLIS(nums: number[]): number {
  const dp = new Array<number>(nums.length).fill(1);
  for (let i = 1; i < nums.length; i++) {
    for (let j = 0; j < i; j++) {
      if (nums[j] < nums[i]) dp[i] = Math.max(dp[i], dp[j] + 1);
    }
  }
  return Math.max(0, ...dp);
}`,
      cases: [
        { call: "lengthOfLIS([10, 9, 2, 5, 3, 7, 101, 18])", expected: 4 },
        { call: "lengthOfLIS([7, 7, 7, 7])", expected: 1 },
      ],
    },
    {
      title: "Prefix reachability: word break",
      explanation: "dp[i] is true when the first i characters split into dictionary words. Check every cut j where dp[j] holds and s.slice(j, i) is a word.",
      code: `function wordBreak(s: string, wordDict: string[]): boolean {
  const words = new Set(wordDict);
  const dp = new Array<boolean>(s.length + 1).fill(false);
  dp[0] = true;
  for (let i = 1; i <= s.length; i++) {
    for (let j = 0; j < i; j++) {
      if (dp[j] && words.has(s.slice(j, i))) {
        dp[i] = true;
        break;
      }
    }
  }
  return dp[s.length];
}`,
      cases: [
        { call: "wordBreak('leetcode', ['leet', 'code'])", expected: true },
        { call: "wordBreak('catsandog', ['cats', 'dog', 'sand', 'and', 'cat'])", expected: false },
      ],
    },
  ],
  pitfalls: [
    "Writing the loop before the definition. If you can't say what dp[i] means in words, the recurrence will be wrong.",
    "Off-by-one between 'first i elements' (size n + 1) and 'ending at index i' (size n).",
    "Memoising on a key that doesn't capture the whole state, so different situations share an answer.",
  ],
  jsNotes: [
    "A Map memo keyed on a string like `${i},${j}` is fine to start; switch to typed arrays when the table is large.",
    "Deep top-down recursion can overflow around 10k frames. Mention converting to bottom-up for big n.",
  ],
  deepDive: "/learn/dynamic-programming",
  prerequisites: ["backtracking"],
  problems: [
    {
      slug: "climbing-stairs",
      title: "Climbing Stairs",
      difficulty: "Easy",
      prompt: "You climb 1 or 2 steps at a time. In how many distinct ways can you climb to the top of n steps?",
      tell: "\"How many distinct ways\" to \"climb\": ways(n) = ways(n - 1) + ways(n - 2). Fibonacci in disguise.",
    },
    {
      slug: "min-cost-climbing-stairs",
      title: "Min Cost Climbing Stairs",
      difficulty: "Easy",
      prompt: "Each step has a cost and you climb one or two steps after paying. Return the minimum cost to reach the top, starting from step 0 or 1.",
      tell: "Stairs again, with min instead of sum: dp[i] = cost[i] + min(dp[i - 1], dp[i - 2]).",
    },
    {
      slug: "house-robber",
      title: "House Robber",
      difficulty: "Medium",
      prompt: "Houses hold money but robbing two adjacent houses alerts the police. Return the maximum amount you can rob.",
      tell: "\"Adjacent houses\" and \"maximum amount\": rob this one plus best from two back, or skip it.",
    },
    {
      slug: "house-robber-ii",
      title: "House Robber II",
      difficulty: "Medium",
      prompt: "The houses are arranged in a circle, so the first and last are adjacent houses. Return the maximum amount you can rob.",
      tell: "A circle means you can't take both ends: run House Robber twice, once without the first house, once without the last.",
    },
    {
      slug: "maximum-subarray",
      title: "Maximum Subarray",
      difficulty: "Medium",
      prompt: "Find the contiguous subarray with the largest sum and return its sum.",
      tell: "\"Contiguous subarray\" with the \"largest sum\": Kadane's. The best ending here is this value, or this value plus the best ending one before.",
      alsoAccept: ["greedy"],
    },
    {
      slug: "coin-change",
      title: "Coin Change",
      difficulty: "Medium",
      prompt: "Given coin denominations and an amount, return the fewest coins that make up the amount, or -1.",
      tell: "\"Fewest\" coins: greedy fails on [1, 3, 4] for 6. dp[a] = 1 + min(dp[a - coin]).",
    },
    {
      slug: "longest-increasing-subsequence",
      title: "Longest Increasing Subsequence",
      difficulty: "Medium",
      prompt: "Return the length of the longest strictly increasing subsequence.",
      tell: "\"Longest increasing subsequence\": dp[i] ending at i is O(n²); the binary search tails array is O(n log n).",
      alsoAccept: ["binary-search"],
    },
    {
      slug: "word-break",
      title: "Word Break",
      difficulty: "Medium",
      prompt: "Can the string be segmented into a space-separated sequence of one or more dictionary words?",
      tell: "\"Segmented\" into words: dp[i] is whether the first i characters can be, checking every last word.",
    },
    {
      slug: "decode-ways",
      title: "Decode Ways",
      difficulty: "Medium",
      prompt: "Letters map to '1' to '26'. Given a digit string, return the number of ways to decode it.",
      tell: "\"Number of ways\" to \"decode\": stairs where a step is one valid digit or two. Watch the zeros.",
    },
    {
      slug: "partition-equal-subset-sum",
      title: "Partition Equal Subset Sum",
      difficulty: "Medium",
      prompt: "Can the array be split into two subsets with equal sum?",
      tell: "\"Equal sum\" halves: can some subset reach total / 2? 0/1 knapsack over a boolean array, iterating sums downwards.",
    },
    {
      slug: "maximum-product-subarray",
      title: "Maximum Product Subarray",
      difficulty: "Medium",
      prompt: "Find the contiguous subarray with the largest product and return the product.",
      tell: "A \"contiguous subarray\" product where a negative flips the order: track both the max and min ending here.",
    },
    {
      slug: "longest-palindromic-substring",
      title: "Longest Palindromic Substring",
      difficulty: "Medium",
      prompt: "Return the longest palindromic substring of s.",
      tell: "Expand around each of the 2n - 1 centres, O(n²) time and O(1) space. The dp table over (i, j) is the textbook alternative.",
      alsoAccept: ["two-pointers", "dp-2d"],
    },
    {
      slug: "palindromic-substrings",
      title: "Palindromic Substrings",
      difficulty: "Medium",
      prompt: "Count how many palindromic substrings the string contains.",
      tell: "Counting each \"palindromic substring\": expand around every centre and count as you go.",
      alsoAccept: ["two-pointers", "dp-2d"],
    },
  ],
};
