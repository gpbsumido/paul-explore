import type { Solution } from "../types";

export const arraysHashingSolutions: Record<string, Solution> = {
  "contains-duplicate": {
    approach: [
      "Walk the array once, keeping a Set of every value seen so far.",
      "If a value is already in the Set, that's a repeat, so return true straight away.",
      "Reaching the end means every value was distinct.",
    ],
    complexity: { time: "O(n)", space: "O(n)" },
    code: `function containsDuplicate(nums: number[]): boolean {
  const seen = new Set<number>();
  for (const n of nums) {
    if (seen.has(n)) return true;
    seen.add(n);
  }
  return false;
}`,
    cases: [
      { call: "containsDuplicate([1, 2, 3, 1])", expected: true },
      { call: "containsDuplicate([1, 2, 3, 4])", expected: false },
    ],
  },

  "valid-anagram": {
    approach: [
      "Different lengths can't be anagrams, so check that first.",
      "Count each letter of the first string up and each letter of the second string down, in one 26-slot array.",
      "Every slot ends at zero exactly when the two strings use the same letters the same number of times.",
    ],
    complexity: { time: "O(n)", space: "O(1)" },
    code: `function isAnagram(s: string, t: string): boolean {
  if (s.length !== t.length) return false;
  const counts = new Array<number>(26).fill(0);
  for (let i = 0; i < s.length; i++) {
    counts[s.charCodeAt(i) - 97]++;
    counts[t.charCodeAt(i) - 97]--;
  }
  return counts.every((c) => c === 0);
}`,
    cases: [
      { call: 'isAnagram("anagram", "nagaram")', expected: true },
      { call: 'isAnagram("rat", "car")', expected: false },
    ],
  },

  "two-sum": {
    approach: [
      "For each number, the partner it needs is target minus that number.",
      "Keep a Map from value to index for everything already passed.",
      "If the partner is in the Map, return both indices; otherwise record the current number and move on.",
    ],
    complexity: { time: "O(n)", space: "O(n)" },
    code: `function twoSum(nums: number[], target: number): number[] {
  const indexOf = new Map<number, number>();
  for (let i = 0; i < nums.length; i++) {
    const partner = indexOf.get(target - nums[i]);
    if (partner !== undefined) return [partner, i];
    indexOf.set(nums[i], i);
  }
  return [];
}`,
    cases: [
      { call: "twoSum([2, 7, 11, 15], 9)", expected: [0, 1] },
      { call: "twoSum([3, 2, 4], 6)", expected: [1, 2] },
    ],
  },

  "majority-element": {
    approach: [
      "Boyer-Moore voting: keep a candidate and a count.",
      "When the count is zero, adopt the current number as the candidate.",
      "Add one for a match and subtract one otherwise. The majority survives because it outnumbers everything else combined.",
    ],
    complexity: { time: "O(n)", space: "O(1)" },
    code: `function majorityElement(nums: number[]): number {
  let candidate = nums[0];
  let count = 0;
  for (const n of nums) {
    if (count === 0) candidate = n;
    count += n === candidate ? 1 : -1;
  }
  return candidate;
}`,
    cases: [
      { call: "majorityElement([3, 2, 3])", expected: 3 },
      { call: "majorityElement([2, 2, 1, 1, 1, 2, 2])", expected: 2 },
    ],
  },

  "group-anagrams": {
    approach: [
      "Anagrams share a signature: the same letter counts.",
      "Build a key for each word from its 26 letter counts and group words under that key in a Map.",
      "Return the Map's values.",
    ],
    complexity: { time: "O(n · k)", space: "O(n · k)" },
    code: `function groupAnagrams(strs: string[]): string[][] {
  const groups = new Map<string, string[]>();
  for (const word of strs) {
    const counts = new Array<number>(26).fill(0);
    for (const ch of word) counts[ch.charCodeAt(0) - 97]++;
    const key = counts.join(",");
    const group = groups.get(key);
    if (group) group.push(word);
    else groups.set(key, [word]);
  }
  return [...groups.values()];
}`,
    cases: [
      {
        call: 'groupAnagrams(["eat", "tea", "tan", "ate", "nat", "bat"]).map((g) => [...g].sort().join()).sort()',
        expected: ["ate,eat,tea", "bat", "nat,tan"],
      },
      { call: 'groupAnagrams([""])', expected: [[""]] },
    ],
  },

  "top-k-frequent-elements": {
    approach: [
      "Count every value with a Map.",
      "Bucket sort by frequency: bucket i holds the values seen exactly i times, and no value can be seen more than n times.",
      "Walk the buckets from the highest frequency down, collecting values until there are k.",
    ],
    complexity: { time: "O(n)", space: "O(n)" },
    code: `function topKFrequent(nums: number[], k: number): number[] {
  const counts = new Map<number, number>();
  for (const n of nums) counts.set(n, (counts.get(n) ?? 0) + 1);
  const buckets: number[][] = Array.from({ length: nums.length + 1 }, () => []);
  for (const [value, count] of counts) buckets[count].push(value);
  const result: number[] = [];
  for (let freq = buckets.length - 1; freq > 0 && result.length < k; freq--) {
    for (const value of buckets[freq]) {
      if (result.length < k) result.push(value);
    }
  }
  return result;
}`,
    cases: [
      { call: "topKFrequent([1, 1, 1, 2, 2, 3], 2).sort((a, b) => a - b)", expected: [1, 2] },
      { call: "topKFrequent([1], 1)", expected: [1] },
    ],
  },

  "valid-sudoku": {
    approach: [
      "Every filled digit belongs to one row, one column and one 3x3 box.",
      "Keep a Set per row, per column and per box. The box index is floor(r / 3) * 3 + floor(c / 3).",
      "If a digit is already in any of its three Sets, the board is invalid.",
    ],
    complexity: { time: "O(1)", space: "O(1)" },
    code: `function isValidSudoku(board: string[][]): boolean {
  const rows = Array.from({ length: 9 }, () => new Set<string>());
  const cols = Array.from({ length: 9 }, () => new Set<string>());
  const boxes = Array.from({ length: 9 }, () => new Set<string>());
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const digit = board[r][c];
      if (digit === ".") continue;
      const box = Math.floor(r / 3) * 3 + Math.floor(c / 3);
      if (rows[r].has(digit) || cols[c].has(digit) || boxes[box].has(digit)) return false;
      rows[r].add(digit);
      cols[c].add(digit);
      boxes[box].add(digit);
    }
  }
  return true;
}`,
    cases: [
      {
        call: 'isValidSudoku(["53..7....", "6..195...", ".98....6.", "8...6...3", "4..8.3..1", "7...2...6", ".6....28.", "...419..5", "....8..79"].map((row) => row.split("")))',
        expected: true,
      },
      {
        call: 'isValidSudoku(["83..7....", "6..195...", ".98....6.", "8...6...3", "4..8.3..1", "7...2...6", ".6....28.", "...419..5", "....8..79"].map((row) => row.split("")))',
        expected: false,
      },
    ],
  },

  "longest-consecutive-sequence": {
    approach: [
      "Put every number in a Set for O(1) lookups.",
      "Only start counting from a number whose predecessor isn't in the Set, since that's the start of a run.",
      "From each start, step up while the next number exists, and keep the longest run. Each number is visited at most twice.",
    ],
    complexity: { time: "O(n)", space: "O(n)" },
    code: `function longestConsecutive(nums: number[]): number {
  const values = new Set(nums);
  let longest = 0;
  for (const n of values) {
    if (values.has(n - 1)) continue;
    let length = 1;
    while (values.has(n + length)) length++;
    longest = Math.max(longest, length);
  }
  return longest;
}`,
    cases: [
      { call: "longestConsecutive([100, 4, 200, 1, 3, 2])", expected: 4 },
      { call: "longestConsecutive([0, 3, 7, 2, 5, 8, 4, 6, 0, 1])", expected: 9 },
      { call: "longestConsecutive([])", expected: 0 },
    ],
  },

  "first-missing-positive": {
    approach: [
      "The answer is somewhere in 1..n+1, so the array itself can be the hash table.",
      "Swap each value v in 1..n into index v - 1 until every slot that can hold its own value does.",
      "The first index i where nums[i] isn't i + 1 gives the answer i + 1. If every slot matches, it's n + 1.",
    ],
    complexity: { time: "O(n)", space: "O(1)" },
    code: `function firstMissingPositive(nums: number[]): number {
  const n = nums.length;
  for (let i = 0; i < n; i++) {
    while (nums[i] >= 1 && nums[i] <= n && nums[nums[i] - 1] !== nums[i]) {
      const target = nums[i] - 1;
      [nums[i], nums[target]] = [nums[target], nums[i]];
    }
  }
  for (let i = 0; i < n; i++) {
    if (nums[i] !== i + 1) return i + 1;
  }
  return n + 1;
}`,
    cases: [
      { call: "firstMissingPositive([1, 2, 0])", expected: 3 },
      { call: "firstMissingPositive([3, 4, -1, 1])", expected: 2 },
      { call: "firstMissingPositive([7, 8, 9, 11, 12])", expected: 1 },
    ],
  },
};
