import type { Pattern } from "../types";

export const trie: Pattern = {
  id: "trie",
  name: "Tries",
  phase: 2,
  tagline: "Share the prefixes so every word that starts the same way walks the same path.",
  summary:
    "A trie stores strings character by character down a tree, so every word sharing a prefix shares a path. Lookup and prefix checks cost O(length of the word), not O(number of words). Reach for one when the question cares about prefixes: autocomplete, \"starts with\", replacing words by their roots, or searching a board for many words at once, where one trie lets a single DFS check every word together.",
  question: "Do I keep asking whether some string is a prefix of words I've stored?",
  signals: [
    { phrase: "prefix", why: "Prefix lookups are what tries are built for.", weight: 2 },
    { phrase: "starts with", why: "startsWith is a walk down the trie without checking the end marker.", weight: 2 },
    { phrase: "trie", why: "Named outright.", weight: 3 },
    { phrase: "dictionary", why: "A dictionary of words queried by prefix fits a trie." },
    { phrase: "autocomplete", why: "Suggestions under a typed prefix." },
    { phrase: "suggestions", why: "Return words under the current prefix as each character is typed.", weight: 2 },
    { phrase: "wildcard", why: "A '.' branches the search across every child." },
    { phrase: "any letter", why: "Matching any letter means exploring every child at that depth." },
    { phrase: "root", why: "Replace Words swaps a word for its shortest stored root (prefix)." },
    { phrase: "list of words", why: "Searching for many words at once shares work through a trie." },
    { phrase: "concatenation", why: "Words built from other words: walk the trie, restart at each word end." },
  ],
  antiSignals: [
    "You only need exact-match lookups: a Set of strings is simpler.",
  ],
  complexity: { time: "O(L) per insert or lookup, for word length L", space: "O(total characters)" },
  template: {
    title: "Nodes with a child map and an end marker",
    explanation:
      "Each node maps a character to the next node and remembers whether a word ends there. insert walks and creates, search walks and checks the marker, startsWith just walks. One shared helper does the walking.",
    code: `class TrieNode {
  children = new Map<string, TrieNode>();
  isWord = false;
}

class Trie {
  private root = new TrieNode();

  insert(word: string): void {
    let node = this.root;
    for (const ch of word) {
      let next = node.children.get(ch);
      if (!next) {
        next = new TrieNode();
        node.children.set(ch, next);
      }
      node = next;
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
        call: "(() => { const t = new Trie(); t.insert('apple'); return [t.search('apple'), t.search('app'), t.startsWith('app')]; })()",
        expected: [true, false, true],
      },
    ],
  },
  variants: [
    {
      title: "Wildcard search: branch on '.'",
      explanation:
        "Add and Search Words: an ordinary character follows one child, a '.' tries every child. A recursive helper with an index into the word keeps it short.",
      code: `class DictNode {
  children = new Map<string, DictNode>();
  isWord = false;
}

class WordDictionary {
  private root = new DictNode();

  addWord(word: string): void {
    let node = this.root;
    for (const ch of word) {
      let next = node.children.get(ch);
      if (!next) {
        next = new DictNode();
        node.children.set(ch, next);
      }
      node = next;
    }
    node.isWord = true;
  }

  search(word: string): boolean {
    const match = (node: DictNode, i: number): boolean => {
      if (i === word.length) return node.isWord;
      if (word[i] === ".") {
        return [...node.children.values()].some((child) => match(child, i + 1));
      }
      const next = node.children.get(word[i]);
      return next !== undefined && match(next, i + 1);
    };
    return match(this.root, 0);
  }
}`,
      cases: [
        {
          call: "(() => { const d = new WordDictionary(); ['bad', 'dad', 'mad'].forEach((w) => d.addWord(w)); return [d.search('pad'), d.search('bad'), d.search('.ad'), d.search('b..')]; })()",
          expected: [false, true, true, true],
        },
      ],
    },
  ],
  pitfalls: [
    "Forgetting the end-of-word marker, so 'app' is found after inserting only 'apple'.",
    "In Word Search II, not removing found words or pruning empty branches, which repeats work and can return duplicates.",
  ],
  jsNotes: [
    "A Map per node is clearest. For lowercase-only input an array of 26 children is faster and is a fair optimisation to mention.",
    "Iterating a string with for...of walks Unicode code points; s[i] walks UTF-16 units. For LeetCode's lowercase input they're the same.",
  ],
  prerequisites: ["tree-dfs"],
  problems: [
    {
      slug: "longest-common-prefix",
      title: "Longest Common Prefix",
      difficulty: "Easy",
      prompt: "Find the longest common prefix string among an array of strings, or an empty string.",
      tell: "\"Prefix\" shared by every word. Comparing column by column is simplest; a trie walked while there's exactly one child is the generalisation.",
      alsoAccept: ["arrays-hashing"],
    },
    {
      slug: "implement-trie-prefix-tree",
      title: "Implement Trie (Prefix Tree)",
      difficulty: "Medium",
      prompt: "Implement a trie with insert, search, and startsWith, which reports whether any stored word starts with a prefix.",
      tell: "\"Trie\" and \"starts with\" are in the title. Write the template until you can do it in five minutes.",
    },
    {
      slug: "design-add-and-search-words-data-structure",
      title: "Design Add and Search Words Data Structure",
      difficulty: "Medium",
      prompt: "Design a dictionary that adds words and searches for them, where a '.' in the search can match any letter.",
      tell: "A '.' that matches \"any letter\" branches over every child, which a trie makes cheap.",
    },
    {
      slug: "replace-words",
      title: "Replace Words",
      difficulty: "Medium",
      prompt: "Given a dictionary of roots and a sentence, replace each word with the shortest root that is a prefix of it.",
      tell: "\"Root\" that is a \"prefix\": insert roots, walk each word until you hit an end marker.",
    },
    {
      slug: "search-suggestions-system",
      title: "Search Suggestions System",
      difficulty: "Medium",
      prompt: "As each character of a search word is typed, return up to three product suggestions that start with the typed prefix, in lexicographic order.",
      tell: "\"Suggestions\" for a growing \"prefix\": a trie with sorted words stored per node, or sort the products and binary search each prefix.",
      alsoAccept: ["binary-search"],
    },
    {
      slug: "map-sum-pairs",
      title: "Map Sum Pairs",
      difficulty: "Medium",
      prompt: "Implement a map that inserts key-value pairs and returns the sum of values of all keys starting with a given prefix.",
      tell: "Sum by \"prefix\": store a running sum on each trie node, adjusted by the difference when a key is updated.",
    },
    {
      slug: "word-search-ii",
      title: "Word Search II",
      difficulty: "Hard",
      prompt: "Given a board of letters and a list of words, return every word that can be traced through adjacent cells without reusing a cell.",
      tell: "A \"list of words\" on one board: put them all in a trie so one DFS from each cell follows every word at once, pruning dead prefixes.",
      alsoAccept: ["backtracking"],
    },
    {
      slug: "concatenated-words",
      title: "Concatenated Words",
      difficulty: "Hard",
      prompt: "Return every word in the list that is a concatenation of at least two shorter words from the same list.",
      tell: "Built by \"concatenation\" of other words: walk a trie and restart from the root at each word end. (Word Break DP per word is the other route.)",
      alsoAccept: ["dp-1d"],
    },
  ],
};
