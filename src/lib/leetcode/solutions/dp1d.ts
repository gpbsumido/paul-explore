import type { Solution } from "../types";

export const dp1dSolutions: Record<string, Solution> = {
  "climbing-stairs": {
    approach: [
      "The last move onto step n came from n - 1 or n - 2, so ways(n) = ways(n - 1) + ways(n - 2).",
      "That's Fibonacci. Keep only the last two values and roll them forward.",
    ],
    complexity: { time: "O(n)", space: "O(1)" },
    code: `function climbStairs(n: number): number {
  let previous = 1;
  let current = 1;
  for (let i = 2; i <= n; i++) [previous, current] = [current, previous + current];
  return current;
}`,
    cases: [
      { call: "climbStairs(2)", expected: 2 },
      { call: "climbStairs(3)", expected: 3 },
      { call: "climbStairs(5)", expected: 8 },
    ],
  },

  "min-cost-climbing-stairs": {
    approach: [
      "The cost to reach step i is the cheaper of reaching i - 1 and paying for it, or reaching i - 2 and paying for that.",
      "Steps 0 and 1 are free to start on.",
      "The answer is the cost of reaching the step just past the end. Two rolling variables are enough.",
    ],
    complexity: { time: "O(n)", space: "O(1)" },
    code: `function minCostClimbingStairs(cost: number[]): number {
  let twoBack = 0;
  let oneBack = 0;
  for (let i = 2; i <= cost.length; i++) {
    const here = Math.min(oneBack + cost[i - 1], twoBack + cost[i - 2]);
    twoBack = oneBack;
    oneBack = here;
  }
  return oneBack;
}`,
    cases: [
      { call: "minCostClimbingStairs([10, 15, 20])", expected: 15 },
      { call: "minCostClimbingStairs([1, 100, 1, 1, 1, 100, 1, 1, 100, 1])", expected: 6 },
    ],
  },

  "house-robber": {
    approach: [
      "At each house, either skip it (keep the best so far) or rob it (its money plus the best from two houses back).",
      "best(i) = max(best(i - 1), best(i - 2) + nums[i]).",
      "Roll two variables forward.",
    ],
    complexity: { time: "O(n)", space: "O(1)" },
    code: `function rob(nums: number[]): number {
  let twoBack = 0;
  let oneBack = 0;
  for (const money of nums) [twoBack, oneBack] = [oneBack, Math.max(oneBack, twoBack + money)];
  return oneBack;
}`,
    cases: [
      { call: "rob([1, 2, 3, 1])", expected: 4 },
      { call: "rob([2, 7, 9, 3, 1])", expected: 12 },
    ],
  },

  "house-robber-ii": {
    approach: [
      "The houses form a circle, so the first and last can't both be robbed.",
      "Solve the straight-line problem twice: once without the last house, once without the first.",
      "Take the better of the two. A single house is its own answer.",
    ],
    complexity: { time: "O(n)", space: "O(1)" },
    code: `function rob(nums: number[]): number {
  if (nums.length === 1) return nums[0];
  const robLine = (houses: number[]) => {
    let twoBack = 0;
    let oneBack = 0;
    for (const money of houses) [twoBack, oneBack] = [oneBack, Math.max(oneBack, twoBack + money)];
    return oneBack;
  };
  return Math.max(robLine(nums.slice(0, -1)), robLine(nums.slice(1)));
}`,
    cases: [
      { call: "rob([2, 3, 2])", expected: 3 },
      { call: "rob([1, 2, 3, 1])", expected: 4 },
      { call: "rob([1, 2, 3])", expected: 3 },
    ],
  },

  "maximum-subarray": {
    approach: [
      "Kadane's: the best subarray ending at i either extends the best one ending at i - 1 or starts fresh at i.",
      "Start fresh whenever the running sum would drag the total down, which means it's negative.",
      "Keep the best sum seen at any point.",
    ],
    complexity: { time: "O(n)", space: "O(1)" },
    code: `function maxSubArray(nums: number[]): number {
  let current = nums[0];
  let best = nums[0];
  for (let i = 1; i < nums.length; i++) {
    current = Math.max(nums[i], current + nums[i]);
    best = Math.max(best, current);
  }
  return best;
}`,
    cases: [
      { call: "maxSubArray([-2, 1, -3, 4, -1, 2, 1, -5, 4])", expected: 6 },
      { call: "maxSubArray([1])", expected: 1 },
      { call: "maxSubArray([5, 4, -1, 7, 8])", expected: 23 },
    ],
  },

  "coin-change": {
    approach: [
      "dp[a] is the fewest coins that make amount a, with dp[0] = 0 and everything else Infinity.",
      "For each amount, try each coin: dp[a] = min(dp[a], dp[a - coin] + 1).",
      "If dp[amount] is still Infinity, it can't be made, so return -1.",
    ],
    complexity: { time: "O(amount · coins)", space: "O(amount)" },
    code: `function coinChange(coins: number[], amount: number): number {
  const dp = new Array<number>(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let a = 1; a <= amount; a++) {
    for (const coin of coins) if (coin <= a) dp[a] = Math.min(dp[a], dp[a - coin] + 1);
  }
  return dp[amount] === Infinity ? -1 : dp[amount];
}`,
    cases: [
      { call: "coinChange([1, 2, 5], 11)", expected: 3 },
      { call: "coinChange([2], 3)", expected: -1 },
      { call: "coinChange([1], 0)", expected: 0 },
    ],
  },

  "longest-increasing-subsequence": {
    approach: [
      "Keep tails[k] as the smallest possible last value of an increasing subsequence of length k + 1.",
      "For each number, binary search for the first tail at least as big and replace it. If none is, append it.",
      "The length of tails is the answer. The array itself isn't a real subsequence, but its length is right.",
    ],
    complexity: { time: "O(n log n)", space: "O(n)" },
    code: `function lengthOfLIS(nums: number[]): number {
  const tails: number[] = [];
  for (const n of nums) {
    let low = 0;
    let high = tails.length;
    while (low < high) {
      const mid = (low + high) >> 1;
      if (tails[mid] < n) low = mid + 1;
      else high = mid;
    }
    tails[low] = n;
  }
  return tails.length;
}`,
    cases: [
      { call: "lengthOfLIS([10, 9, 2, 5, 3, 7, 101, 18])", expected: 4 },
      { call: "lengthOfLIS([0, 1, 0, 3, 2, 3])", expected: 4 },
      { call: "lengthOfLIS([7, 7, 7, 7])", expected: 1 },
    ],
    alternative: {
      name: "O(n²) DP",
      approach: [
        "dp[i] is the longest increasing subsequence that ends at nums[i]. Every dp[i] starts at 1.",
        "For each i, look back at every j before it. If nums[j] < nums[i], dp[i] can be dp[j] + 1.",
        "The answer is the largest dp[i]. This is the version to derive first, and the tails array is how it gets faster.",
      ],
      complexity: { time: "O(n²)", space: "O(n)" },
      code: `function lengthOfLIS(nums: number[]): number {
  const longestEndingAt = new Array<number>(nums.length).fill(1);
  for (let i = 1; i < nums.length; i++) {
    for (let j = 0; j < i; j++) {
      if (nums[j] < nums[i]) longestEndingAt[i] = Math.max(longestEndingAt[i], longestEndingAt[j] + 1);
    }
  }
  return Math.max(...longestEndingAt);
}`,
      cases: [
        { call: "lengthOfLIS([10, 9, 2, 5, 3, 7, 101, 18])", expected: 4 },
        { call: "lengthOfLIS([0, 1, 0, 3, 2, 3])", expected: 4 },
        { call: "lengthOfLIS([7, 7, 7, 7])", expected: 1 },
      ],
    },
  },

  "word-break": {
    approach: [
      "can[i] means the first i characters split into dictionary words, and can[0] is true.",
      "can[i] is true if some j < i has can[j] true and s[j..i) in the dictionary.",
      "The answer is can[s.length]. Only checking word-length gaps keeps it quick.",
    ],
    complexity: { time: "O(n · w · L)", space: "O(n)" },
    code: `function wordBreak(s: string, wordDict: string[]): boolean {
  const can = new Array<boolean>(s.length + 1).fill(false);
  can[0] = true;
  for (let i = 1; i <= s.length; i++) {
    can[i] = wordDict.some((word) => word.length <= i && can[i - word.length] && s.startsWith(word, i - word.length));
  }
  return can[s.length];
}`,
    cases: [
      { call: 'wordBreak("leetcode", ["leet", "code"])', expected: true },
      { call: 'wordBreak("applepenapple", ["apple", "pen"])', expected: true },
      { call: 'wordBreak("catsandog", ["cats", "dog", "sand", "and", "cat"])', expected: false },
    ],
  },

  "decode-ways": {
    approach: [
      "ways(i) counts the decodings of the first i characters.",
      "A non-zero single digit adds ways(i - 1). A two-digit chunk from 10 to 26 adds ways(i - 2).",
      "A '0' can only be the end of '10' or '20'. Roll two variables forward.",
    ],
    complexity: { time: "O(n)", space: "O(1)" },
    code: `function numDecodings(s: string): number {
  let twoBack = 1;
  let oneBack = s[0] === "0" ? 0 : 1;
  for (let i = 2; i <= s.length; i++) {
    let here = 0;
    if (s[i - 1] !== "0") here += oneBack;
    const pair = Number(s.slice(i - 2, i));
    if (pair >= 10 && pair <= 26) here += twoBack;
    twoBack = oneBack;
    oneBack = here;
  }
  return oneBack;
}`,
    cases: [
      { call: 'numDecodings("12")', expected: 2 },
      { call: 'numDecodings("226")', expected: 3 },
      { call: 'numDecodings("06")', expected: 0 },
      { call: 'numDecodings("10")', expected: 1 },
    ],
  },

  "partition-equal-subset-sum": {
    approach: [
      "Splitting into two equal halves means finding a subset that sums to total / 2. An odd total can't be split.",
      "0/1 knapsack on reachable sums: can[s] is whether some subset hits s.",
      "For each number, update can from high sums down to low, so each number is used at most once.",
    ],
    complexity: { time: "O(n · sum)", space: "O(sum)" },
    code: `function canPartition(nums: number[]): boolean {
  const total = nums.reduce((a, b) => a + b, 0);
  if (total % 2 === 1) return false;
  const target = total / 2;
  const can = new Array<boolean>(target + 1).fill(false);
  can[0] = true;
  for (const n of nums) {
    for (let s = target; s >= n; s--) if (can[s - n]) can[s] = true;
  }
  return can[target];
}`,
    cases: [
      { call: "canPartition([1, 5, 11, 5])", expected: true },
      { call: "canPartition([1, 2, 3, 5])", expected: false },
    ],
  },

  "maximum-product-subarray": {
    approach: [
      "A negative number turns the smallest product into the largest, so track both.",
      "At each number, the new max and min come from the number itself, number × old max, and number × old min.",
      "Keep the best max seen.",
    ],
    complexity: { time: "O(n)", space: "O(1)" },
    code: `function maxProduct(nums: number[]): number {
  let high = nums[0];
  let low = nums[0];
  let best = nums[0];
  for (let i = 1; i < nums.length; i++) {
    const n = nums[i];
    const candidates = [n, n * high, n * low];
    high = Math.max(...candidates);
    low = Math.min(...candidates);
    best = Math.max(best, high);
  }
  return best;
}`,
    cases: [
      { call: "maxProduct([2, 3, -2, 4])", expected: 6 },
      { call: "maxProduct([-2, 0, -1])", expected: 0 },
      { call: "maxProduct([-2, 3, -4])", expected: 24 },
    ],
  },

  "longest-palindromic-substring": {
    approach: [
      "Every palindrome has a centre: either a character or the gap between two.",
      "Expand outward from all 2n - 1 centres while the two ends match.",
      "Keep the longest stretch found.",
    ],
    complexity: { time: "O(n²)", space: "O(1)" },
    code: `function longestPalindrome(s: string): string {
  let bestStart = 0;
  let bestLength = 0;
  const expand = (left: number, right: number) => {
    while (left >= 0 && right < s.length && s[left] === s[right]) {
      left--;
      right++;
    }
    if (right - left - 1 > bestLength) {
      bestStart = left + 1;
      bestLength = right - left - 1;
    }
  };
  for (let i = 0; i < s.length; i++) {
    expand(i, i);
    expand(i, i + 1);
  }
  return s.slice(bestStart, bestStart + bestLength);
}`,
    cases: [
      { call: 'longestPalindrome("babad")', expected: "bab" },
      { call: 'longestPalindrome("cbbd")', expected: "bb" },
      { call: 'longestPalindrome("a")', expected: "a" },
    ],
  },

  "palindromic-substrings": {
    approach: [
      "Expand from every centre, both single characters and the gaps between them.",
      "Each successful step outward is one more palindrome.",
      "Add up the counts from all centres.",
    ],
    complexity: { time: "O(n²)", space: "O(1)" },
    code: `function countSubstrings(s: string): number {
  let count = 0;
  const expand = (left: number, right: number) => {
    while (left >= 0 && right < s.length && s[left] === s[right]) {
      count++;
      left--;
      right++;
    }
  };
  for (let i = 0; i < s.length; i++) {
    expand(i, i);
    expand(i, i + 1);
  }
  return count;
}`,
    cases: [
      { call: 'countSubstrings("abc")', expected: 3 },
      { call: 'countSubstrings("aaa")', expected: 6 },
    ],
  },
};
