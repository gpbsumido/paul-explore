import type { Pattern } from "../types";

export const arraysHashing: Pattern = {
  id: "arrays-hashing",
  name: "Hash Maps & Sets",
  phase: 1,
  tagline: "Remember what you've seen so you never look for it twice.",
  summary:
    "The brute force for most array questions is a nested loop: for each element, scan the rest for its partner, its duplicate, its group. A Map or Set turns that inner scan into an O(1) lookup, trading O(n) memory for dropping a whole factor of n. It is the first thing to try on almost any unsorted-array question, and the fallback when nothing else fits.",
  question: "Am I scanning the array again to find something I could have remembered on the first pass?",
  signals: [
    { phrase: "contains duplicate", why: "Seen-it-before is a Set membership check.", weight: 2 },
    { phrase: "anagram", why: "Anagrams share a letter count or a sorted key, both hash-map keys.", weight: 2 },
    { phrase: "most frequent", why: "Count with a Map, then pick the top (sort, bucket or heap)." },
    { phrase: "indices of the two numbers", why: "Two Sum on an unsorted array: store each value's index, look up the complement.", weight: 2 },
    { phrase: "add up to target", why: "Complement lookup: target - x is what you need to have seen." },
    { phrase: "group", why: "Grouping is a Map from a computed key to a list." },
    { phrase: "unsorted", why: "No order to exploit, so a hash structure is how you get below O(n log n)." },
    { phrase: "in o(n) time", why: "O(n) rules out sorting and usually means one pass with a hash map." },
    { phrase: "consecutive sequence", why: "Put everything in a Set, then only start counting from sequence starts.", weight: 2 },
    { phrase: "appears more than", why: "Majority questions are counting questions." },
    { phrase: "isomorphic", why: "Two maps keep a one-to-one character mapping honest." },
    { phrase: "valid sudoku", why: "Per-row, per-column and per-box Sets of digits seen so far.", weight: 2 },
    { phrase: "missing positive", why: "Use the array itself as the hash table, value v at index v - 1.", weight: 2 },
  ],
  antiSignals: [
    "The input is sorted: two pointers usually solve it in O(1) extra space.",
    "The question is about a contiguous range: that's a sliding window or prefix sum, perhaps with a map inside.",
    "Extra space is explicitly forbidden: think sorting, two pointers, or index-as-hash.",
  ],
  complexity: { time: "O(n) average", space: "O(n)" },
  template: {
    title: "One pass, remember as you go",
    explanation:
      "Check before you insert. Looking up the complement first means an element never pairs with itself, and you finish in one pass rather than building the whole map and then scanning again.",
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
      { call: "twoSum([3, 3], 6)", expected: [0, 1] },
    ],
  },
  variants: [
    {
      title: "Count, then read the counts",
      explanation:
        "Top K Frequent without a heap: count with a Map, then drop values into buckets indexed by count. Counts can't exceed n, so the buckets are a fixed-size array and the whole thing is O(n).",
      code: `function topKFrequent(nums: number[], k: number): number[] {
  const counts = new Map<number, number>();
  for (const n of nums) counts.set(n, (counts.get(n) ?? 0) + 1);
  const buckets: number[][] = Array.from({ length: nums.length + 1 }, () => []);
  for (const [value, count] of counts) buckets[count].push(value);
  const result: number[] = [];
  for (let count = buckets.length - 1; count > 0 && result.length < k; count--) {
    result.push(...buckets[count]);
  }
  return result.slice(0, k);
}`,
      cases: [
        { call: "topKFrequent([1, 1, 1, 2, 2, 3], 2)", expected: [1, 2] },
        { call: "topKFrequent([1], 1)", expected: [1] },
      ],
    },
    {
      title: "A Set, and only start from the start",
      explanation:
        "Longest Consecutive Sequence in O(n): a number begins a run only if number - 1 is absent. Every other number is skipped as a starting point, so each element is walked over at most twice in total.",
      code: `function longestConsecutive(nums: number[]): number {
  const values = new Set(nums);
  let best = 0;
  for (const n of values) {
    if (values.has(n - 1)) continue;
    let length = 1;
    while (values.has(n + length)) length++;
    best = Math.max(best, length);
  }
  return best;
}`,
      cases: [
        { call: "longestConsecutive([100, 4, 200, 1, 3, 2])", expected: 4 },
        { call: "longestConsecutive([])", expected: 0 },
      ],
    },
  ],
  pitfalls: [
    "Inserting before checking in Two Sum pairs an element with itself when target is twice its value.",
    "A missing key is undefined, and so is a stored undefined. Use has() or ?? 0, never truthiness, when 0 is a valid stored value.",
    "Iterating the original array instead of the Set in Longest Consecutive Sequence makes duplicates walk the same run repeatedly.",
  ],
  jsNotes: [
    "Use Map, not {}. Object keys are always strings, so obj[1] and obj['1'] collide, and a key like 'constructor' already exists on the prototype.",
    "Arrays and objects are compared by reference, so they're useless as Map keys by value. Join them into a string key.",
  ],
  deepDive: "/learn/hash-maps",
  prerequisites: [],
  problems: [
    {
      slug: "contains-duplicate",
      title: "Contains Duplicate",
      difficulty: "Easy",
      prompt: "Given an integer array, return true if any value appears at least twice, and false if every element is distinct. Contains duplicate, in short.",
      tell: "\"Appears at least twice\" is a seen-before check. Add to a Set as you go and stop on the first repeat.",
    },
    {
      slug: "valid-anagram",
      title: "Valid Anagram",
      difficulty: "Easy",
      prompt: "Given two strings, decide whether one is an anagram of the other: the same letters with the same frequency, in any order.",
      tell: "\"Anagram\" means equal letter counts. One count array of 26, incremented for s and decremented for t.",
    },
    {
      slug: "two-sum",
      title: "Two Sum",
      difficulty: "Easy",
      prompt: "Given an unsorted array of integers and a target, return the indices of the two numbers that add up to target. Exactly one answer exists.",
      tell: "Unsorted plus \"indices of the two numbers\" means a Map from value to index, looking up target minus the current value.",
    },
    {
      slug: "majority-element",
      title: "Majority Element",
      difficulty: "Easy",
      prompt: "Return the element that appears more than n / 2 times in the array. It always exists.",
      tell: "\"Appears more than\" is a frequency count. The O(1)-space follow-up is Boyer–Moore voting, worth knowing by name.",
    },
    {
      slug: "group-anagrams",
      title: "Group Anagrams",
      difficulty: "Medium",
      prompt: "Given an array of strings, group the anagrams together. Words in the same group use the same letters at the same frequency.",
      tell: "\"Group\" plus \"anagram\": a Map whose key is the sorted word (or a letter-count string) and whose value is the group.",
    },
    {
      slug: "top-k-frequent-elements",
      title: "Top K Frequent Elements",
      difficulty: "Medium",
      prompt: "Return the k most frequent elements of an integer array. Aim to beat O(n log n) time.",
      tell: "Count frequency with a Map. \"Better than n log n\" points at bucket sort by count; a size-k heap is the other accepted answer.",
      alsoAccept: ["heap"],
    },
    {
      slug: "valid-sudoku",
      title: "Valid Sudoku",
      difficulty: "Medium",
      prompt: "Check whether a partially filled 9 by 9 board is a valid sudoku: no digit repeats in any row, column or 3 by 3 box. Only filled cells matter.",
      tell: "\"No digit repeats\" in three kinds of unit is three families of Sets. The box index is Math.floor(r / 3) * 3 + Math.floor(c / 3).",
    },
    {
      slug: "longest-consecutive-sequence",
      title: "Longest Consecutive Sequence",
      difficulty: "Medium",
      prompt: "Given an unsorted array, return the length of the longest consecutive sequence of integers. Your algorithm must run in O(n) time.",
      tell: "\"Unsorted\" and \"in O(n) time\" rule out sorting. A Set lets you start counting only at numbers with no predecessor.",
    },
    {
      slug: "first-missing-positive",
      title: "First Missing Positive",
      difficulty: "Hard",
      prompt: "Return the smallest missing positive integer from an unsorted array, in O(n) time and constant extra space.",
      tell: "\"Missing positive\" with O(1) space: the answer is in 1..n+1, so use the array itself as the hash set by swapping each value v to index v - 1.",
    },
  ],
};
