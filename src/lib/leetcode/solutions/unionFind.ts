import type { Solution } from "../types";

export const unionFindSolutions: Record<string, Solution> = {
  "number-of-provinces": {
    approach: [
      "Start with every city as its own group, so there are n groups.",
      "For each connection, union the two cities. If they were in different groups, there's now one fewer.",
      "Find uses path compression, so each lookup stays near O(1).",
    ],
    complexity: { time: "O(n² · α(n))", space: "O(n)" },
    code: `function findCircleNum(isConnected: number[][]): number {
  const n = isConnected.length;
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  let groups = n;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (isConnected[i][j] !== 1) continue;
      const a = find(i);
      const b = find(j);
      if (a !== b) {
        parent[a] = b;
        groups--;
      }
    }
  }
  return groups;
}`,
    cases: [
      { call: "findCircleNum([[1, 1, 0], [1, 1, 0], [0, 0, 1]])", expected: 2 },
      { call: "findCircleNum([[1, 0, 0], [0, 1, 0], [0, 0, 1]])", expected: 3 },
    ],
  },

  "redundant-connection": {
    approach: [
      "Add the edges one at a time with union-find.",
      "If an edge's two ends already share a root, they were already connected, so this edge closes a cycle.",
      "Taking the first such edge in input order is the same as taking the last edge on the cycle.",
    ],
    complexity: { time: "O(n · α(n))", space: "O(n)" },
    code: `function findRedundantConnection(edges: number[][]): number[] {
  const parent = Array.from({ length: edges.length + 1 }, (_, i) => i);
  const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
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

  "accounts-merge": {
    approach: [
      "Union every email in an account with that account's first email. Any shared email links two accounts.",
      "Remember an owner name for every email.",
      "Group the emails by their root, sort each group, and put the owner's name in front.",
    ],
    complexity: { time: "O(N log N)", space: "O(N)" },
    code: `function accountsMerge(accounts: string[][]): string[][] {
  const parent = new Map<string, string>();
  const owner = new Map<string, string>();
  const find = (x: string): string => {
    const p = parent.get(x) as string;
    if (p === x) return x;
    const root = find(p);
    parent.set(x, root);
    return root;
  };
  for (const [name, ...emails] of accounts) {
    for (const email of emails) {
      if (!parent.has(email)) parent.set(email, email);
      owner.set(email, name);
      parent.set(find(email), find(emails[0]));
    }
  }
  const groups = new Map<string, string[]>();
  for (const email of parent.keys()) {
    const root = find(email);
    const group = groups.get(root);
    if (group) group.push(email);
    else groups.set(root, [email]);
  }
  return [...groups.entries()].map(([root, emails]) => [owner.get(root) as string, ...emails.sort()]);
}`,
    cases: [
      {
        call: 'accountsMerge([["John", "johnsmith@mail.com", "john_newyork@mail.com"], ["John", "johnsmith@mail.com", "john00@mail.com"], ["Mary", "mary@mail.com"], ["John", "johnnybravo@mail.com"]]).sort()',
        expected: [
          ["John", "john00@mail.com", "john_newyork@mail.com", "johnsmith@mail.com"],
          ["John", "johnnybravo@mail.com"],
          ["Mary", "mary@mail.com"],
        ],
      },
      { call: 'accountsMerge([["A", "a@x"], ["B", "b@x"]]).sort()', expected: [["A", "a@x"], ["B", "b@x"]] },
    ],
  },

  "most-stones-removed-with-same-row-or-column": {
    approach: [
      "Stones that share a row or column form a group, and every group can be removed down to one stone.",
      "So the answer is stones minus groups.",
      "Union each stone's row with its column, keeping columns apart from rows with an offset. The number of distinct roots is the number of groups.",
    ],
    complexity: { time: "O(n · α(n))", space: "O(n)" },
    code: `function removeStones(stones: number[][]): number {
  const parent = new Map<number, number>();
  const find = (x: number): number => {
    if (!parent.has(x)) parent.set(x, x);
    const p = parent.get(x) as number;
    if (p === x) return x;
    const root = find(p);
    parent.set(x, root);
    return root;
  };
  for (const [row, col] of stones) parent.set(find(row), find(col + 10001));
  const groups = new Set(stones.map(([row]) => find(row)));
  return stones.length - groups.size;
}`,
    cases: [
      { call: "removeStones([[0, 0], [0, 1], [1, 0], [1, 2], [2, 1], [2, 2]])", expected: 5 },
      { call: "removeStones([[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]])", expected: 3 },
      { call: "removeStones([[0, 0]])", expected: 0 },
    ],
  },

  "satisfiability-of-equality-equations": {
    approach: [
      "First pass: union the two letters of every '==' equation.",
      "Second pass: every '!=' needs its two letters in different groups.",
      "If any '!=' pair shares a root, the equations can't all hold.",
    ],
    complexity: { time: "O(n)", space: "O(1)" },
    code: `function equationsPossible(equations: string[]): boolean {
  const parent = Array.from({ length: 26 }, (_, i) => i);
  const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  const letter = (ch: string) => ch.charCodeAt(0) - 97;
  for (const eq of equations) {
    if (eq[1] === "=") parent[find(letter(eq[0]))] = find(letter(eq[3]));
  }
  return equations.every((eq) => eq[1] === "=" || find(letter(eq[0])) !== find(letter(eq[3])));
}`,
    cases: [
      { call: 'equationsPossible(["a==b", "b!=a"])', expected: false },
      { call: 'equationsPossible(["b==a", "a==b"])', expected: true },
      { call: 'equationsPossible(["a==b", "b==c", "a==c"])', expected: true },
      { call: 'equationsPossible(["a!=a"])', expected: false },
    ],
  },

  "number-of-operations-to-make-network-connected": {
    approach: [
      "Connecting n computers needs at least n - 1 cables. With fewer, return -1.",
      "Otherwise, union-find counts the separate components.",
      "Every spare cable can join two components, so the moves needed are components - 1.",
    ],
    complexity: { time: "O(n + E · α(n))", space: "O(n)" },
    code: `function makeConnected(n: number, connections: number[][]): number {
  if (connections.length < n - 1) return -1;
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  let components = n;
  for (const [a, b] of connections) {
    const rootA = find(a);
    const rootB = find(b);
    if (rootA !== rootB) {
      parent[rootA] = rootB;
      components--;
    }
  }
  return components - 1;
}`,
    cases: [
      { call: "makeConnected(4, [[0, 1], [0, 2], [1, 2]])", expected: 1 },
      { call: "makeConnected(6, [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3]])", expected: 2 },
      { call: "makeConnected(6, [[0, 1], [0, 2], [0, 3], [1, 2]])", expected: -1 },
    ],
  },

  "smallest-string-with-swaps": {
    approach: [
      "Swaps chain together: any positions connected through pairs can end up in any order.",
      "Union the pairs, then group positions by root.",
      "In each group, sort the characters and write them back into the group's positions, also sorted.",
    ],
    complexity: { time: "O(n log n)", space: "O(n)" },
    code: `function smallestStringWithSwaps(s: string, pairs: number[][]): string {
  const parent = Array.from({ length: s.length }, (_, i) => i);
  const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  for (const [a, b] of pairs) parent[find(a)] = find(b);
  const groups = new Map<number, number[]>();
  for (let i = 0; i < s.length; i++) {
    const root = find(i);
    const group = groups.get(root);
    if (group) group.push(i);
    else groups.set(root, [i]);
  }
  const out = s.split("");
  for (const positions of groups.values()) {
    const letters = positions.map((i) => s[i]).sort();
    positions.forEach((position, k) => {
      out[position] = letters[k];
    });
  }
  return out.join("");
}`,
    cases: [
      { call: 'smallestStringWithSwaps("dcab", [[0, 3], [1, 2]])', expected: "bacd" },
      { call: 'smallestStringWithSwaps("dcab", [[0, 3], [1, 2], [0, 2]])', expected: "abcd" },
      { call: 'smallestStringWithSwaps("cba", [[0, 1], [1, 2]])', expected: "abc" },
    ],
  },

  "making-a-large-island": {
    approach: [
      "Label every existing island with an id, and record its size.",
      "For each 0, collect the distinct island ids around it. Flipping it gives 1 plus the sum of those sizes.",
      "Take the best flip. If there are no zeros, the whole grid is one island.",
    ],
    complexity: { time: "O(n²)", space: "O(n²)" },
    code: `function largestIsland(grid: number[][]): number {
  const n = grid.length;
  const sizes = new Map<number, number>();
  let nextId = 2;
  const paint = (r: number, c: number, id: number): number => {
    if (r < 0 || c < 0 || r >= n || c >= n || grid[r][c] !== 1) return 0;
    grid[r][c] = id;
    return 1 + paint(r + 1, c, id) + paint(r - 1, c, id) + paint(r, c + 1, id) + paint(r, c - 1, id);
  };
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (grid[r][c] === 1) {
        sizes.set(nextId, paint(r, c, nextId));
        nextId++;
      }
    }
  }
  let best = sizes.size === 0 ? 0 : Math.max(...sizes.values());
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (grid[r][c] !== 0) continue;
      const touching = new Set<number>();
      for (const [nr, nc] of [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]]) {
        const id = grid[nr]?.[nc];
        if (id !== undefined && id > 1) touching.add(id);
      }
      let size = 1;
      touching.forEach((id) => (size += sizes.get(id) ?? 0));
      best = Math.max(best, size);
    }
  }
  return best;
}`,
    cases: [
      { call: "largestIsland([[1, 0], [0, 1]])", expected: 3 },
      { call: "largestIsland([[1, 1], [1, 0]])", expected: 4 },
      { call: "largestIsland([[1, 1], [1, 1]])", expected: 4 },
    ],
  },
};
