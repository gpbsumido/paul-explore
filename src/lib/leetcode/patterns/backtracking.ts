import type { Pattern } from "../types";

export const backtracking: Pattern = {
  id: "backtracking",
  name: "Backtracking",
  phase: 3,
  tagline: "Choose, explore, un-choose. Prune anything that can't work.",
  summary:
    "When a question asks for all combinations, permutations, subsets or arrangements, there's no shortcut around generating them, so the job is to generate them without waste. Build a candidate one choice at a time, recurse, then undo the choice and try the next. The recursion tree is the search space; pruning cuts off branches that can no longer lead to an answer. Tiny constraints (n ≤ 15 or so) are the giveaway that exponential time is expected.",
  question: "Am I asked to list every valid arrangement, and can I build one choice at a time and undo it?",
  signals: [
    { phrase: "all possible", why: "Listing every possibility is enumeration, which is backtracking.", weight: 2 },
    { phrase: "all combinations", why: "Combinations are built by choosing and un-choosing.", weight: 2 },
    { phrase: "all permutations", why: "Permutations: pick each unused element, recurse, unpick.", weight: 2 },
    { phrase: "permutations", why: "Generating orderings is a backtracking tree." },
    { phrase: "combinations", why: "Combinations recurse with a start index to avoid repeats." },
    { phrase: "subsets", why: "Each element is in or out: a binary recursion tree.", weight: 2 },
    { phrase: "power set", why: "The power set is every subset." },
    { phrase: "generate all", why: "Generate-all questions enumerate with pruning." },
    { phrase: "well-formed", why: "Generate Parentheses: add ( while some remain, ) while it stays balanced." },
    { phrase: "partition", why: "Partition into valid pieces: choose the next cut, recurse on the rest." },
    { phrase: "n-queens", why: "Place one queen per row, prune attacked columns and diagonals.", weight: 3 },
    { phrase: "sudoku", why: "Fill cells one at a time, undo on contradiction." },
    { phrase: "adjacent cells", why: "Word Search: DFS through neighbours, mark visited, unmark on return." },
    { phrase: "letter combinations", why: "One digit per level, one branch per letter.", weight: 2 },
    { phrase: "unique combinations", why: "Sort first and skip equal siblings to avoid duplicates." },
  ],
  antiSignals: [
    "You only need the count or the best value, not the list: that's often DP, which shares subproblems backtracking recomputes.",
    "n is large (10^4+): exponential enumeration won't finish; look for structure.",
  ],
  complexity: { time: "O(branches^depth), e.g. O(n · 2^n) for subsets, O(n · n!) for permutations", space: "O(depth) plus the output" },
  template: {
    title: "Choose, recurse, un-choose",
    explanation:
      "path holds the current partial answer. At each call, record it if it's complete, then try each next choice: push it, recurse, pop it. Copy the path when recording, because it keeps changing after you save it. The start index stops combinations from being produced twice in a different order.",
    code: `function subsets(nums: number[]): number[][] {
  const result: number[][] = [];
  const path: number[] = [];
  function build(start: number): void {
    result.push([...path]);
    for (let i = start; i < nums.length; i++) {
      path.push(nums[i]);
      build(i + 1);
      path.pop();
    }
  }
  build(0);
  return result;
}`,
    cases: [
      { call: "subsets([1, 2, 3])", expected: [[], [1], [1, 2], [1, 2, 3], [1, 3], [2], [2, 3], [3]] },
      { call: "subsets([0])", expected: [[], [0]] },
    ],
  },
  variants: [
    {
      title: "Permutations: track what's used",
      explanation: "Order matters, so every unused element is a choice at every level. A boolean array marks what's on the path.",
      code: `function permute(nums: number[]): number[][] {
  const result: number[][] = [];
  const path: number[] = [];
  const used = new Array<boolean>(nums.length).fill(false);
  function build(): void {
    if (path.length === nums.length) {
      result.push([...path]);
      return;
    }
    for (let i = 0; i < nums.length; i++) {
      if (used[i]) continue;
      used[i] = true;
      path.push(nums[i]);
      build();
      path.pop();
      used[i] = false;
    }
  }
  build();
  return result;
}`,
      cases: [
        { call: "permute([1, 2, 3]).length", expected: 6 },
        { call: "permute([0, 1])", expected: [[0, 1], [1, 0]] },
      ],
    },
    {
      title: "Combination sum: prune by what's left",
      explanation:
        "Candidates can be reused, so recurse with i, not i + 1. Sorting first means once a candidate is too big, every later one is too, so break instead of continue.",
      code: `function combinationSum(candidates: number[], target: number): number[][] {
  const sorted = [...candidates].sort((a, b) => a - b);
  const result: number[][] = [];
  const path: number[] = [];
  function build(start: number, remaining: number): void {
    if (remaining === 0) {
      result.push([...path]);
      return;
    }
    for (let i = start; i < sorted.length; i++) {
      if (sorted[i] > remaining) break;
      path.push(sorted[i]);
      build(i, remaining - sorted[i]);
      path.pop();
    }
  }
  build(0, target);
  return result;
}`,
      cases: [
        { call: "combinationSum([2, 3, 6, 7], 7)", expected: [[2, 2, 3], [7]] },
        { call: "combinationSum([2], 1)", expected: [] },
      ],
    },
  ],
  pitfalls: [
    "Pushing path itself instead of a copy, so every saved answer ends up as the same (empty) array.",
    "Forgetting to undo: a missing pop() or used[i] = false leaks state into sibling branches.",
    "Duplicates in the input: sort, then skip nums[i] === nums[i - 1] when i > start.",
  ],
  jsNotes: [
    "[...path] or path.slice() copies; JSON round-trips are slower and unnecessary.",
    "A nested function closing over path and result keeps the recursive signature down to the index.",
  ],
  deepDive: "/learn/recursion-backtracking",
  prerequisites: ["tree-dfs"],
  problems: [
    {
      slug: "binary-tree-paths",
      title: "Binary Tree Paths",
      difficulty: "Easy",
      prompt: "Return all root-to-leaf paths of a binary tree as strings like '1->2->5'.",
      tell: "\"All\" paths: push the node onto the path, recurse into children, pop on the way back. The gentlest backtracking there is.",
      alsoAccept: ["tree-dfs"],
    },
    {
      slug: "subsets",
      title: "Subsets",
      difficulty: "Medium",
      prompt: "Given distinct integers, return all possible subsets (the power set), without duplicate subsets.",
      tell: "\"All possible\" \"subsets\": the template. Record every node of the recursion tree.",
    },
    {
      slug: "subsets-ii",
      title: "Subsets II",
      difficulty: "Medium",
      prompt: "The array may contain duplicates. Return all possible subsets without duplicate subsets.",
      tell: "Subsets with duplicates: sort, and skip an element equal to its previous sibling at the same level.",
    },
    {
      slug: "permutations",
      title: "Permutations",
      difficulty: "Medium",
      prompt: "Given an array of distinct integers, return all possible permutations.",
      tell: "\"All possible permutations\": every unused element at every level, tracked with a used array.",
    },
    {
      slug: "combination-sum",
      title: "Combination Sum",
      difficulty: "Medium",
      prompt: "Return all unique combinations of candidates that sum to target. The same number may be chosen unlimited times.",
      tell: "\"Unique combinations\" with reuse: recurse from i rather than i + 1, and stop once a candidate exceeds what's left.",
    },
    {
      slug: "combination-sum-ii",
      title: "Combination Sum II",
      difficulty: "Medium",
      prompt: "Each candidate may be used once and the candidates contain duplicates. Return all unique combinations summing to target.",
      tell: "Once each plus duplicates: sort, recurse from i + 1, skip equal siblings.",
    },
    {
      slug: "combinations",
      title: "Combinations",
      difficulty: "Medium",
      prompt: "Return all possible combinations of k numbers chosen from 1 to n.",
      tell: "\"All possible combinations\" of size k: record when the path reaches k; prune when too few numbers remain.",
    },
    {
      slug: "letter-combinations-of-a-phone-number",
      title: "Letter Combinations of a Phone Number",
      difficulty: "Medium",
      prompt: "Given a string of digits 2 to 9, return all possible letter combinations the number could represent on a phone keypad.",
      tell: "\"Letter combinations\": one recursion level per digit, one branch per letter on that key.",
    },
    {
      slug: "generate-parentheses",
      title: "Generate Parentheses",
      difficulty: "Medium",
      prompt: "Given n pairs, generate all combinations of well-formed parentheses.",
      tell: "\"Generate all\" \"well-formed\": add ( while opens remain, add ) only while closes are fewer than opens. That pruning keeps every path valid.",
    },
    {
      slug: "word-search",
      title: "Word Search",
      difficulty: "Medium",
      prompt: "Return true if the word can be traced through sequentially adjacent cells of a letter grid, using each cell at most once.",
      tell: "\"Adjacent cells\", each used once: DFS, mark the cell visited, recurse to four neighbours, unmark on the way back.",
      alsoAccept: ["graphs"],
    },
    {
      slug: "palindrome-partitioning",
      title: "Palindrome Partitioning",
      difficulty: "Medium",
      prompt: "Partition a string so every substring of the partition is a palindrome. Return all possible palindrome partitionings.",
      tell: "\"Partition\" and \"all possible\": choose the next cut where the prefix is a palindrome, recurse on the rest.",
    },
    {
      slug: "n-queens",
      title: "N-Queens",
      difficulty: "Hard",
      prompt: "Place n queens on an n by n chessboard so that no two attack each other. Return all distinct solutions.",
      tell: "\"N-queens\": one queen per row; Sets of used columns and both diagonals (r - c and r + c) prune in O(1).",
    },
    {
      slug: "sudoku-solver",
      title: "Sudoku Solver",
      difficulty: "Hard",
      prompt: "Fill the empty cells of a sudoku board so every row, column and 3 by 3 box contains the digits 1 to 9 exactly once.",
      tell: "\"Sudoku\": find an empty cell, try each digit allowed by its row, column and box, recurse, undo on failure.",
    },
  ],
};
