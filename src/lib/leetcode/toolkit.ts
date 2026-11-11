import type { CodeExample } from "./types";

export type ToolkitSection = {
  id: string;
  title: string;
  intro: string;
  examples: CodeExample[];
  notes: string[];
};

const listNode: CodeExample = {
  title: "ListNode, and getting arrays in and out",
  explanation:
    "LeetCode defines this class for you on linked-list problems. Writing it out once, with the two converters, is how you test a linked-list solution locally or in a blank interview pad.",
  code: `class ListNode {
  val: number;
  next: ListNode | null;
  constructor(val = 0, next: ListNode | null = null) {
    this.val = val;
    this.next = next;
  }
}

function listFromArray(values: number[]): ListNode | null {
  const dummy = new ListNode();
  let tail = dummy;
  for (const value of values) {
    tail.next = new ListNode(value);
    tail = tail.next;
  }
  return dummy.next;
}

function arrayFromList(head: ListNode | null): number[] {
  const values: number[] = [];
  for (let node = head; node; node = node.next) values.push(node.val);
  return values;
}`,
  cases: [
    { call: "arrayFromList(listFromArray([1, 2, 3]))", expected: [1, 2, 3] },
    { call: "listFromArray([])", expected: null },
  ],
};

const treeNode: CodeExample = {
  title: "TreeNode, and LeetCode's level-order format",
  explanation:
    "Tree inputs on LeetCode are written level by level with null for a missing child: [3,9,20,null,null,15,7]. These two functions turn that into nodes and back, using a queue with a moving head index rather than shift().",
  code: `class TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;
  constructor(val = 0, left: TreeNode | null = null, right: TreeNode | null = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

function treeFromLevelOrder(values: (number | null)[]): TreeNode | null {
  if (values.length === 0 || values[0] === null) return null;
  const root = new TreeNode(values[0]);
  const queue: TreeNode[] = [root];
  let head = 0;
  let i = 1;
  while (i < values.length) {
    const parent = queue[head++];
    const left = values[i++];
    if (left !== null && left !== undefined) {
      parent.left = new TreeNode(left);
      queue.push(parent.left);
    }
    const right = values[i++];
    if (right !== null && right !== undefined) {
      parent.right = new TreeNode(right);
      queue.push(parent.right);
    }
  }
  return root;
}

function levelOrderFromTree(root: TreeNode | null): (number | null)[] {
  const out: (number | null)[] = [];
  const queue: (TreeNode | null)[] = [root];
  for (let head = 0; head < queue.length; head++) {
    const node = queue[head];
    out.push(node ? node.val : null);
    if (node) queue.push(node.left, node.right);
  }
  while (out.length > 0 && out[out.length - 1] === null) out.pop();
  return out;
}`,
  cases: [
    { call: "levelOrderFromTree(treeFromLevelOrder([3, 9, 20, null, null, 15, 7]))", expected: [3, 9, 20, null, null, 15, 7] },
    { call: "treeFromLevelOrder([])", expected: null },
  ],
};

const minHeap: CodeExample = {
  title: "A binary heap with a comparator",
  explanation:
    "An array where the parent of i sits at (i - 1) >> 1. push sifts the new item up, pop moves the last item to the root and sifts it down. Pass (a, b) => b - a for a max-heap, or compare a field for objects. Both operations are O(log n), peek is O(1).",
  code: `class MinHeap<T> {
  private items: T[] = [];
  constructor(private compare: (a: T, b: T) => number) {}

  get size(): number {
    return this.items.length;
  }

  peek(): T | undefined {
    return this.items[0];
  }

  push(item: T): void {
    const items = this.items;
    items.push(item);
    let i = items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.compare(items[i], items[parent]) >= 0) break;
      [items[i], items[parent]] = [items[parent], items[i]];
      i = parent;
    }
  }

  pop(): T | undefined {
    const items = this.items;
    if (items.length === 0) return undefined;
    const top = items[0];
    const last = items.pop() as T;
    if (items.length > 0) {
      items[0] = last;
      let i = 0;
      while (true) {
        const left = 2 * i + 1;
        const right = left + 1;
        let smallest = i;
        if (left < items.length && this.compare(items[left], items[smallest]) < 0) smallest = left;
        if (right < items.length && this.compare(items[right], items[smallest]) < 0) smallest = right;
        if (smallest === i) break;
        [items[i], items[smallest]] = [items[smallest], items[i]];
        i = smallest;
      }
    }
    return top;
  }
}`,
  cases: [
    {
      call: "(() => { const h = new MinHeap<number>((a, b) => a - b); [5, 1, 4, 2, 3].forEach((n) => h.push(n)); return [h.pop(), h.pop(), h.pop(), h.size]; })()",
      expected: [1, 2, 3, 2],
    },
    {
      call: "(() => { const h = new MinHeap<number>((a, b) => b - a); [5, 1, 9].forEach((n) => h.push(n)); return h.peek(); })()",
      expected: 9,
    },
    { call: "new MinHeap<number>((a, b) => a - b).pop()", expected: undefined },
  ],
};

/**
 * The helpers LeetCode would otherwise predefine, prepended to every snippet
 * in the tests. Built from the toolkit's own examples so the code a reader
 * sees on the toolkit page is the code every other snippet runs against.
 */
export const HARNESS_PRELUDE = [listNode.code, treeNode.code, minHeap.code].join("\n\n");

export const TOOLKIT_SECTIONS: ToolkitSection[] = [
  {
    id: "nodes",
    title: "The nodes LeetCode gives you",
    intro:
      "On LeetCode, ListNode and TreeNode already exist. In an interview pad they usually don't, and being able to write them in a minute, plus a way to build test input, saves you from testing in your head.",
    examples: [listNode, treeNode],
    notes: [
      "Check node === null, not !node, when a value of 0 is possible and you're testing the value rather than the node.",
      "LeetCode's TypeScript signatures use ListNode | null everywhere. Narrow once at the top (if (!head) return null) and the rest of the function type-checks cleanly.",
    ],
  },
  {
    id: "heap",
    title: "A heap, because JavaScript doesn't have one",
    intro:
      "Top-k, k-way merge, Dijkstra, scheduling and running medians all need a priority queue, and the language has none. LeetCode's JavaScript and TypeScript runtime does ship @datastructures-js/priority-queue (an older major version, so check its API on LeetCode's help page), but most interview pads don't. Be able to write this in about five minutes.",
    examples: [minHeap],
    notes: [
      "Ask the interviewer first: plenty will say \"assume a heap exists with push and pop\". Write the interface you assume out loud.",
      "If k is tiny or n is small, sorting is O(n log n) and often fine. Say so, then offer the heap as the improvement.",
      "For a max-heap, flip the comparator. Don't negate the numbers: that breaks on objects and reads badly.",
    ],
  },
  {
    id: "queue",
    title: "A queue that doesn't use shift()",
    intro:
      "Array.prototype.shift is O(n), because every remaining element moves down one. In a BFS over a large graph that turns O(V + E) into O(V²). Keep a head index instead and let the array grow.",
    examples: [
      {
        title: "BFS with a head index",
        explanation:
          "The queue is an array you only push to. head marks the front. The memory is only reclaimed when the function returns, which is fine at interview scale.",
        code: `function bfsOrder(graph: number[][], start: number): number[] {
  const seen = new Set<number>([start]);
  const queue = [start];
  for (let head = 0; head < queue.length; head++) {
    for (const next of graph[queue[head]]) {
      if (!seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  return queue;
}`,
        cases: [{ call: "bfsOrder([[1, 2], [3], [3], []], 0)", expected: [0, 1, 2, 3] }],
      },
      {
        title: "Level by level",
        explanation:
          "When the answer is per level (level order, minimum depth, rotting oranges), swap in a fresh array each round. The arrays are small and it reads clearly.",
        code: `function levels(graph: number[][], start: number): number[][] {
  const seen = new Set<number>([start]);
  const out: number[][] = [];
  let frontier = [start];
  while (frontier.length > 0) {
    out.push(frontier);
    const next: number[] = [];
    for (const node of frontier) {
      for (const neighbour of graph[node]) {
        if (!seen.has(neighbour)) {
          seen.add(neighbour);
          next.push(neighbour);
        }
      }
    }
    frontier = next;
  }
  return out;
}`,
        cases: [{ call: "levels([[1, 2], [3], [3], []], 0)", expected: [[0], [1, 2], [3]] }],
      },
    ],
    notes: [
      "A stack is just push and pop on an array, both O(1). Only the queue needs care.",
      "A deque (pop from both ends), as in sliding window maximum, works the same way: a head index for the front, pop() for the back.",
    ],
  },
  {
    id: "maps",
    title: "Counting and grouping with Map and Set",
    intro:
      "Most O(n) array solutions are a Map in disguise. Use Map rather than a plain object: keys can be numbers without being turned into strings, there's no inherited prototype to trip on, and .size is O(1).",
    examples: [
      {
        title: "Frequency count",
        explanation: "The ?? 0 handles the first sighting. This one line is half of Top K Frequent, Valid Anagram and Majority Element.",
        code: `function countAll(values: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return counts;
}`,
        cases: [{ call: "[...countAll(['a', 'b', 'a']).entries()]", expected: [["a", 2], ["b", 1]] }],
      },
      {
        title: "Group by a computed key",
        explanation:
          "Group Anagrams in four lines: the sorted letters are the key. Arrays can't be Map keys by value, so join them into a string first.",
        code: `function groupAnagrams(words: string[]): string[][] {
  const groups = new Map<string, string[]>();
  for (const word of words) {
    const key = [...word].sort().join("");
    const group = groups.get(key);
    if (group) group.push(word);
    else groups.set(key, [word]);
  }
  return [...groups.values()];
}`,
        cases: [{ call: "groupAnagrams(['eat', 'tea', 'tan', 'ate', 'nat', 'bat'])", expected: [["eat", "tea", "ate"], ["tan", "nat"], ["bat"]] }],
      },
      {
        title: "A 26-slot array when the alphabet is fixed",
        explanation:
          "When the input is lowercase English letters, an array of 26 counts beats a Map: no hashing, and two count arrays compare cheaply. charCodeAt(i) - 97 maps 'a' to 0.",
        code: `function letterCounts(word: string): number[] {
  const counts = new Array<number>(26).fill(0);
  for (let i = 0; i < word.length; i++) counts[word.charCodeAt(i) - 97]++;
  return counts;
}`,
        cases: [{ call: "letterCounts('abca').slice(0, 3)", expected: [2, 1, 1] }],
      },
    ],
    notes: [
      "A Set of visited coordinates needs string keys: seen.add(r + ',' + c). Two [r, c] arrays with the same values are different Set entries.",
      "Map keeps insertion order, which makes \"first unique character\" a single pass over the map.",
    ],
  },
  {
    id: "sorting",
    title: "Sorting traps",
    intro:
      "The single most common JavaScript bug in interviews: [10, 9, 1].sort() gives [1, 10, 9], because the default sort compares strings.",
    examples: [
      {
        title: "Always pass a comparator for numbers",
        explanation:
          "a - b ascending, b - a descending. For tuples, compare field by field with ||, which falls through to the next comparison when the first is 0.",
        code: `function sortIntervals(intervals: [number, number][]): [number, number][] {
  return [...intervals].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
}

function sortNumbers(values: number[]): number[] {
  return [...values].sort((a, b) => a - b);
}`,
        cases: [
          { call: "sortNumbers([10, 9, 1])", expected: [1, 9, 10] },
          { call: "[10, 9, 1].sort()", expected: [1, 10, 9] },
          { call: "sortIntervals([[2, 3], [1, 5], [1, 2]])", expected: [[1, 2], [1, 5], [2, 3]] },
        ],
      },
    ],
    notes: [
      "sort() sorts in place and returns the same array. Copy first ([...a].sort) when the caller's input matters, or use toSorted() where the runtime has it.",
      "Sorting is stable in every modern engine, so sorting by a secondary key and then the primary key works.",
      "Sorting costs O(n log n). If the problem says O(n), sorting is off the table, and that is itself a hint towards a hash map or bucket counting.",
    ],
  },
  {
    id: "arrays",
    title: "Building arrays and grids",
    intro: "Array(n).fill([]) puts the same array in every slot. Push into one row and every row changes.",
    examples: [
      {
        title: "Array.from for anything that isn't a primitive",
        explanation: "Array.from calls the factory once per slot, so each row is its own array. fill is fine for numbers and booleans.",
        code: `function grid(rows: number, cols: number): number[][] {
  return Array.from({ length: rows }, () => new Array<number>(cols).fill(0));
}

function sharedRowsBug(): number[][] {
  const rows: number[][] = new Array(2).fill([]);
  rows[0].push(1);
  return rows;
}`,
        cases: [
          { call: "(() => { const g = grid(2, 2); g[0][0] = 1; return g; })()", expected: [[1, 0], [0, 0]] },
          { call: "sharedRowsBug()", expected: [[1], [1]] },
        ],
      },
      {
        title: "Adjacency lists from an edge list",
        explanation: "Almost every graph problem starts with this. Remember both directions when the edges are undirected.",
        code: `function adjacency(n: number, edges: [number, number][]): number[][] {
  const graph: number[][] = Array.from({ length: n }, () => []);
  for (const [a, b] of edges) {
    graph[a].push(b);
    graph[b].push(a);
  }
  return graph;
}`,
        cases: [{ call: "adjacency(3, [[0, 1], [1, 2]])", expected: [[1], [0, 2], [1]] }],
      },
    ],
    notes: [
      "arr.at(-1) reads the last element, handy for the top of a stack.",
      "Destructuring swaps in place: [a[i], a[j]] = [a[j], a[i]].",
    ],
  },
  {
    id: "numbers",
    title: "Numbers: division, overflow and sentinels",
    intro:
      "JavaScript has one number type, a 64-bit float. That removes overflow worries up to 2^53 and adds a few traps of its own.",
    examples: [
      {
        title: "Integer division and negative modulo",
        explanation:
          "Math.floor(-7 / 2) is -4; truncating towards zero (what C, Java and LeetCode's Evaluate RPN want) is Math.trunc, giving -3. And % keeps the sign of the left side, so wrap it when you need a non-negative remainder.",
        code: `function divideTowardZero(a: number, b: number): number {
  return Math.trunc(a / b);
}

function mod(a: number, m: number): number {
  return ((a % m) + m) % m;
}`,
        cases: [
          { call: "divideTowardZero(-7, 2)", expected: -3 },
          { call: "Math.floor(-7 / 2)", expected: -4 },
          { call: "-1 % 5", expected: -1 },
          { call: "mod(-1, 5)", expected: 4 },
        ],
      },
      {
        title: "Big answers modulo 1e9 + 7",
        explanation:
          "Counting problems ask for the answer mod 1_000_000_007. Reduce after every addition. Multiplying two values near 1e9 exceeds 2^53 and loses precision, so use BigInt for that one step.",
        code: `const MOD = 1_000_000_007;

function mulMod(a: number, b: number): number {
  return Number((BigInt(a) * BigInt(b)) % BigInt(MOD));
}`,
        cases: [
          { call: "mulMod(999_999_999, 999_999_999)", expected: 64 },
          { call: "Number.isSafeInteger(999_999_999 * 999_999_999)", expected: false },
        ],
      },
    ],
    notes: [
      "Start running minimums at Infinity and maximums at -Infinity, not at arr[0], which breaks on an empty input.",
      "The midpoint lo + ((hi - lo) >> 1) is the habit from languages that overflow. In JavaScript (lo + hi) >> 1 is safe up to 2^30, and Math.floor((lo + hi) / 2) is safe everywhere.",
      "Bitwise operators work on 32-bit signed integers. Use >>> 0 to read a result as unsigned.",
    ],
  },
  {
    id: "strings",
    title: "Strings and characters",
    intro: "Strings are immutable. s += c in a loop is usually optimised by engines, but building an array and joining once is the version nobody questions.",
    examples: [
      {
        title: "Reverse words without string surgery",
        explanation: "Split on runs of whitespace, filter out empty strings, reverse, join. Clear, and O(n).",
        code: `function reverseWords(s: string): string {
  return s.split(/\\s+/).filter(Boolean).reverse().join(" ");
}`,
        cases: [{ call: "reverseWords('  the sky  is blue ')", expected: "blue is sky the" }],
      },
      {
        title: "Checking characters",
        explanation:
          "Valid Palindrome and friends need \"is this a letter or digit\". A regex test per character is clear enough for an interview, and lowercase once at the start.",
        code: `function isAlphanumeric(ch: string): boolean {
  return /[a-z0-9]/i.test(ch);
}`,
        cases: [
          { call: "isAlphanumeric('a')", expected: true },
          { call: "isAlphanumeric(',')", expected: false },
        ],
      },
    ],
    notes: [
      "s[i] and s.charAt(i) both work. s.charCodeAt(i) is the fast path for arithmetic on letters.",
      "Comparing strings with < compares them lexicographically, which is exactly what you want for \"smallest string\" problems.",
    ],
  },
  {
    id: "recursion",
    title: "Recursion, memoisation and the call stack",
    intro:
      "JavaScript engines give you roughly ten thousand stack frames. A recursive DFS on a 10^5-node linked-list-shaped tree, or memoised recursion over n = 10^5, can overflow. Know when to switch to an explicit stack or a bottom-up table.",
    examples: [
      {
        title: "Memoised recursion with a composite key",
        explanation:
          "Two indices make a string key. The function is a closure over grid and memo, which keeps the signature small. This is Unique Paths top-down.",
        code: `function uniquePaths(m: number, n: number): number {
  const memo = new Map<string, number>();
  function paths(r: number, c: number): number {
    if (r === m - 1 || c === n - 1) return 1;
    const key = r + "," + c;
    const cached = memo.get(key);
    if (cached !== undefined) return cached;
    const result = paths(r + 1, c) + paths(r, c + 1);
    memo.set(key, result);
    return result;
  }
  return paths(0, 0);
}`,
        cases: [
          { call: "uniquePaths(3, 7)", expected: 28 },
          { call: "uniquePaths(3, 2)", expected: 3 },
        ],
      },
      {
        title: "DFS with an explicit stack",
        explanation: "The same traversal without the call stack. Push children right then left to visit left first, matching recursive pre-order.",
        code: `function preorder(root: TreeNode | null): number[] {
  const out: number[] = [];
  const stack: TreeNode[] = root ? [root] : [];
  while (stack.length > 0) {
    const node = stack.pop() as TreeNode;
    out.push(node.val);
    if (node.right) stack.push(node.right);
    if (node.left) stack.push(node.left);
  }
  return out;
}`,
        cases: [{ call: "preorder(treeFromLevelOrder([1, 2, 3, 4, 5]))", expected: [1, 2, 4, 5, 3] }],
      },
    ],
    notes: [
      "if (cached !== undefined) rather than if (cached): a memoised 0 is falsy and would be recomputed every time.",
      "Inner functions that close over the inputs are idiomatic and save threading five parameters through every call.",
    ],
  },
];
