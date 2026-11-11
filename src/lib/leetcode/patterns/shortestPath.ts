import type { Pattern } from "../types";

export const shortestPath: Pattern = {
  id: "shortest-path",
  name: "Weighted Shortest Paths",
  phase: 3,
  tagline: "BFS with a heap: always expand the cheapest place you can reach next.",
  summary:
    "Once edges have different costs (times, distances, probabilities, effort), plain BFS stops being correct, because fewer edges no longer means cheaper. Dijkstra fixes that by expanding the cheapest frontier node next, from a min-heap. It needs non-negative weights. Bellman-Ford handles a cap on the number of edges (Cheapest Flights Within K Stops) and negative weights. Floyd-Warshall gives all pairs when n is a few hundred. Prim's, a near-identical heap loop, builds a minimum spanning tree.",
  question: "Do the edges have different costs, and do I want the cheapest route from a source?",
  signals: [
    { phrase: "weighted", why: "Weighted edges rule out BFS; use Dijkstra.", weight: 2 },
    { phrase: "minimum time", why: "Time along weighted edges is a shortest-path cost." },
    { phrase: "signal", why: "Network Delay Time: how long a signal takes to reach every node.", weight: 2 },
    { phrase: "cheapest", why: "Cheapest route is the weighted shortest path.", weight: 2 },
    { phrase: "at most k stops", why: "A cap on edges: Bellman-Ford for k + 1 rounds.", weight: 3 },
    { phrase: "probability", why: "Maximise a product of probabilities: Dijkstra with a max-heap.", weight: 2 },
    { phrase: "effort", why: "Minimise the largest step on a path: Dijkstra where cost is the max so far.", weight: 2 },
    { phrase: "travel time", why: "Edge travel times are weights." },
    { phrase: "minimum cost to connect", why: "Connecting everything cheaply is a minimum spanning tree.", weight: 3 },
    { phrase: "distance threshold", why: "All-pairs distances under a threshold: Floyd-Warshall or Dijkstra from each node.", weight: 2 },
    { phrase: "elevation", why: "Swim in Rising Water: the cost of a path is its highest cell." },
    { phrase: "flights", why: "Flights with prices are weighted directed edges." },
  ],
  antiSignals: [
    "Every edge costs the same: BFS is simpler and faster.",
    "You need any valid order of dependencies: topological sort, not a shortest path.",
  ],
  complexity: { time: "O((V + E) log V) for Dijkstra with a heap", space: "O(V + E)" },
  template: {
    title: "Dijkstra with a lazy min-heap",
    explanation:
      "Push [distance, node] pairs. Pop the cheapest; if it's stale (we already found something cheaper), skip it. Otherwise relax each edge and push improved distances. Skipping stale entries is simpler than a decrease-key operation and has the same complexity. Uses the toolkit MinHeap.",
    code: `function networkDelayTime(times: number[][], n: number, k: number): number {
  const edges: [number, number][][] = Array.from({ length: n + 1 }, () => []);
  for (const [from, to, cost] of times) edges[from].push([to, cost]);
  const dist = new Array<number>(n + 1).fill(Number.POSITIVE_INFINITY);
  dist[k] = 0;
  const heap = new MinHeap<[number, number]>((a, b) => a[0] - b[0]);
  heap.push([0, k]);
  while (heap.size > 0) {
    const [d, node] = heap.pop() as [number, number];
    if (d > dist[node]) continue;
    for (const [to, cost] of edges[node]) {
      if (d + cost < dist[to]) {
        dist[to] = d + cost;
        heap.push([dist[to], to]);
      }
    }
  }
  const slowest = Math.max(...dist.slice(1));
  return slowest === Number.POSITIVE_INFINITY ? -1 : slowest;
}`,
    cases: [
      { call: "networkDelayTime([[2, 1, 1], [2, 3, 1], [3, 4, 1]], 4, 2)", expected: 2 },
      { call: "networkDelayTime([[1, 2, 1]], 2, 2)", expected: -1 },
    ],
  },
  variants: [
    {
      title: "Bellman-Ford: at most k edges",
      explanation:
        "Relax every edge k + 1 times, reading from the previous round's copy so one round can't chain several flights together. Dijkstra struggles here because the cheapest route may use too many stops.",
      code: `function findCheapestPrice(n: number, flights: number[][], src: number, dst: number, k: number): number {
  let prices = new Array<number>(n).fill(Number.POSITIVE_INFINITY);
  prices[src] = 0;
  for (let round = 0; round <= k; round++) {
    const next = [...prices];
    for (const [from, to, price] of flights) {
      if (prices[from] + price < next[to]) next[to] = prices[from] + price;
    }
    prices = next;
  }
  return prices[dst] === Number.POSITIVE_INFINITY ? -1 : prices[dst];
}`,
      cases: [
        { call: "findCheapestPrice(4, [[0, 1, 100], [1, 2, 100], [2, 0, 100], [1, 3, 600], [2, 3, 200]], 0, 3, 1)", expected: 700 },
        { call: "findCheapestPrice(3, [[0, 1, 100], [1, 2, 100], [0, 2, 500]], 0, 2, 0)", expected: 500 },
      ],
    },
    {
      title: "Prim's: the same loop builds a spanning tree",
      explanation:
        "Min Cost to Connect All Points: on a dense graph, skip the heap and scan an array of best-known connection costs, O(n²). Each round adds the cheapest unconnected point.",
      code: `function minCostConnectPoints(points: number[][]): number {
  const n = points.length;
  const best = new Array<number>(n).fill(Number.POSITIVE_INFINITY);
  const inTree = new Array<boolean>(n).fill(false);
  best[0] = 0;
  let total = 0;
  for (let added = 0; added < n; added++) {
    let pick = -1;
    for (let i = 0; i < n; i++) {
      if (!inTree[i] && (pick === -1 || best[i] < best[pick])) pick = i;
    }
    inTree[pick] = true;
    total += best[pick];
    for (let i = 0; i < n; i++) {
      const cost = Math.abs(points[i][0] - points[pick][0]) + Math.abs(points[i][1] - points[pick][1]);
      if (!inTree[i] && cost < best[i]) best[i] = cost;
    }
  }
  return total;
}`,
      cases: [
        { call: "minCostConnectPoints([[0, 0], [2, 2], [3, 10], [5, 2], [7, 0]])", expected: 20 },
        { call: "minCostConnectPoints([[3, 12], [-2, 5], [-4, 1]])", expected: 18 },
      ],
    },
  ],
  pitfalls: [
    "Using BFS on weighted edges: the route with fewer edges isn't always cheaper.",
    "Not skipping stale heap entries, which turns Dijkstra quadratic on dense graphs.",
    "Dijkstra with negative weights gives wrong answers. Say so, and reach for Bellman-Ford.",
  ],
  jsNotes: [
    "Math.max(...array) throws a RangeError on arrays over roughly 100k elements. Use reduce for large inputs.",
    "Number.POSITIVE_INFINITY (or Infinity) is a safe 'unreached' marker: Infinity + cost stays Infinity.",
  ],
  prerequisites: ["graphs", "heap"],
  problems: [
    {
      slug: "network-delay-time",
      title: "Network Delay Time",
      difficulty: "Medium",
      prompt: "Given weighted directed travel times between n nodes, return how long it takes a signal sent from node k to reach every node, or -1.",
      tell: "\"Signal\" over \"travel time\" edges: Dijkstra from k, answer is the largest distance.",
    },
    {
      slug: "path-with-maximum-probability",
      title: "Path with Maximum Probability",
      difficulty: "Medium",
      prompt: "Each undirected edge has a success probability. Return the maximum probability of a path from start to end.",
      tell: "Best \"probability\" is a product to maximise: Dijkstra with a max-heap, multiplying instead of adding.",
    },
    {
      slug: "path-with-minimum-effort",
      title: "Path With Minimum Effort",
      difficulty: "Medium",
      prompt: "A route's effort is the largest height difference between consecutive cells. Return the minimum effort to travel from top-left to bottom-right of the grid.",
      tell: "\"Effort\" is the max step along the path: Dijkstra where a path's cost is max(cost so far, this step). Binary search plus BFS also works.",
      alsoAccept: ["binary-search"],
    },
    {
      slug: "cheapest-flights-within-k-stops",
      title: "Cheapest Flights Within K Stops",
      difficulty: "Medium",
      prompt: "Given flights with prices, return the cheapest price from src to dst with at most k stops, or -1.",
      tell: "\"Cheapest\" with \"at most k stops\": Bellman-Ford for k + 1 rounds, copying the array each round.",
    },
    {
      slug: "min-cost-to-connect-all-points",
      title: "Min Cost to Connect All Points",
      difficulty: "Medium",
      prompt: "The cost to connect two points is their Manhattan distance. Return the minimum cost to connect all points.",
      tell: "\"Minimum cost to connect\" everything is a spanning tree: Prim's (dense, O(n²)) or Kruskal's with union-find.",
      alsoAccept: ["union-find"],
    },
    {
      slug: "find-the-city-with-the-smallest-number-of-neighbors-at-a-threshold-distance",
      title: "Find the City With the Smallest Number of Neighbors at a Threshold Distance",
      difficulty: "Medium",
      prompt: "Return the city with the fewest other cities reachable within a distance threshold, preferring the larger number on ties.",
      tell: "All-pairs under a \"distance threshold\" with n ≤ 100: Floyd-Warshall's triple loop is the shortest code.",
    },
    {
      slug: "swim-in-rising-water",
      title: "Swim in Rising Water",
      difficulty: "Hard",
      prompt: "Each grid cell has an elevation. At time t you can swim through cells with elevation at most t. Return the least time to reach the bottom-right.",
      tell: "A path costs its highest \"elevation\": Dijkstra on max-so-far, popping the lowest cell next.",
    },
  ],
};
