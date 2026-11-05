import type { Pattern } from "../types";

export const unionFind: Pattern = {
  id: "union-find",
  name: "Union-Find",
  phase: 3,
  tagline: "Merge groups as connections arrive, and ask which group anything is in.",
  summary:
    "Union-find (disjoint set union) keeps a forest where each group has one root. find walks up to the root, union points one root at another. With path compression and union by size, both are effectively O(1). It shines when connections arrive one at a time and the questions are \"are these two connected?\", \"how many groups are there?\" or \"which edge first created a cycle?\". BFS answers those too, but would have to re-run after every edge.",
  question: "Am I merging things into groups as connections arrive, and asking whether two things share a group?",
  signals: [
    { phrase: "connected components", why: "Counting components as edges are added is union-find's bread and butter.", weight: 2 },
    { phrase: "provinces", why: "Number of Provinces: groups of connected cities.", weight: 3 },
    { phrase: "redundant", why: "The first edge whose ends are already connected makes a cycle.", weight: 3 },
    { phrase: "same group", why: "Group membership is find(a) === find(b)." },
    { phrase: "merge", why: "Merging sets that share an element is union." },
    { phrase: "belong to the same", why: "Same-owner questions merge by a shared key." },
    { phrase: "equivalence", why: "Equality is transitive, so equal things form groups." },
    { phrase: "equations", why: "a==b constraints union the variables; a!=b checks they stay apart.", weight: 2 },
    { phrase: "network", why: "Network connectivity counts components and spare cables." },
    { phrase: "swaps", why: "Swappable index pairs form groups whose contents can be freely sorted." },
    { phrase: "same row or column", why: "Stones sharing a row or column join the same group.", weight: 2 },
    { phrase: "disjoint", why: "Disjoint sets is the formal name." },
  ],
  antiSignals: [
    "You need the actual path or the number of steps between two nodes: BFS.",
    "Edges are directed: union-find ignores direction, so use topological sort or a directed traversal.",
  ],
  complexity: { time: "O(α(n)) per operation, effectively constant", space: "O(n)" },
  template: {
    title: "Path compression plus union by size",
    explanation:
      "find halves the path as it climbs, which flattens the tree over time. union attaches the smaller tree under the larger and returns false when the two were already joined, which is exactly the redundant-edge check. count tracks how many groups remain.",
    code: `class UnionFind {
  private parent: number[];
  private size: number[];
  count: number;

  constructor(n: number) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.size = new Array<number>(n).fill(1);
    this.count = n;
  }

  find(x: number): number {
    while (this.parent[x] !== x) {
      this.parent[x] = this.parent[this.parent[x]];
      x = this.parent[x];
    }
    return x;
  }

  union(a: number, b: number): boolean {
    let rootA = this.find(a);
    let rootB = this.find(b);
    if (rootA === rootB) return false;
    if (this.size[rootA] < this.size[rootB]) [rootA, rootB] = [rootB, rootA];
    this.parent[rootB] = rootA;
    this.size[rootA] += this.size[rootB];
    this.count--;
    return true;
  }
}`,
    cases: [
      {
        call: "(() => { const uf = new UnionFind(5); uf.union(0, 1); uf.union(1, 2); uf.union(3, 4); return [uf.count, uf.find(0) === uf.find(2), uf.find(0) === uf.find(3), uf.union(0, 2)]; })()",
        expected: [2, true, false, false],
      },
    ],
  },
  variants: [
    {
      title: "Redundant connection: the edge that fails to union",
      explanation:
        "Add edges in order. The first one whose ends already share a root closes a cycle. Nodes are 1-indexed here, so size the structure n + 1.",
      code: `function findRedundantConnection(edges: number[][]): number[] {
  const parent = Array.from({ length: edges.length + 1 }, (_, i) => i);
  const find = (x: number): number => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };
  for (const [a, b] of edges) {
    const rootA = find(a);
    const rootB = find(b);
    if (rootA === rootB) return [a, b];
    parent[rootA] = rootB;
  }
  return [];
}`,
      cases: [
        { call: "findRedundantConnection([[1, 2], [1, 3], [2, 3]])", expected: [2, 3] },
        { call: "findRedundantConnection([[1, 2], [2, 3], [3, 4], [1, 4], [1, 5]])", expected: [1, 4] },
      ],
    },
  ],
  pitfalls: [
    "Comparing parent[a] === parent[b] instead of find(a) === find(b). Parents aren't roots until compressed.",
    "Off-by-one sizing when nodes are numbered from 1.",
    "Union without size or rank and without compression degrades to O(n) chains.",
  ],
  jsNotes: [
    "Arrays of numbers beat Maps when ids are 0..n-1. For string keys (emails, variables), keep a Map from key to index first.",
    "An iterative find avoids stack overflow on a long chain before it's been compressed.",
  ],
  prerequisites: ["graphs"],
  problems: [
    {
      slug: "number-of-provinces",
      title: "Number of Provinces",
      difficulty: "Medium",
      prompt: "Given an adjacency matrix of cities, a province is a group of directly or indirectly connected cities. Return the number of provinces.",
      tell: "\"Provinces\" are \"connected components\": union every connected pair, read count. DFS works just as well here.",
      alsoAccept: ["graphs"],
    },
    {
      slug: "redundant-connection",
      title: "Redundant Connection",
      difficulty: "Medium",
      prompt: "A tree had one extra edge added. Return the redundant edge that can be removed to make it a tree again, the last one in the input if several qualify.",
      tell: "\"Redundant\" edge: the first one whose ends already share a root.",
    },
    {
      slug: "accounts-merge",
      title: "Accounts Merge",
      difficulty: "Medium",
      prompt: "Accounts with any email in common belong to the same person. Merge the accounts and return each person's emails sorted.",
      tell: "\"Merge\" accounts that \"belong to the same\" person through a shared email: union by email, then group by root.",
    },
    {
      slug: "most-stones-removed-with-same-row-or-column",
      title: "Most Stones Removed with Same Row or Column",
      difficulty: "Medium",
      prompt: "A stone can be removed if another stone shares the same row or column. Return the most stones that can be removed.",
      tell: "\"Same row or column\" links stones into groups; each group can shrink to one stone, so the answer is stones minus groups.",
    },
    {
      slug: "satisfiability-of-equality-equations",
      title: "Satisfiability of Equality Equations",
      difficulty: "Medium",
      prompt: "Given equations like 'a==b' and 'b!=c' over single-letter variables, can every equation hold at once?",
      tell: "\"Equations\" of equality form groups: union every ==, then check no != joins two members of the same group.",
    },
    {
      slug: "number-of-operations-to-make-network-connected",
      title: "Number of Operations to Make Network Connected",
      difficulty: "Medium",
      prompt: "Computers are joined by cables in a network. You may move a cable between any two computers. Return the minimum moves to connect them all, or -1.",
      tell: "Connecting a \"network\": you need components - 1 moves, and enough spare (redundant) cables to make them.",
    },
    {
      slug: "smallest-string-with-swaps",
      title: "Smallest String With Swaps",
      difficulty: "Medium",
      prompt: "Given a string and index pairs that may be swapped any number of times, return the lexicographically smallest string possible.",
      tell: "Repeated \"swaps\" make each connected group of indices freely sortable: union the pairs, sort each group's letters.",
    },
    {
      slug: "making-a-large-island",
      title: "Making A Large Island",
      difficulty: "Hard",
      prompt: "You may change at most one 0 to 1 in a binary grid. Return the size of the largest island possible.",
      tell: "Label each island with its root and size, then for each 0 add up the distinct neighbouring roots plus one.",
      alsoAccept: ["graphs"],
    },
  ],
};
