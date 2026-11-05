import type { Solution } from "../types";

export const backtrackingSolutions: Record<string, Solution> = {
  "binary-tree-paths": {
    approach: [
      "DFS from the root, carrying the path so far.",
      "At a leaf, the path is complete, so record it.",
      "Otherwise extend the path into each child that exists.",
    ],
    complexity: { time: "O(n · h)", space: "O(h)" },
    code: `function binaryTreePaths(root: TreeNode | null): string[] {
  const paths: string[] = [];
  const walk = (node: TreeNode | null, path: string) => {
    if (!node) return;
    const here = path === "" ? String(node.val) : path + "->" + node.val;
    if (!node.left && !node.right) paths.push(here);
    walk(node.left, here);
    walk(node.right, here);
  };
  walk(root, "");
  return paths;
}`,
    cases: [
      { call: "binaryTreePaths(treeFromLevelOrder([1, 2, 3, null, 5]))", expected: ["1->2->5", "1->3"] },
      { call: "binaryTreePaths(treeFromLevelOrder([1]))", expected: ["1"] },
    ],
  },

  subsets: {
    approach: [
      "Every node of the recursion is a subset, so record the current path on entry.",
      "Then try adding each remaining element after the current position, recurse, and remove it again.",
      "Starting from the next index means each subset is built once, in one order.",
    ],
    complexity: { time: "O(n · 2^n)", space: "O(n)" },
    code: `function subsets(nums: number[]): number[][] {
  const result: number[][] = [];
  const path: number[] = [];
  const backtrack = (start: number) => {
    result.push([...path]);
    for (let i = start; i < nums.length; i++) {
      path.push(nums[i]);
      backtrack(i + 1);
      path.pop();
    }
  };
  backtrack(0);
  return result;
}`,
    cases: [
      { call: "subsets([1, 2, 3])", expected: [[], [1], [1, 2], [1, 2, 3], [1, 3], [2], [2, 3], [3]] },
      { call: "subsets([0])", expected: [[], [0]] },
    ],
  },

  "subsets-ii": {
    approach: [
      "Sort first, so duplicates sit next to each other.",
      "Same as Subsets: record the path at every node, and try each later element.",
      "At one level of the loop, skip a value equal to the one just tried, because it would start the same subsets again.",
    ],
    complexity: { time: "O(n · 2^n)", space: "O(n)" },
    code: `function subsetsWithDup(nums: number[]): number[][] {
  const sorted = [...nums].sort((a, b) => a - b);
  const result: number[][] = [];
  const path: number[] = [];
  const backtrack = (start: number) => {
    result.push([...path]);
    for (let i = start; i < sorted.length; i++) {
      if (i > start && sorted[i] === sorted[i - 1]) continue;
      path.push(sorted[i]);
      backtrack(i + 1);
      path.pop();
    }
  };
  backtrack(0);
  return result;
}`,
    cases: [
      { call: "subsetsWithDup([1, 2, 2])", expected: [[], [1], [1, 2], [1, 2, 2], [2], [2, 2]] },
      { call: "subsetsWithDup([0])", expected: [[], [0]] },
    ],
  },

  permutations: {
    approach: [
      "Build a permutation one position at a time.",
      "At each step, try every number not used yet: mark it, recurse, then unmark it.",
      "When the path is as long as the input, record a copy.",
    ],
    complexity: { time: "O(n · n!)", space: "O(n)" },
    code: `function permute(nums: number[]): number[][] {
  const result: number[][] = [];
  const path: number[] = [];
  const used = new Array<boolean>(nums.length).fill(false);
  const backtrack = () => {
    if (path.length === nums.length) {
      result.push([...path]);
      return;
    }
    for (let i = 0; i < nums.length; i++) {
      if (used[i]) continue;
      used[i] = true;
      path.push(nums[i]);
      backtrack();
      path.pop();
      used[i] = false;
    }
  };
  backtrack();
  return result;
}`,
    cases: [
      { call: "permute([1, 2, 3])", expected: [[1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]] },
      { call: "permute([0, 1])", expected: [[0, 1], [1, 0]] },
    ],
  },

  "combination-sum": {
    approach: [
      "Pick candidates while tracking what's left of the target.",
      "Recurse starting from the same index, because a number can be reused. Starting from it, rather than 0, stops the same combination appearing in a different order.",
      "Record the path when what's left hits 0. With the candidates sorted, stop the loop as soon as one is too big.",
    ],
    complexity: { time: "O(n^(t/m))", space: "O(t/m)" },
    code: `function combinationSum(candidates: number[], target: number): number[][] {
  const sorted = [...candidates].sort((a, b) => a - b);
  const result: number[][] = [];
  const path: number[] = [];
  const backtrack = (start: number, remaining: number) => {
    if (remaining === 0) {
      result.push([...path]);
      return;
    }
    for (let i = start; i < sorted.length && sorted[i] <= remaining; i++) {
      path.push(sorted[i]);
      backtrack(i, remaining - sorted[i]);
      path.pop();
    }
  };
  backtrack(0, target);
  return result;
}`,
    cases: [
      { call: "combinationSum([2, 3, 6, 7], 7)", expected: [[2, 2, 3], [7]] },
      { call: "combinationSum([2, 3, 5], 8)", expected: [[2, 2, 2, 2], [2, 3, 3], [3, 5]] },
      { call: "combinationSum([2], 1)", expected: [] },
    ],
  },

  "combination-sum-ii": {
    approach: [
      "Sort the candidates. Each one can be used at most once, so recurse from i + 1.",
      "At one level of the loop, skip a value equal to the previous one, so duplicate combinations aren't built.",
      "Stop the loop early once a candidate is bigger than what's left.",
    ],
    complexity: { time: "O(2^n)", space: "O(n)" },
    code: `function combinationSum2(candidates: number[], target: number): number[][] {
  const sorted = [...candidates].sort((a, b) => a - b);
  const result: number[][] = [];
  const path: number[] = [];
  const backtrack = (start: number, remaining: number) => {
    if (remaining === 0) {
      result.push([...path]);
      return;
    }
    for (let i = start; i < sorted.length && sorted[i] <= remaining; i++) {
      if (i > start && sorted[i] === sorted[i - 1]) continue;
      path.push(sorted[i]);
      backtrack(i + 1, remaining - sorted[i]);
      path.pop();
    }
  };
  backtrack(0, target);
  return result;
}`,
    cases: [
      { call: "combinationSum2([10, 1, 2, 7, 6, 1, 5], 8)", expected: [[1, 1, 6], [1, 2, 5], [1, 7], [2, 6]] },
      { call: "combinationSum2([2, 5, 2, 1, 2], 5)", expected: [[1, 2, 2], [5]] },
    ],
  },

  combinations: {
    approach: [
      "Choose numbers in increasing order, so each combination is built once.",
      "From start, try each number, recurse from the next one, then remove it.",
      "Prune: stop the loop when there aren't enough numbers left to fill the remaining slots.",
    ],
    complexity: { time: "O(k · C(n, k))", space: "O(k)" },
    code: `function combine(n: number, k: number): number[][] {
  const result: number[][] = [];
  const path: number[] = [];
  const backtrack = (start: number) => {
    if (path.length === k) {
      result.push([...path]);
      return;
    }
    for (let i = start; i <= n - (k - path.length) + 1; i++) {
      path.push(i);
      backtrack(i + 1);
      path.pop();
    }
  };
  backtrack(1);
  return result;
}`,
    cases: [
      { call: "combine(4, 2)", expected: [[1, 2], [1, 3], [1, 4], [2, 3], [2, 4], [3, 4]] },
      { call: "combine(1, 1)", expected: [[1]] },
    ],
  },

  "letter-combinations-of-a-phone-number": {
    approach: [
      "Map each digit to its letters.",
      "Build strings one digit at a time: for each letter of the current digit, append it and recurse on the next digit.",
      "When every digit has a letter, record the string. Empty input gives an empty list.",
    ],
    complexity: { time: "O(4^n · n)", space: "O(n)" },
    code: `function letterCombinations(digits: string): string[] {
  if (digits === "") return [];
  const letters: Record<string, string> = {
    "2": "abc", "3": "def", "4": "ghi", "5": "jkl", "6": "mno", "7": "pqrs", "8": "tuv", "9": "wxyz",
  };
  const result: string[] = [];
  const backtrack = (i: number, built: string) => {
    if (i === digits.length) {
      result.push(built);
      return;
    }
    for (const letter of letters[digits[i]]) backtrack(i + 1, built + letter);
  };
  backtrack(0, "");
  return result;
}`,
    cases: [
      { call: 'letterCombinations("23")', expected: ["ad", "ae", "af", "bd", "be", "bf", "cd", "ce", "cf"] },
      { call: 'letterCombinations("")', expected: [] },
      { call: 'letterCombinations("2")', expected: ["a", "b", "c"] },
    ],
  },

  "generate-parentheses": {
    approach: [
      "Build the string one character at a time, counting the open and close brackets used.",
      "An open bracket is allowed while fewer than n have been used.",
      "A close bracket is allowed only when it has an open one to match, so close < open. At length 2n, record it.",
    ],
    complexity: { time: "O(4^n / √n)", space: "O(n)" },
    code: `function generateParenthesis(n: number): string[] {
  const result: string[] = [];
  const backtrack = (built: string, open: number, close: number) => {
    if (built.length === 2 * n) {
      result.push(built);
      return;
    }
    if (open < n) backtrack(built + "(", open + 1, close);
    if (close < open) backtrack(built + ")", open, close + 1);
  };
  backtrack("", 0, 0);
  return result;
}`,
    cases: [
      { call: "generateParenthesis(3)", expected: ["((()))", "(()())", "(())()", "()(())", "()()()"] },
      { call: "generateParenthesis(1)", expected: ["()"] },
    ],
  },

  "word-search": {
    approach: [
      "Try every cell as the start of the word.",
      "DFS into the four neighbours, matching one letter at a time.",
      "Mark a cell as used on the way in and put it back on the way out, so a path never reuses a cell.",
    ],
    complexity: { time: "O(m · n · 3^L)", space: "O(L)" },
    code: `function exist(board: string[][], word: string): boolean {
  const rows = board.length;
  const cols = board[0].length;
  const dfs = (r: number, c: number, i: number): boolean => {
    if (i === word.length) return true;
    if (r < 0 || c < 0 || r >= rows || c >= cols || board[r][c] !== word[i]) return false;
    const saved = board[r][c];
    board[r][c] = "#";
    const found = dfs(r + 1, c, i + 1) || dfs(r - 1, c, i + 1) || dfs(r, c + 1, i + 1) || dfs(r, c - 1, i + 1);
    board[r][c] = saved;
    return found;
  };
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) if (dfs(r, c, 0)) return true;
  }
  return false;
}`,
    cases: [
      { call: 'exist([["A", "B", "C", "E"], ["S", "F", "C", "S"], ["A", "D", "E", "E"]], "ABCCED")', expected: true },
      { call: 'exist([["A", "B", "C", "E"], ["S", "F", "C", "S"], ["A", "D", "E", "E"]], "SEE")', expected: true },
      { call: 'exist([["A", "B", "C", "E"], ["S", "F", "C", "S"], ["A", "D", "E", "E"]], "ABCB")', expected: false },
    ],
  },

  "palindrome-partitioning": {
    approach: [
      "Cut the string one piece at a time from the left.",
      "Try every end position for the next piece, and only recurse if that piece is a palindrome.",
      "When the cuts reach the end of the string, record the pieces.",
    ],
    complexity: { time: "O(n · 2^n)", space: "O(n)" },
    code: `function partition(s: string): string[][] {
  const result: string[][] = [];
  const path: string[] = [];
  const isPalindrome = (low: number, high: number) => {
    while (low < high) if (s[low++] !== s[high--]) return false;
    return true;
  };
  const backtrack = (start: number) => {
    if (start === s.length) {
      result.push([...path]);
      return;
    }
    for (let end = start; end < s.length; end++) {
      if (!isPalindrome(start, end)) continue;
      path.push(s.slice(start, end + 1));
      backtrack(end + 1);
      path.pop();
    }
  };
  backtrack(0);
  return result;
}`,
    cases: [
      { call: 'partition("aab")', expected: [["a", "a", "b"], ["aa", "b"]] },
      { call: 'partition("a")', expected: [["a"]] },
    ],
  },

  "n-queens": {
    approach: [
      "Place one queen per row, choosing a column each time.",
      "Track which columns and which diagonals are taken: r - c identifies one diagonal and r + c the other.",
      "Skip any column under attack. Recurse to the next row, and undo the placement on the way back. A full set of n rows is a solution.",
    ],
    complexity: { time: "O(n!)", space: "O(n)" },
    code: `function solveNQueens(n: number): string[][] {
  const result: string[][] = [];
  const queens: number[] = [];
  const cols = new Set<number>();
  const diagonals = new Set<number>();
  const antiDiagonals = new Set<number>();
  const place = (r: number) => {
    if (r === n) {
      result.push(queens.map((c) => ".".repeat(c) + "Q" + ".".repeat(n - c - 1)));
      return;
    }
    for (let c = 0; c < n; c++) {
      if (cols.has(c) || diagonals.has(r - c) || antiDiagonals.has(r + c)) continue;
      cols.add(c);
      diagonals.add(r - c);
      antiDiagonals.add(r + c);
      queens.push(c);
      place(r + 1);
      queens.pop();
      cols.delete(c);
      diagonals.delete(r - c);
      antiDiagonals.delete(r + c);
    }
  };
  place(0);
  return result;
}`,
    cases: [
      { call: "solveNQueens(4)", expected: [[".Q..", "...Q", "Q...", "..Q."], ["..Q.", "Q...", "...Q", ".Q.."]] },
      { call: "solveNQueens(1)", expected: [["Q"]] },
      { call: "solveNQueens(8).length", expected: 92 },
    ],
  },

  "sudoku-solver": {
    approach: [
      "Record which digits each row, column and box already has.",
      "Find the next empty cell and try each digit not already in its row, column or box.",
      "Place it, recurse, and if that leads to a dead end, remove it and try the next digit. The first full board wins.",
    ],
    complexity: { time: "O(9^empty)", space: "O(1)" },
    code: `function solveSudoku(board: string[][]): void {
  const rows = Array.from({ length: 9 }, () => new Set<string>());
  const cols = Array.from({ length: 9 }, () => new Set<string>());
  const boxes = Array.from({ length: 9 }, () => new Set<string>());
  const empty: [number, number][] = [];
  const boxOf = (r: number, c: number) => Math.floor(r / 3) * 3 + Math.floor(c / 3);
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const digit = board[r][c];
      if (digit === ".") empty.push([r, c]);
      else {
        rows[r].add(digit);
        cols[c].add(digit);
        boxes[boxOf(r, c)].add(digit);
      }
    }
  }
  const fill = (i: number): boolean => {
    if (i === empty.length) return true;
    const [r, c] = empty[i];
    const b = boxOf(r, c);
    for (let d = 1; d <= 9; d++) {
      const digit = String(d);
      if (rows[r].has(digit) || cols[c].has(digit) || boxes[b].has(digit)) continue;
      board[r][c] = digit;
      rows[r].add(digit);
      cols[c].add(digit);
      boxes[b].add(digit);
      if (fill(i + 1)) return true;
      board[r][c] = ".";
      rows[r].delete(digit);
      cols[c].delete(digit);
      boxes[b].delete(digit);
    }
    return false;
  };
  fill(0);
}`,
    cases: [
      {
        call: '(() => { const b = ["53..7....", "6..195...", ".98....6.", "8...6...3", "4..8.3..1", "7...2...6", ".6....28.", "...419..5", "....8..79"].map((r) => r.split("")); solveSudoku(b); return b.map((r) => r.join("")); })()',
        expected: ["534678912", "672195348", "198342567", "859761423", "426853791", "713924856", "961537284", "287419635", "345286179"],
      },
      {
        call: '(() => { const b = ["534678912", "672195348", "198342567", "859761423", "426853791", "713924856", "961537284", "287419635", "34528617."].map((r) => r.split("")); solveSudoku(b); return b[8].join(""); })()',
        expected: "345286179",
      },
    ],
  },
};
