import type { Pattern } from "../types";

export const dp2d: Pattern = {
  id: "dp-2d",
  name: "2-D Dynamic Programming",
  phase: 4,
  tagline: "Two strings, a grid, or an index plus a budget: the state needs two numbers.",
  summary:
    "When one index can't describe where you are, the table grows a dimension. Two strings give dp[i][j] over prefixes of each (Longest Common Subsequence, Edit Distance). A grid gives dp[r][c] built from above and left (Unique Paths). An index plus a remaining budget is a knapsack (Coin Change II, Target Sum). The method is the same as 1-D: define the cell in words, write how it comes from its neighbours, set the first row and column, and fill in an order where those neighbours already exist. Most of these compress to one row.",
  question: "Does describing a subproblem take two numbers, like a position in each string or a row and a column?",
  signals: [
    { phrase: "two strings", why: "Comparing two strings means dp over a prefix of each.", weight: 2 },
    { phrase: "common subsequence", why: "LCS: match the last characters or drop one from either side.", weight: 3 },
    { phrase: "edit distance", why: "Insert, delete, replace: three neighbours in the table.", weight: 3 },
    { phrase: "minimum number of operations", why: "Turning one string into another with operations is edit distance." },
    { phrase: "unique paths", why: "Paths in a grid moving right or down add from above and left.", weight: 3 },
    { phrase: "right or down", why: "Moves only right or down make the grid a DAG you can fill row by row.", weight: 2 },
    { phrase: "path sum", why: "Minimum Path Sum in a grid is a min of above and left." },
    { phrase: "interleaving", why: "dp[i][j]: can the first i of s1 and j of s2 form the first i + j of s3?", weight: 2 },
    { phrase: "cooldown", why: "Stock with cooldown: a small state machine per day (holding, sold, resting).", weight: 2 },
    { phrase: "square", why: "Maximal Square: a cell's square is limited by its three neighbours." },
    { phrase: "regular expression", why: "Matching with '*' needs dp over pattern and string positions.", weight: 2 },
    { phrase: "distinct subsequences", why: "Count how many ways one string appears as a subsequence of another.", weight: 2 },
    { phrase: "matrix", why: "A matrix often means a 2-D table, or memoised DFS over cells." },
    { phrase: "target sum", why: "Signs that reach a target are a knapsack over index and sum.", weight: 2 },
    { phrase: "combinations that make up", why: "Coin Change II counts combinations, so coins go in the outer loop.", weight: 2 },
  ],
  antiSignals: [
    "Only one index matters: you're carrying a dimension you don't need.",
    "The grid has weighted moves in every direction: that's a shortest path, not DP.",
  ],
  complexity: { time: "O(m × n)", space: "O(m × n), often O(n) with one rolling row" },
  template: {
    title: "Two strings: match or drop one",
    explanation:
      "Longest Common Subsequence: dp[i][j] is the LCS of the first i characters of a and the first j of b. If the last characters match, extend dp[i - 1][j - 1]; otherwise drop one character from either string and take the better. Row 0 and column 0 are empty prefixes, so zero.",
    code: `function longestCommonSubsequence(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[a.length][b.length];
}`,
    cases: [
      { call: "longestCommonSubsequence('abcde', 'ace')", expected: 3 },
      { call: "longestCommonSubsequence('abc', 'def')", expected: 0 },
    ],
  },
  variants: [
    {
      title: "Edit distance: three neighbours",
      explanation:
        "dp[i][j] is the fewest operations turning the first i of a into the first j of b. Matching characters cost nothing; otherwise it's one plus the best of replace (diagonal), delete (above) or insert (left). The first row and column are all inserts or all deletes.",
      code: `function minDistance(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[a.length][b.length];
}`,
      cases: [
        { call: "minDistance('horse', 'ros')", expected: 3 },
        { call: "minDistance('intention', 'execution')", expected: 5 },
        { call: "minDistance('', 'abc')", expected: 3 },
      ],
    },
    {
      title: "Grid paths in one rolling row",
      explanation:
        "Unique Paths: each cell is the sum of above and left. Keep one row; row[c] still holds 'above' when you read it, and row[c - 1] has just become 'left'.",
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
    {
      title: "Counting combinations: coins outside, amounts inside",
      explanation:
        "Coin Change II counts combinations, not orderings. Looping coins in the outer loop means each coin is considered once, in order, so 1 + 2 and 2 + 1 are the same combination. Swap the loops and you count permutations instead.",
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
  ],
  pitfalls: [
    "Indexing a[i] instead of a[i - 1] when the table has an extra empty-prefix row.",
    "Filling cells before the neighbours they read from exist. Check the loop order against the recurrence.",
    "Swapping the loops in Coin Change II and counting orderings instead of combinations.",
  ],
  jsNotes: [
    "new Array(m).fill(new Array(n).fill(0)) shares one row across every row. Use Array.from with a factory.",
    "Typed arrays (Int32Array) are faster for big tables, but watch overflow: counts can exceed 2^31.",
  ],
  deepDive: "/learn/dynamic-programming",
  prerequisites: ["dp-1d"],
  problems: [
    {
      slug: "pascals-triangle",
      title: "Pascal's Triangle",
      difficulty: "Easy",
      prompt: "Generate the first numRows rows of Pascal's triangle, where each number is the sum of the two numbers directly above it.",
      tell: "Each cell from the row above: the gentlest two-dimensional table there is.",
    },
    {
      slug: "unique-paths",
      title: "Unique Paths",
      difficulty: "Medium",
      prompt: "A robot moves only right or down on an m by n grid. How many unique paths reach the bottom-right corner?",
      tell: "\"Unique paths\" moving \"right or down\": above plus left, in one rolling row.",
    },
    {
      slug: "minimum-path-sum",
      title: "Minimum Path Sum",
      difficulty: "Medium",
      prompt: "Moving only right or down, find a path from top-left to bottom-right that minimises the path sum of the grid.",
      tell: "\"Path sum\" moving \"right or down\": each cell plus the min of above and left.",
    },
    {
      slug: "longest-common-subsequence",
      title: "Longest Common Subsequence",
      difficulty: "Medium",
      prompt: "Given two strings, return the length of their longest common subsequence.",
      tell: "\"Two strings\" and a \"common subsequence\": the template.",
    },
    {
      slug: "coin-change-ii",
      title: "Coin Change II",
      difficulty: "Medium",
      prompt: "Return the number of combinations that make up the amount using unlimited coins of each denomination.",
      tell: "\"Combinations that make up\" an amount: coins in the outer loop so order doesn't count twice.",
    },
    {
      slug: "target-sum",
      title: "Target Sum",
      difficulty: "Medium",
      prompt: "Put a + or - before each number. Return the number of ways the expression evaluates to the target sum.",
      tell: "\"Target sum\" with signs: count subsets summing to (total + target) / 2, a counting knapsack.",
    },
    {
      slug: "edit-distance",
      title: "Edit Distance",
      difficulty: "Medium",
      prompt: "Return the minimum number of operations (insert, delete, replace a character) to convert word1 into word2.",
      tell: "\"Minimum number of operations\" between \"two strings\": \"edit distance\", with diagonal, above and left neighbours.",
    },
    {
      slug: "interleaving-string",
      title: "Interleaving String",
      difficulty: "Medium",
      prompt: "Is s3 formed by an interleaving of s1 and s2, keeping each string's characters in order?",
      tell: "\"Interleaving\": dp[i][j] says whether i chars of s1 and j of s2 build the first i + j of s3.",
    },
    {
      slug: "best-time-to-buy-and-sell-stock-with-cooldown",
      title: "Best Time to Buy and Sell Stock with Cooldown",
      difficulty: "Medium",
      prompt: "After selling you must wait one day (a cooldown) before buying again. Return the maximum profit.",
      tell: "\"Cooldown\": three states per day (holding, just sold, resting) and the transitions between them.",
    },
    {
      slug: "maximal-square",
      title: "Maximal Square",
      difficulty: "Medium",
      prompt: "In a binary matrix, find the largest square containing only 1s and return its area.",
      tell: "Largest \"square\" in a \"matrix\": a cell's side is 1 + the min of its top, left and top-left neighbours.",
    },
    {
      slug: "longest-increasing-path-in-a-matrix",
      title: "Longest Increasing Path in a Matrix",
      difficulty: "Hard",
      prompt: "Return the length of the longest strictly increasing path in a matrix, moving in four directions.",
      tell: "Four directions means no fill order, but strictly increasing means no cycles: DFS from each cell with a memo.",
      alsoAccept: ["graphs", "topological-sort"],
    },
    {
      slug: "distinct-subsequences",
      title: "Distinct Subsequences",
      difficulty: "Hard",
      prompt: "Return the number of distinct subsequences of s that equal t.",
      tell: "\"Distinct subsequences\" of one string matching another: dp over both prefixes, adding the match and skip cases.",
    },
    {
      slug: "burst-balloons",
      title: "Burst Balloons",
      difficulty: "Hard",
      prompt: "Bursting balloon i earns nums[left] × nums[i] × nums[right] coins. Return the maximum coins from bursting all of them.",
      tell: "Interval DP: choose which balloon bursts last inside (l, r), so its neighbours are fixed as l and r.",
    },
    {
      slug: "regular-expression-matching",
      title: "Regular Expression Matching",
      difficulty: "Hard",
      prompt: "Implement regular expression matching with '.' and '*' over the entire input string.",
      tell: "\"Regular expression\" with '*': dp over string and pattern positions; '*' means zero copies (skip two in the pattern) or one more.",
    },
  ],
};
