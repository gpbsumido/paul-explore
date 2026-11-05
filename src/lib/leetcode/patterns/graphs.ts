import type { Pattern } from "../types";

export const graphs: Pattern = {
  id: "graphs",
  name: "Graph BFS & DFS",
  phase: 3,
  tagline: "Grids and networks are graphs. Mark what you've visited and flood outward.",
  summary:
    "Islands, regions, networks, rooms, rotting fruit: once you see cells or entities connected by edges, it's a graph traversal. DFS (recursive or a stack) is simplest for \"visit everything connected\": counting islands, sizing regions, cloning. BFS (a queue) is required whenever the question asks for the shortest number of steps in an unweighted graph, and multi-source BFS starts from every source at once when they all spread together. Either way, a visited set is what keeps cycles from looping forever.",
  question: "What are the nodes, what are the edges, and do I need everything connected (DFS) or the fewest steps (BFS)?",
  signals: [
    { phrase: "grid", why: "A grid is a graph where each cell connects to its four neighbours.", weight: 2 },
    { phrase: "island", why: "Islands are connected components: flood fill from each unvisited land cell.", weight: 3 },
    { phrase: "connected", why: "Connectivity questions are traversals or union-find." },
    { phrase: "graph", why: "Named outright: adjacency list, visited set, BFS or DFS.", weight: 2 },
    { phrase: "neighbors", why: "Edges by another name." },
    { phrase: "4-directionally", why: "LeetCode's phrase for grid adjacency.", weight: 2 },
    { phrase: "shortest path", why: "Unweighted shortest path is BFS.", weight: 2 },
    { phrase: "minimum number of steps", why: "Fewest steps in an unweighted graph: BFS by levels.", weight: 2 },
    { phrase: "minutes", why: "Spreading one step per minute from many sources is multi-source BFS." },
    { phrase: "rotten", why: "Rotting Oranges: every rotten orange spreads at once.", weight: 2 },
    { phrase: "region", why: "Regions are components; often flood from the border inward." },
    { phrase: "flood fill", why: "Flood fill is DFS or BFS from one cell.", weight: 3 },
    { phrase: "clone", why: "Clone a graph with a map from original node to copy." },
    { phrase: "transformation sequence", why: "Word Ladder: words are nodes, one-letter changes are edges, BFS for the shortest.", weight: 2 },
    { phrase: "ocean", why: "Pacific Atlantic: search backwards from each ocean's border." },
    { phrase: "nearest", why: "Distance to the nearest of many sources is multi-source BFS." },
    { phrase: "path exists", why: "Reachability between two nodes is any traversal." },
  ],
  antiSignals: [
    "Edges have different weights and you want the cheapest path: BFS is wrong; use Dijkstra.",
    "Edges are dependencies and you need an order: topological sort.",
    "Edges arrive one at a time and you only ask whether two things are connected: union-find.",
  ],
  complexity: { time: "O(V + E); O(rows × cols) for a grid", space: "O(V)" },
  template: {
    title: "Count components with flood fill",
    explanation:
      "Every unvisited land cell starts a new island; the flood marks its whole component so it's never counted again. Marking the grid itself as visited saves a Set, which is fine when you're allowed to modify input. Ask first.",
    code: `function numIslands(grid: string[][]): number {
  const rows = grid.length;
  const cols = grid[0].length;
  function sink(r: number, c: number): void {
    if (r < 0 || c < 0 || r >= rows || c >= cols || grid[r][c] !== "1") return;
    grid[r][c] = "0";
    sink(r + 1, c);
    sink(r - 1, c);
    sink(r, c + 1);
    sink(r, c - 1);
  }
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
      { call: "numIslands([['1', '1', '0', '0', '0'], ['1', '1', '0', '0', '0'], ['0', '0', '1', '0', '0'], ['0', '0', '0', '1', '1']])", expected: 3 },
      { call: "numIslands([['0']])", expected: 0 },
    ],
  },
  variants: [
    {
      title: "Multi-source BFS by levels",
      explanation:
        "Rotting Oranges: start the queue with every rotten orange, then spread one level per minute. Count the fresh ones up front so you know whether any were never reached.",
      code: `function orangesRotting(grid: number[][]): number {
  const rows = grid.length;
  const cols = grid[0].length;
  let frontier: [number, number][] = [];
  let fresh = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 2) frontier.push([r, c]);
      if (grid[r][c] === 1) fresh++;
    }
  }
  const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  let minutes = 0;
  while (frontier.length > 0 && fresh > 0) {
    const next: [number, number][] = [];
    for (const [r, c] of frontier) {
      for (const [dr, dc] of directions) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nc >= 0 && nr < rows && nc < cols && grid[nr][nc] === 1) {
          grid[nr][nc] = 2;
          fresh--;
          next.push([nr, nc]);
        }
      }
    }
    frontier = next;
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
    {
      title: "Clone with a map from old to new",
      explanation:
        "The map doubles as the visited set: a node already in it has been copied, so return the copy instead of recursing forever around a cycle.",
      code: `class GraphNode {
  constructor(public val: number, public neighbors: GraphNode[] = []) {}
}

function cloneGraph(node: GraphNode | null): GraphNode | null {
  const copies = new Map<GraphNode, GraphNode>();
  function copy(original: GraphNode): GraphNode {
    const existing = copies.get(original);
    if (existing) return existing;
    const clone = new GraphNode(original.val);
    copies.set(original, clone);
    clone.neighbors = original.neighbors.map(copy);
    return clone;
  }
  return node ? copy(node) : null;
}`,
      cases: [
        {
          call: "(() => { const a = new GraphNode(1), b = new GraphNode(2); a.neighbors = [b]; b.neighbors = [a]; const c = cloneGraph(a) as GraphNode; return [c !== a, c.val, c.neighbors[0].val, c.neighbors[0].neighbors[0] === c]; })()",
          expected: [true, 1, 2, true],
        },
      ],
    },
  ],
  pitfalls: [
    "Marking visited when you pop instead of when you push in BFS, so the same cell enters the queue many times.",
    "Forgetting bounds checks before indexing grid[r][c]; grid[-1] is undefined in JavaScript, and undefined[c] throws.",
    "Using DFS for shortest steps. It finds a path, not the shortest one.",
  ],
  jsNotes: [
    "Recursive flood fill on a 300 × 300 all-land grid can recurse 90,000 deep and overflow the stack. Mention an explicit stack or BFS for large grids.",
    "A visited Set of coordinates needs string keys (r + ',' + c) or a numeric key (r * cols + c).",
  ],
  deepDive: "/learn/trees-graphs",
  prerequisites: ["tree-dfs", "tree-bfs"],
  problems: [
    {
      slug: "flood-fill",
      title: "Flood Fill",
      difficulty: "Easy",
      prompt: "Starting from one pixel of an image grid, recolour it and every 4-directionally connected pixel of the same original colour.",
      tell: "\"Flood fill\" through \"4-directionally\" connected cells is the base traversal. Watch the case where the new colour equals the old.",
    },
    {
      slug: "find-if-path-exists-in-graph",
      title: "Find if Path Exists in Graph",
      difficulty: "Easy",
      prompt: "Given n nodes and a list of undirected edges, decide whether a valid path exists from source to destination in the graph.",
      tell: "\"Path exists\" in a \"graph\": build an adjacency list and run BFS or DFS from the source. Union-find also works.",
      alsoAccept: ["union-find"],
    },
    {
      slug: "number-of-islands",
      title: "Number of Islands",
      difficulty: "Medium",
      prompt: "Given a grid of '1' land and '0' water, count the islands: groups of land connected 4-directionally.",
      tell: "\"Island\" on a \"grid\": count connected components by flooding each unvisited land cell.",
    },
    {
      slug: "max-area-of-island",
      title: "Max Area of Island",
      difficulty: "Medium",
      prompt: "In a binary grid, return the area of the largest island of 4-directionally connected 1s.",
      tell: "Same flood fill as Number of Islands, but the DFS returns the size of what it sank.",
    },
    {
      slug: "clone-graph",
      title: "Clone Graph",
      difficulty: "Medium",
      prompt: "Given a node in a connected undirected graph, return a deep copy (clone) of the graph.",
      tell: "\"Clone\" a \"graph\" with cycles: a Map from original to copy is both the result and the visited set.",
    },
    {
      slug: "rotting-oranges",
      title: "Rotting Oranges",
      difficulty: "Medium",
      prompt: "Every minute, fresh oranges next to a rotten one become rotten. Return the minutes until none are fresh, or -1.",
      tell: "\"Minutes\" for \"rotten\" to spread from many cells at once: multi-source BFS, one level per minute.",
    },
    {
      slug: "pacific-atlantic-water-flow",
      title: "Pacific Atlantic Water Flow",
      difficulty: "Medium",
      prompt: "Water flows to equal or lower neighbours. Return the cells in the grid from which water can reach both the Pacific and Atlantic ocean borders.",
      tell: "Searching from every cell is slow. Search backwards (uphill) from each \"ocean\" border, then intersect the two visited sets.",
    },
    {
      slug: "surrounded-regions",
      title: "Surrounded Regions",
      difficulty: "Medium",
      prompt: "Capture every region of 'O' cells fully surrounded by 'X' by flipping it to 'X'. Regions touching the border survive.",
      tell: "Hard to prove a \"region\" is surrounded, easy to find the ones that aren't: flood from border 'O's, then flip everything else.",
    },
    {
      slug: "01-matrix",
      title: "01 Matrix",
      difficulty: "Medium",
      prompt: "For each cell of a binary matrix, return the distance to the nearest 0.",
      tell: "\"Nearest\" of many sources: put every 0 in the queue and BFS outward once, rather than a BFS per cell.",
    },
    {
      slug: "shortest-path-in-binary-matrix",
      title: "Shortest Path in Binary Matrix",
      difficulty: "Medium",
      prompt: "Return the length of the shortest clear path from top-left to bottom-right of a binary grid, moving in 8 directions, or -1.",
      tell: "\"Shortest path\" on an unweighted \"grid\": BFS, with eight directions instead of four.",
    },
    {
      slug: "word-ladder",
      title: "Word Ladder",
      difficulty: "Hard",
      prompt: "Return the number of words in the shortest transformation sequence from beginWord to endWord, changing one letter at a time through words in a list.",
      tell: "Shortest \"transformation sequence\": words are nodes, one-letter changes are edges, BFS gives the fewest steps. Wildcard keys like h*t find neighbours fast.",
    },
  ],
};
