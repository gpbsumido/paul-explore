import type { Solution } from "../types";

export const graphsSolutions: Record<string, Solution> = {
  "flood-fill": {
    approach: [
      "Remember the starting cell's colour. If it already has the new colour, there's nothing to do.",
      "DFS from the start, repainting every cell of the original colour.",
      "Move to the four neighbours that are in bounds and still the original colour.",
    ],
    complexity: { time: "O(m · n)", space: "O(m · n)" },
    code: `function floodFill(image: number[][], sr: number, sc: number, color: number): number[][] {
  const original = image[sr][sc];
  if (original === color) return image;
  const stack: [number, number][] = [[sr, sc]];
  while (stack.length > 0) {
    const [r, c] = stack.pop() as [number, number];
    if (r < 0 || c < 0 || r >= image.length || c >= image[0].length || image[r][c] !== original) continue;
    image[r][c] = color;
    stack.push([r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]);
  }
  return image;
}`,
    cases: [
      { call: "floodFill([[1, 1, 1], [1, 1, 0], [1, 0, 1]], 1, 1, 2)", expected: [[2, 2, 2], [2, 2, 0], [2, 0, 1]] },
      { call: "floodFill([[0, 0, 0], [0, 0, 0]], 0, 0, 0)", expected: [[0, 0, 0], [0, 0, 0]] },
    ],
  },

  "find-if-path-exists-in-graph": {
    approach: [
      "Build an adjacency list from the edge list. The edges go both ways.",
      "BFS or DFS from the source, marking nodes as seen.",
      "The answer is whether the destination ever gets seen.",
    ],
    complexity: { time: "O(V + E)", space: "O(V + E)" },
    code: `function validPath(n: number, edges: number[][], source: number, destination: number): boolean {
  const graph: number[][] = Array.from({ length: n }, () => []);
  for (const [a, b] of edges) {
    graph[a].push(b);
    graph[b].push(a);
  }
  const seen = new Set<number>([source]);
  const stack = [source];
  while (stack.length > 0) {
    const node = stack.pop() as number;
    if (node === destination) return true;
    for (const next of graph[node]) {
      if (!seen.has(next)) {
        seen.add(next);
        stack.push(next);
      }
    }
  }
  return false;
}`,
    cases: [
      { call: "validPath(3, [[0, 1], [1, 2], [2, 0]], 0, 2)", expected: true },
      { call: "validPath(6, [[0, 1], [0, 2], [3, 5], [5, 4], [4, 3]], 0, 5)", expected: false },
    ],
  },

  "number-of-islands": {
    approach: [
      "Scan every cell. Each unvisited '1' is a new island.",
      "Count it, then sink the whole island with a DFS that turns its land into water.",
      "Sinking it stops any part of the island being counted again.",
    ],
    complexity: { time: "O(m · n)", space: "O(m · n)" },
    code: `function numIslands(grid: string[][]): number {
  const rows = grid.length;
  const cols = grid[0].length;
  const sink = (r: number, c: number) => {
    if (r < 0 || c < 0 || r >= rows || c >= cols || grid[r][c] !== "1") return;
    grid[r][c] = "0";
    sink(r + 1, c);
    sink(r - 1, c);
    sink(r, c + 1);
    sink(r, c - 1);
  };
  let islands = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === "1") {
        islands++;
        sink(r, c);
      }
    }
  }
  return islands;
}`,
    cases: [
      {
        call: 'numIslands([["1", "1", "1", "1", "0"], ["1", "1", "0", "1", "0"], ["1", "1", "0", "0", "0"], ["0", "0", "0", "0", "0"]])',
        expected: 1,
      },
      {
        call: 'numIslands([["1", "1", "0", "0", "0"], ["1", "1", "0", "0", "0"], ["0", "0", "1", "0", "0"], ["0", "0", "0", "1", "1"]])',
        expected: 3,
      },
    ],
  },

  "max-area-of-island": {
    approach: [
      "Same as counting islands, but the DFS returns the size of what it sank.",
      "Each land cell counts 1, plus whatever its four neighbours return.",
      "Keep the largest size found.",
    ],
    complexity: { time: "O(m · n)", space: "O(m · n)" },
    code: `function maxAreaOfIsland(grid: number[][]): number {
  const area = (r: number, c: number): number => {
    if (r < 0 || c < 0 || r >= grid.length || c >= grid[0].length || grid[r][c] !== 1) return 0;
    grid[r][c] = 0;
    return 1 + area(r + 1, c) + area(r - 1, c) + area(r, c + 1) + area(r, c - 1);
  };
  let best = 0;
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[0].length; c++) best = Math.max(best, area(r, c));
  }
  return best;
}`,
    cases: [
      {
        call: "maxAreaOfIsland([[0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0], [0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0], [0, 1, 0, 0, 1, 1, 0, 0, 1, 1, 1, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0], [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0]])",
        expected: 6,
      },
      { call: "maxAreaOfIsland([[0, 0, 0, 0, 0, 0, 0, 0]])", expected: 0 },
    ],
  },

  "clone-graph": {
    approach: [
      "Keep a Map from each original node to its copy. It doubles as the visited set.",
      "DFS: if a node has already been copied, return the copy.",
      "Otherwise make the copy, store it before recursing (this is what stops cycles looping forever), then copy the neighbours into it.",
    ],
    complexity: { time: "O(V + E)", space: "O(V)" },
    code: `class _Node {
  val: number;
  neighbors: _Node[];
  constructor(val: number, neighbors: _Node[] = []) {
    this.val = val;
    this.neighbors = neighbors;
  }
}

function cloneGraph(node: _Node | null): _Node | null {
  const copies = new Map<_Node, _Node>();
  const clone = (original: _Node): _Node => {
    const existing = copies.get(original);
    if (existing) return existing;
    const copy = new _Node(original.val);
    copies.set(original, copy);
    copy.neighbors = original.neighbors.map(clone);
    return copy;
  };
  return node ? clone(node) : null;
}

function graphFromAdjacency(adjacency: number[][]): _Node | null {
  const nodes = adjacency.map((_, i) => new _Node(i + 1));
  adjacency.forEach((list, i) => {
    nodes[i].neighbors = list.map((v) => nodes[v - 1]);
  });
  return nodes[0] ?? null;
}

function adjacencyFromGraph(start: _Node | null): number[][] {
  if (!start) return [];
  const byVal = new Map<number, _Node>();
  const stack = [start];
  while (stack.length > 0) {
    const node = stack.pop() as _Node;
    if (byVal.has(node.val)) continue;
    byVal.set(node.val, node);
    stack.push(...node.neighbors);
  }
  return [...byVal.keys()].sort((a, b) => a - b).map((v) => (byVal.get(v) as _Node).neighbors.map((n) => n.val));
}`,
    cases: [
      { call: "adjacencyFromGraph(cloneGraph(graphFromAdjacency([[2, 4], [1, 3], [2, 4], [1, 3]])))", expected: [[2, 4], [1, 3], [2, 4], [1, 3]] },
      {
        call: "(() => { const g = graphFromAdjacency([[2], [1]]); const c = cloneGraph(g); return c !== g && c !== null && c.neighbors[0] !== (g as _Node).neighbors[0]; })()",
        expected: true,
      },
      { call: "cloneGraph(null)", expected: null },
    ],
  },

  "rotting-oranges": {
    approach: [
      "Multi-source BFS: every rotten orange starts in the first wave together.",
      "Each minute, every orange in the wave rots its fresh neighbours, which become the next wave.",
      "Count the minutes until a wave is empty. If any fresh orange is left, return -1.",
    ],
    complexity: { time: "O(m · n)", space: "O(m · n)" },
    code: `function orangesRotting(grid: number[][]): number {
  let wave: [number, number][] = [];
  let fresh = 0;
  grid.forEach((row, r) =>
    row.forEach((cell, c) => {
      if (cell === 2) wave.push([r, c]);
      if (cell === 1) fresh++;
    }),
  );
  let minutes = 0;
  while (wave.length > 0 && fresh > 0) {
    const next: [number, number][] = [];
    for (const [r, c] of wave) {
      for (const [nr, nc] of [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]]) {
        if (grid[nr]?.[nc] === 1) {
          grid[nr][nc] = 2;
          fresh--;
          next.push([nr, nc]);
        }
      }
    }
    wave = next;
    minutes++;
  }
  return fresh === 0 ? minutes : -1;
}`,
    cases: [
      { call: "orangesRotting([[2, 1, 1], [1, 1, 0], [0, 1, 1]])", expected: 4 },
      { call: "orangesRotting([[2, 1, 1], [0, 1, 1], [1, 0, 1]])", expected: -1 },
      { call: "orangesRotting([[0, 2]])", expected: 0 },
    ],
  },

  "pacific-atlantic-water-flow": {
    approach: [
      "Work backwards from the oceans: water flows from a cell to a neighbour that's no higher, so walk uphill from the edges.",
      "DFS from every Pacific edge cell (top row, left column) and every Atlantic edge cell (bottom row, right column), into neighbours at least as high.",
      "The cells reached from both oceans are the answer.",
    ],
    complexity: { time: "O(m · n)", space: "O(m · n)" },
    code: `function pacificAtlantic(heights: number[][]): number[][] {
  const rows = heights.length;
  const cols = heights[0].length;
  const climb = (starts: [number, number][]) => {
    const reached = Array.from({ length: rows }, () => new Array<boolean>(cols).fill(false));
    const stack = [...starts];
    while (stack.length > 0) {
      const [r, c] = stack.pop() as [number, number];
      if (reached[r][c]) continue;
      reached[r][c] = true;
      for (const [nr, nc] of [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]]) {
        if (nr >= 0 && nc >= 0 && nr < rows && nc < cols && !reached[nr][nc] && heights[nr][nc] >= heights[r][c]) {
          stack.push([nr, nc]);
        }
      }
    }
    return reached;
  };
  const pacificStarts: [number, number][] = [];
  const atlanticStarts: [number, number][] = [];
  for (let r = 0; r < rows; r++) {
    pacificStarts.push([r, 0]);
    atlanticStarts.push([r, cols - 1]);
  }
  for (let c = 0; c < cols; c++) {
    pacificStarts.push([0, c]);
    atlanticStarts.push([rows - 1, c]);
  }
  const pacific = climb(pacificStarts);
  const atlantic = climb(atlanticStarts);
  const result: number[][] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) if (pacific[r][c] && atlantic[r][c]) result.push([r, c]);
  }
  return result;
}`,
    cases: [
      {
        call: "pacificAtlantic([[1, 2, 2, 3, 5], [3, 2, 3, 4, 4], [2, 4, 5, 3, 1], [6, 7, 1, 4, 5], [5, 1, 1, 2, 4]])",
        expected: [[0, 4], [1, 3], [1, 4], [2, 2], [3, 0], [3, 1], [4, 0]],
      },
      { call: "pacificAtlantic([[1]])", expected: [[0, 0]] },
    ],
  },

  "surrounded-regions": {
    approach: [
      "An 'O' survives only if it connects to the border. Find those rather than the captured ones.",
      "DFS from every border 'O', marking its whole region as safe.",
      "Then flip every unmarked 'O' to 'X' and turn the safe marks back into 'O'.",
    ],
    complexity: { time: "O(m · n)", space: "O(m · n)" },
    code: `function solve(board: string[][]): void {
  const rows = board.length;
  const cols = board[0].length;
  const markSafe = (r: number, c: number) => {
    if (r < 0 || c < 0 || r >= rows || c >= cols || board[r][c] !== "O") return;
    board[r][c] = "S";
    markSafe(r + 1, c);
    markSafe(r - 1, c);
    markSafe(r, c + 1);
    markSafe(r, c - 1);
  };
  for (let r = 0; r < rows; r++) {
    markSafe(r, 0);
    markSafe(r, cols - 1);
  }
  for (let c = 0; c < cols; c++) {
    markSafe(0, c);
    markSafe(rows - 1, c);
  }
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) board[r][c] = board[r][c] === "S" ? "O" : "X";
  }
}`,
    cases: [
      {
        call: '(() => { const b = [["X", "X", "X", "X"], ["X", "O", "O", "X"], ["X", "X", "O", "X"], ["X", "O", "X", "X"]]; solve(b); return b; })()',
        expected: [["X", "X", "X", "X"], ["X", "X", "X", "X"], ["X", "X", "X", "X"], ["X", "O", "X", "X"]],
      },
      { call: '(() => { const b = [["O"]]; solve(b); return b; })()', expected: [["O"]] },
    ],
  },

  "01-matrix": {
    approach: [
      "Multi-source BFS from every 0 at once, rather than a search from every 1.",
      "Every 0 has distance 0 and starts in the queue. Mark every 1 as unknown.",
      "Pop a cell and give each unknown neighbour its distance + 1, then queue it. The first time a cell is reached is its shortest distance.",
    ],
    complexity: { time: "O(m · n)", space: "O(m · n)" },
    code: `function updateMatrix(mat: number[][]): number[][] {
  const rows = mat.length;
  const cols = mat[0].length;
  const dist = mat.map((row) => row.map((v): number => (v === 0 ? 0 : -1)));
  const queue: [number, number][] = [];
  dist.forEach((row, r) => row.forEach((d, c) => d === 0 && queue.push([r, c])));
  for (let head = 0; head < queue.length; head++) {
    const [r, c] = queue[head];
    for (const [nr, nc] of [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]]) {
      if (nr >= 0 && nc >= 0 && nr < rows && nc < cols && dist[nr][nc] === -1) {
        dist[nr][nc] = dist[r][c] + 1;
        queue.push([nr, nc]);
      }
    }
  }
  return dist;
}`,
    cases: [
      { call: "updateMatrix([[0, 0, 0], [0, 1, 0], [0, 0, 0]])", expected: [[0, 0, 0], [0, 1, 0], [0, 0, 0]] },
      { call: "updateMatrix([[0, 0, 0], [0, 1, 0], [1, 1, 1]])", expected: [[0, 0, 0], [0, 1, 0], [1, 2, 1]] },
    ],
  },

  "shortest-path-in-binary-matrix": {
    approach: [
      "Every move costs the same, so BFS finds the shortest path.",
      "Start at the top-left if it's open, and move in all eight directions to open cells.",
      "Count path length in cells. The first time the bottom-right is reached is the answer; -1 if it never is.",
    ],
    complexity: { time: "O(n²)", space: "O(n²)" },
    code: `function shortestPathBinaryMatrix(grid: number[][]): number {
  const n = grid.length;
  if (grid[0][0] !== 0 || grid[n - 1][n - 1] !== 0) return -1;
  const queue: [number, number, number][] = [[0, 0, 1]];
  grid[0][0] = 1;
  for (let head = 0; head < queue.length; head++) {
    const [r, c, length] = queue[head];
    if (r === n - 1 && c === n - 1) return length;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nc >= 0 && nr < n && nc < n && grid[nr][nc] === 0) {
          grid[nr][nc] = 1;
          queue.push([nr, nc, length + 1]);
        }
      }
    }
  }
  return -1;
}`,
    cases: [
      { call: "shortestPathBinaryMatrix([[0, 1], [1, 0]])", expected: 2 },
      { call: "shortestPathBinaryMatrix([[0, 0, 0], [1, 1, 0], [1, 1, 0]])", expected: 4 },
      { call: "shortestPathBinaryMatrix([[1, 0, 0], [1, 1, 0], [1, 1, 0]])", expected: -1 },
    ],
  },

  "word-ladder": {
    approach: [
      "Each word is a node, and words one letter apart are neighbours. Every step costs the same, so it's BFS.",
      "To find neighbours, change each position to every letter a to z and keep the results that are in the word set.",
      "Remove words from the set as they're queued, so nothing is visited twice. The level the end word is reached on is the answer.",
    ],
    complexity: { time: "O(n · L · 26)", space: "O(n)" },
    code: `function ladderLength(beginWord: string, endWord: string, wordList: string[]): number {
  const unvisited = new Set(wordList);
  if (!unvisited.has(endWord)) return 0;
  let level = [beginWord];
  let steps = 1;
  while (level.length > 0) {
    const next: string[] = [];
    for (const word of level) {
      if (word === endWord) return steps;
      for (let i = 0; i < word.length; i++) {
        for (let code = 97; code <= 122; code++) {
          const candidate = word.slice(0, i) + String.fromCharCode(code) + word.slice(i + 1);
          if (unvisited.has(candidate)) {
            unvisited.delete(candidate);
            next.push(candidate);
          }
        }
      }
    }
    level = next;
    steps++;
  }
  return 0;
}`,
    cases: [
      { call: 'ladderLength("hit", "cog", ["hot", "dot", "dog", "lot", "log", "cog"])', expected: 5 },
      { call: 'ladderLength("hit", "cog", ["hot", "dot", "dog", "lot", "log"])', expected: 0 },
    ],
  },
};
