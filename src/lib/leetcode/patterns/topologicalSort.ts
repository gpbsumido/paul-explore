import type { Pattern } from "../types";

export const topologicalSort: Pattern = {
  id: "topological-sort",
  name: "Topological Sort",
  phase: 3,
  tagline: "Things with prerequisites: peel off whatever has nothing left blocking it.",
  summary:
    "When edges mean \"must come before\" (courses and prerequisites, build steps, recipes and ingredients), the question is either \"give me a valid order\" or \"is there a cycle that makes any order impossible\". Kahn's algorithm answers both: count each node's incoming edges, queue the ones with none, and every time you take a node, decrement its neighbours and queue any that hit zero. If you take fewer nodes than exist, there was a cycle.",
  question: "Do the edges mean one thing must happen before another, and do I need an order or to detect a cycle?",
  signals: [
    { phrase: "prerequisite", why: "Prerequisites are directed edges; a valid order is a topological sort.", weight: 3 },
    { phrase: "prerequisites", why: "Course Schedule's word for the edges.", weight: 3 },
    { phrase: "dependencies", why: "Dependency order is the textbook topological sort.", weight: 2 },
    { phrase: "depends on", why: "A depends-on relationship is a directed edge." },
    { phrase: "must be taken before", why: "An ordering constraint between two nodes." },
    { phrase: "valid ordering", why: "Any valid order under constraints is Kahn's output.", weight: 2 },
    { phrase: "cycle", why: "No valid order exists exactly when the directed graph has a cycle." },
    { phrase: "directed acyclic", why: "A DAG is what topological order is defined on.", weight: 2 },
    { phrase: "safe", why: "Eventual safe states: nodes that can't reach a cycle, found by peeling from the sinks." },
    { phrase: "trusts", why: "Town Judge counts trust edges in and out: in-degree without the queue." },
    { phrase: "alien", why: "Alien Dictionary: adjacent words give letter-order edges." },
  ],
  antiSignals: [
    "The edges are undirected and you only care about connectivity: plain BFS or DFS, or union-find.",
    "The edges have weights and you want the cheapest route: shortest path, not an ordering.",
  ],
  complexity: { time: "O(V + E)", space: "O(V + E)" },
  template: {
    title: "Kahn's algorithm",
    explanation:
      "Build the adjacency list and in-degree counts. Queue every node with in-degree zero. Pop one, add it to the order, and decrement each neighbour; a neighbour reaching zero joins the queue. If the order is shorter than the node count, a cycle blocked the rest.",
    code: `function findOrder(numCourses: number, prerequisites: number[][]): number[] {
  const next: number[][] = Array.from({ length: numCourses }, () => []);
  const inDegree = new Array<number>(numCourses).fill(0);
  for (const [course, before] of prerequisites) {
    next[before].push(course);
    inDegree[course]++;
  }
  const queue: number[] = [];
  for (let i = 0; i < numCourses; i++) if (inDegree[i] === 0) queue.push(i);
  const order: number[] = [];
  for (let head = 0; head < queue.length; head++) {
    const course = queue[head];
    order.push(course);
    for (const after of next[course]) {
      inDegree[after]--;
      if (inDegree[after] === 0) queue.push(after);
    }
  }
  return order.length === numCourses ? order : [];
}`,
    cases: [
      { call: "findOrder(2, [[1, 0]])", expected: [0, 1] },
      { call: "findOrder(4, [[1, 0], [2, 0], [3, 1], [3, 2]])", expected: [0, 1, 2, 3] },
      { call: "findOrder(2, [[1, 0], [0, 1]])", expected: [] },
    ],
  },
  variants: [
    {
      title: "DFS with three colours",
      explanation:
        "The other classic: 0 is unvisited, 1 is on the current path, 2 is finished. Meeting a 1 again means a back edge, so a cycle. Reversed finish order is a topological order.",
      code: `function canFinish(numCourses: number, prerequisites: number[][]): boolean {
  const next: number[][] = Array.from({ length: numCourses }, () => []);
  for (const [course, before] of prerequisites) next[before].push(course);
  const state = new Array<number>(numCourses).fill(0);
  function hasCycle(node: number): boolean {
    if (state[node] === 1) return true;
    if (state[node] === 2) return false;
    state[node] = 1;
    for (const after of next[node]) if (hasCycle(after)) return true;
    state[node] = 2;
    return false;
  }
  for (let i = 0; i < numCourses; i++) if (hasCycle(i)) return false;
  return true;
}`,
      cases: [
        { call: "canFinish(2, [[1, 0]])", expected: true },
        { call: "canFinish(2, [[1, 0], [0, 1]])", expected: false },
      ],
    },
  ],
  pitfalls: [
    "Getting the edge direction backwards: [a, b] in Course Schedule means b comes before a.",
    "Using a two-state visited set for directed cycle detection. A node visited on a different branch isn't a cycle; you need the on-path state.",
    "Forgetting nodes with no edges at all. They still belong in the order.",
  ],
  jsNotes: [
    "queue.shift() is O(n). Walk a head index over the array instead, as the template does.",
    "Array.from({ length: n }, () => []) gives n separate arrays; new Array(n).fill([]) shares one array across every slot.",
  ],
  prerequisites: ["graphs"],
  problems: [
    {
      slug: "find-the-town-judge",
      title: "Find the Town Judge",
      difficulty: "Easy",
      prompt: "In a town of n people, the judge trusts nobody and everybody else trusts the judge. Given who trusts whom, find the judge or return -1.",
      tell: "\"Trusts\" as directed edges: the judge has in-degree n - 1 and out-degree 0. In-degree counting is the first half of Kahn's.",
      alsoAccept: ["graphs"],
    },
    {
      slug: "course-schedule",
      title: "Course Schedule",
      difficulty: "Medium",
      prompt: "There are numCourses courses and pairs of prerequisites. Can you finish all courses, or does a cycle of prerequisites make it impossible?",
      tell: "\"Prerequisites\" and \"finish all\": can a topological order exist, which is the same as no \"cycle\".",
    },
    {
      slug: "course-schedule-ii",
      title: "Course Schedule II",
      difficulty: "Medium",
      prompt: "Return a valid ordering of courses that satisfies all prerequisites, or an empty array if impossible.",
      tell: "\"Valid ordering\" under \"prerequisites\": Kahn's algorithm, returning the order instead of a boolean.",
    },
    {
      slug: "find-eventual-safe-states",
      title: "Find Eventual Safe States",
      difficulty: "Medium",
      prompt: "A node is safe if every path from it leads to a terminal node. Return all safe nodes of the directed graph in sorted order.",
      tell: "\"Safe\" means it can't reach a cycle: reverse the edges and run Kahn's from the terminal nodes, or use three-colour DFS.",
    },
    {
      slug: "minimum-height-trees",
      title: "Minimum Height Trees",
      difficulty: "Medium",
      prompt: "Given a tree of n nodes, return the roots that give the tree minimum height.",
      tell: "Peel leaves layer by layer, like Kahn's on an undirected tree; the last one or two nodes standing are the centres.",
    },
    {
      slug: "course-schedule-iv",
      title: "Course Schedule IV",
      difficulty: "Medium",
      prompt: "Given prerequisites, answer queries asking whether course u is a prerequisite, directly or indirectly, of course v.",
      tell: "Indirect \"prerequisite\" queries: process in topological order and pass each course's set of ancestors to its dependents.",
    },
    {
      slug: "sort-items-by-groups-respecting-dependencies",
      title: "Sort Items by Groups Respecting Dependencies",
      difficulty: "Hard",
      prompt: "Items belong to groups, and some items must come before others. Order items so each group is contiguous and all dependencies hold.",
      tell: "Two layers of \"dependencies\": topologically sort the groups, then the items inside each group.",
    },
  ],
};
