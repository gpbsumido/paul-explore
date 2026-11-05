import type { Solution } from "../types";

export const trieSolutions: Record<string, Solution> = {
  "longest-common-prefix": {
    approach: [
      "Take the first word as the candidate prefix.",
      "For each other word, trim the candidate from the end until the word starts with it.",
      "Whatever survives every word is the answer. A trie does the same job when the words keep changing.",
    ],
    complexity: { time: "O(total characters)", space: "O(1)" },
    code: `function longestCommonPrefix(strs: string[]): string {
  let prefix = strs[0] ?? "";
  for (const word of strs) {
    while (!word.startsWith(prefix)) prefix = prefix.slice(0, -1);
  }
  return prefix;
}`,
    cases: [
      { call: 'longestCommonPrefix(["flower", "flow", "flight"])', expected: "fl" },
      { call: 'longestCommonPrefix(["dog", "racecar", "car"])', expected: "" },
    ],
  },

  "implement-trie-prefix-tree": {
    approach: [
      "Each node holds a Map from character to child node, plus a flag for 'a word ends here'.",
      "insert walks down, creating children as needed, and sets the flag on the last node.",
      "search walks down and needs the flag; startsWith only needs the walk to succeed.",
    ],
    complexity: { time: "O(word length)", space: "O(total characters)" },
    code: `class TrieNode {
  children = new Map<string, TrieNode>();
  isWord = false;
}

class Trie {
  private root = new TrieNode();
  insert(word: string): void {
    let node = this.root;
    for (const ch of word) {
      let child = node.children.get(ch);
      if (!child) {
        child = new TrieNode();
        node.children.set(ch, child);
      }
      node = child;
    }
    node.isWord = true;
  }
  search(word: string): boolean {
    return this.walk(word)?.isWord ?? false;
  }
  startsWith(prefix: string): boolean {
    return this.walk(prefix) !== null;
  }
  private walk(text: string): TrieNode | null {
    let node: TrieNode | undefined = this.root;
    for (const ch of text) {
      node = node.children.get(ch);
      if (!node) return null;
    }
    return node;
  }
}`,
    cases: [
      {
        call: '(() => { const t = new Trie(); t.insert("apple"); const a = [t.search("apple"), t.search("app"), t.startsWith("app")]; t.insert("app"); return [...a, t.search("app")]; })()',
        expected: [true, false, true, true],
      },
      { call: '(() => { const t = new Trie(); t.insert("a"); return [t.search("b"), t.startsWith("")]; })()', expected: [false, true] },
    ],
  },

  "design-add-and-search-words-data-structure": {
    approach: [
      "Store the words in a trie.",
      "Search recursively. A normal letter follows its one child.",
      "A '.' tries every child, and the search succeeds if any branch reaches a node where a word ends.",
    ],
    complexity: { time: "O(26^dots · length)", space: "O(total characters)" },
    code: `class WordNode {
  children = new Map<string, WordNode>();
  isWord = false;
}

class WordDictionary {
  private root = new WordNode();
  addWord(word: string): void {
    let node = this.root;
    for (const ch of word) {
      let child = node.children.get(ch);
      if (!child) {
        child = new WordNode();
        node.children.set(ch, child);
      }
      node = child;
    }
    node.isWord = true;
  }
  search(word: string): boolean {
    const match = (node: WordNode, i: number): boolean => {
      if (i === word.length) return node.isWord;
      if (word[i] === ".") return [...node.children.values()].some((child) => match(child, i + 1));
      const child = node.children.get(word[i]);
      return child !== undefined && match(child, i + 1);
    };
    return match(this.root, 0);
  }
}`,
    cases: [
      {
        call: '(() => { const d = new WordDictionary(); ["bad", "dad", "mad"].forEach((w) => d.addWord(w)); return ["pad", "bad", ".ad", "b.."].map((w) => d.search(w)); })()',
        expected: [false, true, true, true],
      },
      { call: '(() => { const d = new WordDictionary(); d.addWord("a"); return [d.search("."), d.search(".."), d.search("")]; })()', expected: [true, false, false] },
    ],
  },

  "replace-words": {
    approach: [
      "Put every root in a trie.",
      "For each word in the sentence, walk the trie letter by letter.",
      "The first node where a root ends gives the shortest root, so replace the word with it. If the walk falls off the trie first, keep the word.",
    ],
    complexity: { time: "O(total characters)", space: "O(dictionary characters)" },
    code: `function replaceWords(dictionary: string[], sentence: string): string {
  type Node = { children: Map<string, Node>; isRoot: boolean };
  const root: Node = { children: new Map(), isRoot: false };
  for (const word of dictionary) {
    let node = root;
    for (const ch of word) {
      let child = node.children.get(ch);
      if (!child) {
        child = { children: new Map(), isRoot: false };
        node.children.set(ch, child);
      }
      node = child;
    }
    node.isRoot = true;
  }
  const shorten = (word: string) => {
    let node: Node | undefined = root;
    for (let i = 0; i < word.length; i++) {
      node = node.children.get(word[i]);
      if (!node) return word;
      if (node.isRoot) return word.slice(0, i + 1);
    }
    return word;
  };
  return sentence.split(" ").map(shorten).join(" ");
}`,
    cases: [
      { call: 'replaceWords(["cat", "bat", "rat"], "the cattle was rattled by the battery")', expected: "the cat was rat by the bat" },
      { call: 'replaceWords(["a", "b", "c"], "aadsfasf absbs bbab cadsfafs")', expected: "a a b c" },
    ],
  },

  "search-suggestions-system": {
    approach: [
      "Sort the products, so the first matches for any prefix are already the alphabetically smallest.",
      "Every product matching a prefix sits in one block of the sorted list. Binary search for where the prefix would go.",
      "Take up to three products from there that still start with the prefix.",
    ],
    complexity: { time: "O(n log n + m log n)", space: "O(n)" },
    code: `function suggestedProducts(products: string[], searchWord: string): string[][] {
  const sorted = [...products].sort();
  const result: string[][] = [];
  let prefix = "";
  for (const ch of searchWord) {
    prefix += ch;
    let low = 0;
    let high = sorted.length;
    while (low < high) {
      const mid = (low + high) >> 1;
      if (sorted[mid] < prefix) low = mid + 1;
      else high = mid;
    }
    result.push(sorted.slice(low, low + 3).filter((p) => p.startsWith(prefix)));
  }
  return result;
}`,
    cases: [
      {
        call: 'suggestedProducts(["mobile", "mouse", "moneypot", "monitor", "mousepad"], "mouse")',
        expected: [
          ["mobile", "moneypot", "monitor"],
          ["mobile", "moneypot", "monitor"],
          ["mouse", "mousepad"],
          ["mouse", "mousepad"],
          ["mouse", "mousepad"],
        ],
      },
      { call: 'suggestedProducts(["havana"], "tatiana")', expected: [[], [], [], [], [], [], []] },
    ],
  },

  "map-sum-pairs": {
    approach: [
      "Store, in each trie node, the total value of every key passing through it.",
      "On insert, work out the change from any old value for that key, and add it to every node along the path.",
      "sum is the total stored at the node where the prefix ends, or 0 if it doesn't exist.",
    ],
    complexity: { time: "O(key length)", space: "O(total characters)" },
    code: `class MapSum {
  private values = new Map<string, number>();
  private root: { children: Map<string, MapSumNode>; total: number } = { children: new Map(), total: 0 };
  insert(key: string, val: number): void {
    const delta = val - (this.values.get(key) ?? 0);
    this.values.set(key, val);
    let node = this.root;
    node.total += delta;
    for (const ch of key) {
      let child = node.children.get(ch);
      if (!child) {
        child = { children: new Map(), total: 0 };
        node.children.set(ch, child);
      }
      child.total += delta;
      node = child;
    }
  }
  sum(prefix: string): number {
    let node: MapSumNode | undefined = this.root;
    for (const ch of prefix) {
      node = node.children.get(ch);
      if (!node) return 0;
    }
    return node.total;
  }
}

type MapSumNode = { children: Map<string, MapSumNode>; total: number };`,
    cases: [
      {
        call: '(() => { const m = new MapSum(); m.insert("apple", 3); const a = m.sum("ap"); m.insert("app", 2); return [a, m.sum("ap")]; })()',
        expected: [3, 5],
      },
      { call: '(() => { const m = new MapSum(); m.insert("apple", 3); m.insert("apple", 2); return [m.sum("ap"), m.sum("b")]; })()', expected: [2, 0] },
    ],
  },

  "word-search-ii": {
    approach: [
      "Put every word in a trie, so one board search can look for all of them at once.",
      "DFS from every cell, following the trie as you go. Stop as soon as the path isn't a prefix of any word.",
      "When a node marks a word, record it and clear the mark so it isn't found twice. Mark cells as visited on the way in and restore them on the way out.",
    ],
    complexity: { time: "O(m · n · 4^L)", space: "O(total word characters)" },
    code: `function findWords(board: string[][], words: string[]): string[] {
  type Node = { children: Map<string, Node>; word: string | null };
  const root: Node = { children: new Map(), word: null };
  for (const word of words) {
    let node = root;
    for (const ch of word) {
      let child = node.children.get(ch);
      if (!child) {
        child = { children: new Map(), word: null };
        node.children.set(ch, child);
      }
      node = child;
    }
    node.word = word;
  }
  const found: string[] = [];
  const dfs = (r: number, c: number, parent: Node) => {
    const ch = board[r][c];
    const node = parent.children.get(ch);
    if (!node) return;
    if (node.word !== null) {
      found.push(node.word);
      node.word = null;
    }
    board[r][c] = "#";
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < board.length && nc >= 0 && nc < board[0].length) dfs(nr, nc, node);
    }
    board[r][c] = ch;
  };
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[0].length; c++) dfs(r, c, root);
  }
  return found;
}`,
    cases: [
      {
        call: 'findWords([["o", "a", "a", "n"], ["e", "t", "a", "e"], ["i", "h", "k", "r"], ["i", "f", "l", "v"]], ["oath", "pea", "eat", "rain"]).sort()',
        expected: ["eat", "oath"],
      },
      { call: 'findWords([["a", "b"], ["c", "d"]], ["abcb"])', expected: [] },
    ],
  },

  "concatenated-words": {
    approach: [
      "Sort the words by length, since a word can only be built from shorter ones.",
      "For each word, run word break over the set of shorter words already seen: can[i] is true when some earlier can[j] is true and word[j..i) is in the set.",
      "If the whole word can be built, it's concatenated. Then add it to the set either way.",
    ],
    complexity: { time: "O(n · L³)", space: "O(n · L)" },
    code: `function findAllConcatenatedWordsInADict(words: string[]): string[] {
  const sorted = [...words].sort((a, b) => a.length - b.length);
  const known = new Set<string>();
  const result: string[] = [];
  for (const word of sorted) {
    if (word.length > 0 && known.size > 0) {
      const can = new Array<boolean>(word.length + 1).fill(false);
      can[0] = true;
      for (let i = 1; i <= word.length; i++) {
        for (let j = 0; j < i && !can[i]; j++) {
          if (can[j] && known.has(word.slice(j, i))) can[i] = true;
        }
      }
      if (can[word.length]) result.push(word);
    }
    known.add(word);
  }
  return result;
}`,
    cases: [
      {
        call: 'findAllConcatenatedWordsInADict(["cat", "cats", "catsdogcats", "dog", "dogcatsdog", "hippopotamuses", "rat", "ratcatdogcat"]).sort()',
        expected: ["catsdogcats", "dogcatsdog", "ratcatdogcat"],
      },
      { call: 'findAllConcatenatedWordsInADict(["cat", "dog", "catdog"])', expected: ["catdog"] },
    ],
  },
};
