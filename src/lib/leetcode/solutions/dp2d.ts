import type { Solution } from "../types";

export const dp2dSolutions: Record<string, Solution> = {
  "pascals-triangle": {
    approach: [
      "Every row starts and ends with 1.",
      "Each inside value is the sum of the two values above it in the previous row.",
      "Build the rows one at a time from the one before.",
    ],
    complexity: { time: "O(n²)", space: "O(n²)" },
    code: `function generate(numRows: number): number[][] {
  const rows: number[][] = [];
  for (let r = 0; r < numRows; r++) {
    const row = new Array<number>(r + 1).fill(1);
    for (let c = 1; c < r; c++) row[c] = rows[r - 1][c - 1] + rows[r - 1][c];
    rows.push(row);
  }
  return rows;
}`,
    cases: [
      { call: "generate(5)", expected: [[1], [1, 1], [1, 2, 1], [1, 3, 3, 1], [1, 4, 6, 4, 1]] },
      { call: "generate(1)", expected: [[1]] },
    ],
  },

  "unique-paths": {
    approach: [
      "The paths into a cell are the paths into the cell above plus the paths into the cell to the left.",
      "The first row and column have exactly one path each.",
      "One row of the grid is enough: each cell adds the value to its left onto what's already there.",
    ],
    complexity: { time: "O(m · n)", space: "O(n)" },
    code: `function uniquePaths(m: number, n: number): number {
  const row = new Array<number>(n).fill(1);
  for (let r = 1; r < m; r++) {
    for (let c = 1; c < n; c++) row[c] += row[c - 1];
  }
  return row[n - 1];
}`,
    cases: [
      { call: "uniquePaths(3, 7)", expected: 28 },
      { call: "uniquePaths(3, 2)", expected: 3 },
    ],
  },

  "minimum-path-sum": {
    approach: [
      "The cheapest way into a cell is its own cost plus the cheaper of the cell above and the cell to its left.",
      "The first row and column can only be reached one way.",
      "Fill row by row in one array, and the last cell is the answer.",
    ],
    complexity: { time: "O(m · n)", space: "O(n)" },
    code: `function minPathSum(grid: number[][]): number {
  const cols = grid[0].length;
  const best = new Array<number>(cols).fill(Infinity);
  best[0] = 0;
  for (const row of grid) {
    best[0] += row[0];
    for (let c = 1; c < cols; c++) best[c] = row[c] + Math.min(best[c], best[c - 1]);
  }
  return best[cols - 1];
}`,
    cases: [
      { call: "minPathSum([[1, 3, 1], [1, 5, 1], [4, 2, 1]])", expected: 7 },
      { call: "minPathSum([[1, 2, 3], [4, 5, 6]])", expected: 12 },
    ],
  },

  "longest-common-subsequence": {
    approach: [
      "dp[i][j] is the LCS of the first i characters of one string and the first j of the other.",
      "If those last characters match, it's dp[i - 1][j - 1] + 1.",
      "Otherwise drop a character from one side or the other: max(dp[i - 1][j], dp[i][j - 1]).",
    ],
    complexity: { time: "O(m · n)", space: "O(m · n)" },
    code: `function longestCommonSubsequence(text1: string, text2: string): number {
  const dp = Array.from({ length: text1.length + 1 }, () => new Array<number>(text2.length + 1).fill(0));
  for (let i = 1; i <= text1.length; i++) {
    for (let j = 1; j <= text2.length; j++) {
      dp[i][j] = text1[i - 1] === text2[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[text1.length][text2.length];
}`,
    cases: [
      { call: 'longestCommonSubsequence("abcde", "ace")', expected: 3 },
      { call: 'longestCommonSubsequence("abc", "abc")', expected: 3 },
      { call: 'longestCommonSubsequence("abc", "def")', expected: 0 },
    ],
  },

  "coin-change-ii": {
    approach: [
      "Count combinations, not orderings: loop over coins on the outside and amounts on the inside.",
      "ways[a] += ways[a - coin]. Each coin is added after every earlier coin, so the same set is never counted twice in a different order.",
      "ways[0] = 1, for the empty combination.",
    ],
    complexity: { time: "O(amount · coins)", space: "O(amount)" },
    code: `function change(amount: number, coins: number[]): number {
  const ways = new Array<number>(amount + 1).fill(0);
  ways[0] = 1;
  for (const coin of coins) {
    for (let a = coin; a <= amount; a++) ways[a] += ways[a - coin];
  }
  return ways[amount];
}`,
    cases: [
      { call: "change(5, [1, 2, 5])", expected: 4 },
      { call: "change(3, [2])", expected: 0 },
      { call: "change(10, [10])", expected: 1 },
    ],
  },

  "target-sum": {
    approach: [
      "Split the numbers into a plus group P and a minus group. Then P - (total - P) = target, so P = (total + target) / 2.",
      "If that isn't a whole non-negative number, there are no ways.",
      "Otherwise count the subsets that sum to P with 0/1 knapsack counting, looping sums from high to low.",
    ],
    complexity: { time: "O(n · sum)", space: "O(sum)" },
    code: `function findTargetSumWays(nums: number[], target: number): number {
  const total = nums.reduce((a, b) => a + b, 0);
  if (Math.abs(target) > total || (total + target) % 2 !== 0) return 0;
  const plus = (total + target) / 2;
  const ways = new Array<number>(plus + 1).fill(0);
  ways[0] = 1;
  for (const n of nums) {
    for (let s = plus; s >= n; s--) ways[s] += ways[s - n];
  }
  return ways[plus];
}`,
    cases: [
      { call: "findTargetSumWays([1, 1, 1, 1, 1], 3)", expected: 5 },
      { call: "findTargetSumWays([1], 1)", expected: 1 },
      { call: "findTargetSumWays([0, 0, 1], 1)", expected: 4 },
    ],
  },

  "edit-distance": {
    approach: [
      "dp[i][j] is the edits needed to turn the first i characters of word1 into the first j of word2.",
      "Turning a prefix into the empty string costs its length, which fills the first row and column.",
      "If the characters match, it's dp[i - 1][j - 1]. Otherwise it's 1 + the cheapest of replace (diagonal), delete (up) and insert (left).",
    ],
    complexity: { time: "O(m · n)", space: "O(m · n)" },
    code: `function minDistance(word1: string, word2: string): number {
  const m = word1.length;
  const n = word2.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = word1[i - 1] === word2[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}`,
    cases: [
      { call: 'minDistance("horse", "ros")', expected: 3 },
      { call: 'minDistance("intention", "execution")', expected: 5 },
      { call: 'minDistance("", "abc")', expected: 3 },
    ],
  },

  "interleaving-string": {
    approach: [
      "dp[i][j] means the first i of s1 and the first j of s2 can interleave into the first i + j of s3.",
      "Reach (i, j) from (i - 1, j) if s1's i-th character matches s3's next one, or from (i, j - 1) if s2's matches.",
      "Lengths that don't add up fail straight away. The answer is dp[m][n].",
    ],
    complexity: { time: "O(m · n)", space: "O(m · n)" },
    code: `function isInterleave(s1: string, s2: string, s3: string): boolean {
  const m = s1.length;
  const n = s2.length;
  if (m + n !== s3.length) return false;
  const dp = Array.from({ length: m + 1 }, () => new Array<boolean>(n + 1).fill(false));
  dp[0][0] = true;
  for (let i = 0; i <= m; i++) {
    for (let j = 0; j <= n; j++) {
      if (i > 0 && dp[i - 1][j] && s1[i - 1] === s3[i + j - 1]) dp[i][j] = true;
      if (j > 0 && dp[i][j - 1] && s2[j - 1] === s3[i + j - 1]) dp[i][j] = true;
    }
  }
  return dp[m][n];
}`,
    cases: [
      { call: 'isInterleave("aabcc", "dbbca", "aadbbcbcac")', expected: true },
      { call: 'isInterleave("aabcc", "dbbca", "aadbbbaccc")', expected: false },
      { call: 'isInterleave("", "", "")', expected: true },
    ],
  },

  "best-time-to-buy-and-sell-stock-with-cooldown": {
    approach: [
      "Track three states at the end of each day: holding a share, just sold, or resting with no share.",
      "holding = max(keep holding, buy out of rest). sold = holding yesterday + today's price. rest = max(rest, sold yesterday).",
      "The cooldown is built in, because a buy only comes out of rest, never straight out of sold. The answer is the better of sold and rest.",
    ],
    complexity: { time: "O(n)", space: "O(1)" },
    code: `function maxProfit(prices: number[]): number {
  let holding = -Infinity;
  let sold = 0;
  let rest = 0;
  for (const price of prices) {
    const previousSold = sold;
    sold = holding + price;
    holding = Math.max(holding, rest - price);
    rest = Math.max(rest, previousSold);
  }
  return Math.max(sold, rest);
}`,
    cases: [
      { call: "maxProfit([1, 2, 3, 0, 2])", expected: 3 },
      { call: "maxProfit([1])", expected: 0 },
    ],
  },

  "maximal-square": {
    approach: [
      "dp[r][c] is the side of the largest all-1 square whose bottom-right corner is (r, c).",
      "For a '1', it's 1 + the smallest of the squares above, to the left, and diagonally up-left.",
      "Track the biggest side and return its square.",
    ],
    complexity: { time: "O(m · n)", space: "O(n)" },
    code: `function maximalSquare(matrix: string[][]): number {
  const cols = matrix[0].length;
  let previous = new Array<number>(cols + 1).fill(0);
  let best = 0;
  for (const row of matrix) {
    const current = new Array<number>(cols + 1).fill(0);
    for (let c = 1; c <= cols; c++) {
      if (row[c - 1] === "1") {
        current[c] = 1 + Math.min(previous[c], current[c - 1], previous[c - 1]);
        best = Math.max(best, current[c]);
      }
    }
    previous = current;
  }
  return best * best;
}`,
    cases: [
      {
        call: 'maximalSquare([["1", "0", "1", "0", "0"], ["1", "0", "1", "1", "1"], ["1", "1", "1", "1", "1"], ["1", "0", "0", "1", "0"]])',
        expected: 4,
      },
      { call: 'maximalSquare([["0", "1"], ["1", "0"]])', expected: 1 },
      { call: 'maximalSquare([["0"]])', expected: 0 },
    ],
  },

  "longest-increasing-path-in-a-matrix": {
    approach: [
      "Moving only to strictly larger cells means there can never be a cycle, so memoised DFS works.",
      "The longest path from a cell is 1 + the longest path from any larger neighbour.",
      "Cache each cell's answer, so every cell is solved once. Return the best over all cells.",
    ],
    complexity: { time: "O(m · n)", space: "O(m · n)" },
    code: `function longestIncreasingPath(matrix: number[][]): number {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const memo = Array.from({ length: rows }, () => new Array<number>(cols).fill(0));
  const longest = (r: number, c: number): number => {
    if (memo[r][c] > 0) return memo[r][c];
    let best = 1;
    for (const [nr, nc] of [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]]) {
      if (nr >= 0 && nc >= 0 && nr < rows && nc < cols && matrix[nr][nc] > matrix[r][c]) {
        best = Math.max(best, 1 + longest(nr, nc));
      }
    }
    memo[r][c] = best;
    return best;
  };
  let answer = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) answer = Math.max(answer, longest(r, c));
  }
  return answer;
}`,
    cases: [
      { call: "longestIncreasingPath([[9, 9, 4], [6, 6, 8], [2, 1, 1]])", expected: 4 },
      { call: "longestIncreasingPath([[3, 4, 5], [3, 2, 6], [2, 2, 1]])", expected: 4 },
      { call: "longestIncreasingPath([[1]])", expected: 1 },
    ],
  },

  "distinct-subsequences": {
    approach: [
      "dp[j] counts the ways to form the first j characters of t from the part of s seen so far, with dp[0] = 1.",
      "For each character of s, walk j from the end of t down to 1. If s's character equals t[j - 1], add dp[j - 1] to dp[j].",
      "Going backwards stops a character of s being used twice in one round. The answer is dp[t.length].",
    ],
    complexity: { time: "O(m · n)", space: "O(n)" },
    code: `function numDistinct(s: string, t: string): number {
  const dp = new Array<number>(t.length + 1).fill(0);
  dp[0] = 1;
  for (const ch of s) {
    for (let j = t.length; j >= 1; j--) if (t[j - 1] === ch) dp[j] += dp[j - 1];
  }
  return dp[t.length];
}`,
    cases: [
      { call: 'numDistinct("rabbbit", "rabbit")', expected: 3 },
      { call: 'numDistinct("babgbag", "bag")', expected: 5 },
    ],
  },

  "burst-balloons": {
    approach: [
      "Choose the last balloon to burst in a range rather than the first: its neighbours at that moment are the range's fixed walls.",
      "Pad the array with 1 on both sides. dp[l][r] is the best for the balloons strictly between l and r.",
      "Try every k as the last one: dp[l][k] + dp[k][r] + nums[l] · nums[k] · nums[r]. Fill short ranges before long ones.",
    ],
    complexity: { time: "O(n³)", space: "O(n²)" },
    code: `function maxCoins(nums: number[]): number {
  const padded = [1, ...nums, 1];
  const n = padded.length;
  const dp = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  for (let gap = 2; gap < n; gap++) {
    for (let left = 0; left + gap < n; left++) {
      const right = left + gap;
      for (let k = left + 1; k < right; k++) {
        dp[left][right] = Math.max(dp[left][right], dp[left][k] + dp[k][right] + padded[left] * padded[k] * padded[right]);
      }
    }
  }
  return dp[0][n - 1];
}`,
    cases: [
      { call: "maxCoins([3, 1, 5, 8])", expected: 167 },
      { call: "maxCoins([1, 5])", expected: 10 },
    ],
  },

  "regular-expression-matching": {
    approach: [
      "dp[i][j] means the first i characters of s match the first j characters of the pattern.",
      "A plain character or '.' matches if this pair matches and dp[i - 1][j - 1] does.",
      "'x*' either matches nothing, which is dp[i][j - 2], or eats one more matching character, which is dp[i - 1][j] when s[i - 1] matches x. Seed the empty-string row for patterns like 'a*b*'.",
    ],
    complexity: { time: "O(m · n)", space: "O(m · n)" },
    code: `function isMatch(s: string, p: string): boolean {
  const m = s.length;
  const n = p.length;
  const dp = Array.from({ length: m + 1 }, () => new Array<boolean>(n + 1).fill(false));
  dp[0][0] = true;
  const matches = (i: number, j: number) => p[j - 1] === "." || p[j - 1] === s[i - 1];
  for (let i = 0; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (p[j - 1] === "*") {
        dp[i][j] = dp[i][j - 2] || (i > 0 && dp[i - 1][j] && matches(i, j - 1));
      } else {
        dp[i][j] = i > 0 && dp[i - 1][j - 1] && matches(i, j);
      }
    }
  }
  return dp[m][n];
}`,
    cases: [
      { call: 'isMatch("aa", "a")', expected: false },
      { call: 'isMatch("aa", "a*")', expected: true },
      { call: 'isMatch("ab", ".*")', expected: true },
      { call: 'isMatch("aab", "c*a*b")', expected: true },
      { call: 'isMatch("mississippi", "mis*is*p*.")', expected: false },
    ],
  },
};
