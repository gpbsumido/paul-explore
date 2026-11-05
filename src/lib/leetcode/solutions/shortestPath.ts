import type { Solution } from "../types";

export const shortestPathSolutions: Record<string, Solution> = {
  "network-delay-time": {
    approach: [
      "Dijkstra from k: a min-heap of [time, node], starting with [0, k].",
      "Pop the closest node. If it's already settled, skip it; otherwise settle it and push each neighbour at time + edge weight.",
      "If every node gets settled, the answer is the largest settled time; otherwise -1.",
    ],
    complexity: { time: "O(E log V)", space: "O(V + E)" },
    code: `function networkDelayTime(times: number[][], n: number, k: number): number {
  const graph: [number, number][][] = Array.from({ length: n + 1 }, () => []);
  for (const [from, to, w] of times) graph[from].push([to, w]);
  const settled = new Map<number, number>();
  const heap = new MinHeap<[number, number]>((a, b) => a[0] - b[0]);
  heap.push([0, k]);
  while (heap.size > 0) {
    const [time, node] = heap.pop() as [number, number];
    if (settled.has(node)) continue;
    settled.set(node, time);
    for (const [next, w] of graph[node]) if (!settled.has(next)) heap.push([time + w, next]);
  }
  return settled.size === n ? Math.max(...settled.values()) : -1;
}`,
    cases: [
      { call: "networkDelayTime([[2, 1, 1], [2, 3, 1], [3, 4, 1]], 4, 2)", expected: 2 },
      { call: "networkDelayTime([[1, 2, 1]], 2, 1)", expected: 1 },
      { call: "networkDelayTime([[1, 2, 1]], 2, 2)", expected: -1 },
    ],
  },

  "path-with-maximum-probability": {
    approach: [
      "Dijkstra with the order flipped: a max-heap on probability, and multiply along edges instead of adding.",
      "Probabilities only shrink as a path gets longer, so the first time a node comes off the heap is its best.",
      "Return the end node's probability when it's popped, or 0 if it never is.",
    ],
    complexity: { time: "O(E log V)", space: "O(V + E)" },
    code: `function maxProbability(n: number, edges: number[][], succProb: number[], start_node: number, end_node: number): number {
  const graph: [number, number][][] = Array.from({ length: n }, () => []);
  edges.forEach(([a, b], i) => {
    graph[a].push([b, succProb[i]]);
    graph[b].push([a, succProb[i]]);
  });
  const done = new Set<number>();
  const heap = new MinHeap<[number, number]>((a, b) => b[0] - a[0]);
  heap.push([1, start_node]);
  while (heap.size > 0) {
    const [prob, node] = heap.pop() as [number, number];
    if (node === end_node) return prob;
    if (done.has(node)) continue;
    done.add(node);
    for (const [next, p] of graph[node]) if (!done.has(next)) heap.push([prob * p, next]);
  }
  return 0;
}`,
    cases: [
      { call: "maxProbability(3, [[0, 1], [1, 2], [0, 2]], [0.5, 0.5, 0.2], 0, 2)", expected: 0.25 },
      { call: "maxProbability(3, [[0, 1], [1, 2], [0, 2]], [0.5, 0.5, 0.3], 0, 2)", expected: 0.3 },
      { call: "maxProbability(3, [[0, 1]], [0.5], 0, 2)", expected: 0 },
    ],
  },

  "path-with-minimum-effort": {
    approach: [
      "A path's cost is its single biggest step, not a sum. Dijkstra still works if the cost is combined with max.",
      "Heap entries are [effort, r, c]. Moving to a neighbour costs max(current effort, the height difference).",
      "The first time the bottom-right cell is popped, that's the minimum effort.",
    ],
    complexity: { time: "O(m · n log(m · n))", space: "O(m · n)" },
    code: `function minimumEffortPath(heights: number[][]): number {
  const rows = heights.length;
  const cols = heights[0].length;
  const best = Array.from({ length: rows }, () => new Array<number>(cols).fill(Infinity));
  const heap = new MinHeap<[number, number, number]>((a, b) => a[0] - b[0]);
  best[0][0] = 0;
  heap.push([0, 0, 0]);
  while (heap.size > 0) {
    const [effort, r, c] = heap.pop() as [number, number, number];
    if (r === rows - 1 && c === cols - 1) return effort;
    if (effort > best[r][c]) continue;
    for (const [nr, nc] of [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]]) {
      if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
      const next = Math.max(effort, Math.abs(heights[nr][nc] - heights[r][c]));
      if (next < best[nr][nc]) {
        best[nr][nc] = next;
        heap.push([next, nr, nc]);
      }
    }
  }
  return 0;
}`,
    cases: [
      { call: "minimumEffortPath([[1, 2, 2], [3, 8, 2], [5, 3, 5]])", expected: 2 },
      { call: "minimumEffortPath([[1, 2, 3], [3, 8, 4], [5, 3, 5]])", expected: 1 },
      { call: "minimumEffortPath([[1, 2, 1, 1, 1], [1, 2, 1, 2, 1], [1, 2, 1, 2, 1], [1, 2, 1, 2, 1], [1, 1, 1, 2, 1]])", expected: 0 },
    ],
  },

  "cheapest-flights-within-k-stops": {
    approach: [
      "Bellman-Ford limited to k + 1 rounds, because k stops means at most k + 1 flights.",
      "Each round relaxes every flight, using a copy of the previous round's prices. Without the copy, one round could chain several flights together.",
      "After k + 1 rounds, the destination's price is the answer, or -1 if it was never reached.",
    ],
    complexity: { time: "O(k · E)", space: "O(n)" },
    code: `function findCheapestPrice(n: number, flights: number[][], src: number, dst: number, k: number): number {
  let prices = new Array<number>(n).fill(Infinity);
  prices[src] = 0;
  for (let round = 0; round <= k; round++) {
    const next = [...prices];
    for (const [from, to, cost] of flights) {
      if (prices[from] + cost < next[to]) next[to] = prices[from] + cost;
    }
    prices = next;
  }
  return prices[dst] === Infinity ? -1 : prices[dst];
}`,
    cases: [
      { call: "findCheapestPrice(4, [[0, 1, 100], [1, 2, 100], [2, 0, 100], [1, 3, 600], [2, 3, 200]], 0, 3, 1)", expected: 700 },
      { call: "findCheapestPrice(3, [[0, 1, 100], [1, 2, 100], [0, 2, 500]], 0, 2, 1)", expected: 200 },
      { call: "findCheapestPrice(3, [[0, 1, 100], [1, 2, 100], [0, 2, 500]], 0, 2, 0)", expected: 500 },
    ],
  },

  "min-cost-to-connect-all-points": {
    approach: [
      "This is a minimum spanning tree on a complete graph, where the edge weight is Manhattan distance.",
      "Prim's with an array: keep each point's cheapest connection to the tree so far.",
      "Repeatedly add the cheapest point outside the tree, then update the others against it. With n² edges, the O(n²) array version beats a heap.",
    ],
    complexity: { time: "O(n²)", space: "O(n)" },
    code: `function minCostConnectPoints(points: number[][]): number {
  const n = points.length;
  const cheapest = new Array<number>(n).fill(Infinity);
  const inTree = new Array<boolean>(n).fill(false);
  cheapest[0] = 0;
  let total = 0;
  for (let added = 0; added < n; added++) {
    let pick = -1;
    for (let i = 0; i < n; i++) if (!inTree[i] && (pick === -1 || cheapest[i] < cheapest[pick])) pick = i;
    inTree[pick] = true;
    total += cheapest[pick];
    for (let i = 0; i < n; i++) {
      if (inTree[i]) continue;
      const distance = Math.abs(points[i][0] - points[pick][0]) + Math.abs(points[i][1] - points[pick][1]);
      cheapest[i] = Math.min(cheapest[i], distance);
    }
  }
  return total;
}`,
    cases: [
      { call: "minCostConnectPoints([[0, 0], [2, 2], [3, 10], [5, 2], [7, 0]])", expected: 20 },
      { call: "minCostConnectPoints([[3, 12], [-2, 5], [-4, 1]])", expected: 18 },
    ],
  },

  "find-the-city-with-the-smallest-number-of-neighbors-at-a-threshold-distance": {
    approach: [
      "Every city needs its distance to every other city, so use Floyd-Warshall: n is small enough.",
      "For each middle city k, check whether going i → k → j beats the best i → j so far.",
      "Count how many cities each one reaches within the threshold. Take the smallest count, and break ties with the larger city number.",
    ],
    complexity: { time: "O(n³)", space: "O(n²)" },
    code: `function findTheCity(n: number, edges: number[][], distanceThreshold: number): number {
  const dist = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 0 : Infinity)));
  for (const [a, b, w] of edges) {
    dist[a][b] = w;
    dist[b][a] = w;
  }
  for (let k = 0; k < n; k++) {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (dist[i][k] + dist[k][j] < dist[i][j]) dist[i][j] = dist[i][k] + dist[k][j];
      }
    }
  }
  let bestCity = -1;
  let fewest = Infinity;
  for (let i = 0; i < n; i++) {
    const reachable = dist[i].filter((d, j) => j !== i && d <= distanceThreshold).length;
    if (reachable <= fewest) {
      fewest = reachable;
      bestCity = i;
    }
  }
  return bestCity;
}`,
    cases: [
      { call: "findTheCity(4, [[0, 1, 3], [1, 2, 1], [1, 3, 4], [2, 3, 1]], 4)", expected: 3 },
      { call: "findTheCity(5, [[0, 1, 2], [0, 4, 8], [1, 2, 3], [1, 4, 2], [2, 3, 1], [3, 4, 1]], 2)", expected: 0 },
    ],
  },

  "swim-in-rising-water": {
    approach: [
      "A path's cost is the highest cell on it. Find the path whose highest cell is lowest.",
      "Dijkstra with max: heap entries are [time, r, c], and stepping onto a cell costs max(time, that cell's height).",
      "The first time the bottom-right cell is popped, that's the answer.",
    ],
    complexity: { time: "O(n² log n)", space: "O(n²)" },
    code: `function swimInWater(grid: number[][]): number {
  const n = grid.length;
  const seen = Array.from({ length: n }, () => new Array<boolean>(n).fill(false));
  const heap = new MinHeap<[number, number, number]>((a, b) => a[0] - b[0]);
  heap.push([grid[0][0], 0, 0]);
  seen[0][0] = true;
  while (heap.size > 0) {
    const [time, r, c] = heap.pop() as [number, number, number];
    if (r === n - 1 && c === n - 1) return time;
    for (const [nr, nc] of [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]]) {
      if (nr < 0 || nc < 0 || nr >= n || nc >= n || seen[nr][nc]) continue;
      seen[nr][nc] = true;
      heap.push([Math.max(time, grid[nr][nc]), nr, nc]);
    }
  }
  return -1;
}`,
    cases: [
      { call: "swimInWater([[0, 2], [1, 3]])", expected: 3 },
      {
        call: "swimInWater([[0, 1, 2, 3, 4], [24, 23, 22, 21, 5], [12, 13, 14, 15, 16], [11, 17, 18, 19, 20], [10, 9, 8, 7, 6]])",
        expected: 16,
      },
    ],
  },
};
