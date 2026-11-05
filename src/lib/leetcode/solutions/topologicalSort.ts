import type { Solution } from "../types";

export const topologicalSortSolutions: Record<string, Solution> = {
  "find-the-town-judge": {
    approach: [
      "The judge trusts nobody and is trusted by everyone else, so their trust score is n - 1.",
      "For each pair, subtract one from the truster's score and add one to the trusted person's.",
      "Return the person whose score is exactly n - 1, or -1.",
    ],
    complexity: { time: "O(n + t)", space: "O(n)" },
    code: `function findJudge(n: number, trust: number[][]): number {
  const score = new Array<number>(n + 1).fill(0);
  for (const [a, b] of trust) {
    score[a]--;
    score[b]++;
  }
  for (let person = 1; person <= n; person++) if (score[person] === n - 1) return person;
  return -1;
}`,
    cases: [
      { call: "findJudge(2, [[1, 2]])", expected: 2 },
      { call: "findJudge(3, [[1, 3], [2, 3]])", expected: 3 },
      { call: "findJudge(3, [[1, 3], [2, 3], [3, 1]])", expected: -1 },
    ],
  },

  "course-schedule": {
    approach: [
      "Courses are nodes and prerequisites are edges. Every course can be finished exactly when there's no cycle.",
      "Kahn's algorithm: count each course's incoming edges and queue the ones with none.",
      "Take courses off the queue, lowering their dependents' counts and queueing any that reach zero. If every course gets taken, there's no cycle.",
    ],
    complexity: { time: "O(V + E)", space: "O(V + E)" },
    code: `function canFinish(numCourses: number, prerequisites: number[][]): boolean {
  const unlocks: number[][] = Array.from({ length: numCourses }, () => []);
  const waitingOn = new Array<number>(numCourses).fill(0);
  for (const [course, before] of prerequisites) {
    unlocks[before].push(course);
    waitingOn[course]++;
  }
  const queue = waitingOn.flatMap((count, course) => (count === 0 ? [course] : []));
  for (let head = 0; head < queue.length; head++) {
    for (const next of unlocks[queue[head]]) {
      if (--waitingOn[next] === 0) queue.push(next);
    }
  }
  return queue.length === numCourses;
}`,
    cases: [
      { call: "canFinish(2, [[1, 0]])", expected: true },
      { call: "canFinish(2, [[1, 0], [0, 1]])", expected: false },
    ],
    alternative: {
      name: "DFS with three colours",
      approach: [
        "Mark every course as unvisited, on the current path, or done.",
        "DFS from each course. Reaching a course that's on the current path means a cycle.",
        "A course is marked done once everything it unlocks is done, so nothing gets explored twice.",
      ],
      complexity: { time: "O(V + E)", space: "O(V + E)" },
      code: `function canFinish(numCourses: number, prerequisites: number[][]): boolean {
  const unlocks: number[][] = Array.from({ length: numCourses }, () => []);
  for (const [course, before] of prerequisites) unlocks[before].push(course);
  const UNVISITED = 0;
  const ON_PATH = 1;
  const DONE = 2;
  const state = new Array<number>(numCourses).fill(UNVISITED);
  const hasCycle = (course: number): boolean => {
    if (state[course] === ON_PATH) return true;
    if (state[course] === DONE) return false;
    state[course] = ON_PATH;
    for (const next of unlocks[course]) if (hasCycle(next)) return true;
    state[course] = DONE;
    return false;
  };
  for (let course = 0; course < numCourses; course++) if (hasCycle(course)) return false;
  return true;
}`,
      cases: [
        { call: "canFinish(2, [[1, 0]])", expected: true },
        { call: "canFinish(2, [[1, 0], [0, 1]])", expected: false },
        { call: "canFinish(3, [[1, 0], [2, 1], [0, 2]])", expected: false },
      ],
    },
  },

  "course-schedule-ii": {
    approach: [
      "Same as Course Schedule, but keep the order courses come off the queue.",
      "That order is a valid topological order.",
      "If it doesn't include every course, there's a cycle, so return an empty array.",
    ],
    complexity: { time: "O(V + E)", space: "O(V + E)" },
    code: `function findOrder(numCourses: number, prerequisites: number[][]): number[] {
  const unlocks: number[][] = Array.from({ length: numCourses }, () => []);
  const waitingOn = new Array<number>(numCourses).fill(0);
  for (const [course, before] of prerequisites) {
    unlocks[before].push(course);
    waitingOn[course]++;
  }
  const order = waitingOn.flatMap((count, course) => (count === 0 ? [course] : []));
  for (let head = 0; head < order.length; head++) {
    for (const next of unlocks[order[head]]) {
      if (--waitingOn[next] === 0) order.push(next);
    }
  }
  return order.length === numCourses ? order : [];
}`,
    cases: [
      { call: "findOrder(2, [[1, 0]])", expected: [0, 1] },
      { call: "findOrder(4, [[1, 0], [2, 0], [3, 1], [3, 2]])", expected: [0, 1, 2, 3] },
      { call: "findOrder(2, [[0, 1], [1, 0]])", expected: [] },
    ],
  },

  "find-eventual-safe-states": {
    approach: [
      "A node is safe if every path from it ends at a terminal node, which means it can't reach a cycle.",
      "Reverse the edges and run Kahn's algorithm from the terminal nodes, the ones with no outgoing edges.",
      "Each time a node is removed, its predecessors lose one outgoing edge. Nodes that reach zero are safe. Return them sorted.",
    ],
    complexity: { time: "O(V + E)", space: "O(V + E)" },
    code: `function eventualSafeNodes(graph: number[][]): number[] {
  const n = graph.length;
  const reverse: number[][] = Array.from({ length: n }, () => []);
  const outgoing = graph.map((edges) => edges.length);
  graph.forEach((edges, node) => edges.forEach((next) => reverse[next].push(node)));
  const queue = outgoing.flatMap((count, node) => (count === 0 ? [node] : []));
  const safe = new Array<boolean>(n).fill(false);
  for (let head = 0; head < queue.length; head++) {
    const node = queue[head];
    safe[node] = true;
    for (const before of reverse[node]) {
      if (--outgoing[before] === 0) queue.push(before);
    }
  }
  return safe.flatMap((isSafe, node) => (isSafe ? [node] : []));
}`,
    cases: [
      { call: "eventualSafeNodes([[1, 2], [2, 3], [5], [0], [5], [], []])", expected: [2, 4, 5, 6] },
      { call: "eventualSafeNodes([[1, 2, 3, 4], [1, 2], [3, 4], [0, 4], []])", expected: [4] },
    ],
  },

  "minimum-height-trees": {
    approach: [
      "The best roots sit in the middle of the tree's longest path.",
      "Peel off the leaves (degree 1) layer by layer, like Kahn's algorithm on an undirected tree.",
      "When two or fewer nodes are left, they're the answer.",
    ],
    complexity: { time: "O(n)", space: "O(n)" },
    code: `function findMinHeightTrees(n: number, edges: number[][]): number[] {
  if (n === 1) return [0];
  const neighbours: Set<number>[] = Array.from({ length: n }, () => new Set<number>());
  for (const [a, b] of edges) {
    neighbours[a].add(b);
    neighbours[b].add(a);
  }
  let leaves = neighbours.flatMap((set, node) => (set.size === 1 ? [node] : []));
  let remaining = n;
  while (remaining > 2) {
    remaining -= leaves.length;
    const next: number[] = [];
    for (const leaf of leaves) {
      for (const neighbour of neighbours[leaf]) {
        neighbours[neighbour].delete(leaf);
        if (neighbours[neighbour].size === 1) next.push(neighbour);
      }
    }
    leaves = next;
  }
  return leaves.sort((a, b) => a - b);
}`,
    cases: [
      { call: "findMinHeightTrees(4, [[1, 0], [1, 2], [1, 3]])", expected: [1] },
      { call: "findMinHeightTrees(6, [[3, 0], [3, 1], [3, 2], [3, 4], [5, 4]])", expected: [3, 4] },
      { call: "findMinHeightTrees(1, [])", expected: [0] },
    ],
  },

  "course-schedule-iv": {
    approach: [
      "Queries ask whether one course is an indirect prerequisite of another, which is reachability.",
      "Process courses in topological order. When an edge u → v is used, v inherits all of u's prerequisites, plus u itself.",
      "Store each course's prerequisites in a Set, and answer each query with one lookup.",
    ],
    complexity: { time: "O(V · (V + E) + Q)", space: "O(V²)" },
    code: `function checkIfPrerequisite(numCourses: number, prerequisites: number[][], queries: number[][]): boolean[] {
  const unlocks: number[][] = Array.from({ length: numCourses }, () => []);
  const waitingOn = new Array<number>(numCourses).fill(0);
  for (const [before, after] of prerequisites) {
    unlocks[before].push(after);
    waitingOn[after]++;
  }
  const ancestors = Array.from({ length: numCourses }, () => new Set<number>());
  const queue = waitingOn.flatMap((count, course) => (count === 0 ? [course] : []));
  for (let head = 0; head < queue.length; head++) {
    const course = queue[head];
    for (const next of unlocks[course]) {
      ancestors[next].add(course);
      ancestors[course].forEach((a) => ancestors[next].add(a));
      if (--waitingOn[next] === 0) queue.push(next);
    }
  }
  return queries.map(([before, after]) => ancestors[after].has(before));
}`,
    cases: [
      { call: "checkIfPrerequisite(2, [[1, 0]], [[0, 1], [1, 0]])", expected: [false, true] },
      { call: "checkIfPrerequisite(3, [[1, 2], [1, 0], [2, 0]], [[1, 0], [1, 2]])", expected: [true, true] },
      { call: "checkIfPrerequisite(2, [], [[1, 0], [0, 1]])", expected: [false, false] },
    ],
  },

  "sort-items-by-groups-respecting-dependencies": {
    approach: [
      "Two levels of ordering: groups have to be ordered among themselves, and items within each group.",
      "Give every ungrouped item its own new group. Then build an item graph and a group graph. An edge between items in different groups also becomes an edge between their groups.",
      "Topologically sort both. Lay out the groups in group order, each holding its items in item order. A cycle at either level means no answer.",
    ],
    complexity: { time: "O(n + m + E)", space: "O(n + m + E)" },
    code: `function sortItems(n: number, m: number, group: number[], beforeItems: number[][]): number[] {
  const groupOf = [...group];
  let groupCount = m;
  for (let i = 0; i < n; i++) if (groupOf[i] === -1) groupOf[i] = groupCount++;

  const topo = (count: number, edges: [number, number][]): number[] => {
    const out: number[][] = Array.from({ length: count }, () => []);
    const indegree = new Array<number>(count).fill(0);
    for (const [from, to] of edges) {
      out[from].push(to);
      indegree[to]++;
    }
    const order = indegree.flatMap((d, node) => (d === 0 ? [node] : []));
    for (let head = 0; head < order.length; head++) {
      for (const next of out[order[head]]) if (--indegree[next] === 0) order.push(next);
    }
    return order.length === count ? order : [];
  };

  const itemEdges: [number, number][] = [];
  const groupEdges: [number, number][] = [];
  beforeItems.forEach((befores, item) => {
    for (const before of befores) {
      itemEdges.push([before, item]);
      if (groupOf[before] !== groupOf[item]) groupEdges.push([groupOf[before], groupOf[item]]);
    }
  });
  const itemOrder = topo(n, itemEdges);
  const groupOrder = topo(groupCount, groupEdges);
  if (itemOrder.length === 0 || groupOrder.length === 0) return [];

  const itemsByGroup: number[][] = Array.from({ length: groupCount }, () => []);
  for (const item of itemOrder) itemsByGroup[groupOf[item]].push(item);
  return groupOrder.flatMap((g) => itemsByGroup[g]);
}

function respectsOrder(n: number, group: number[], beforeItems: number[][], order: number[]): boolean {
  if (order.length !== n) return false;
  const position = new Map(order.map((item, i) => [item, i]));
  const dependenciesHold = beforeItems.every((befores, item) =>
    befores.every((b) => (position.get(b) as number) < (position.get(item) as number)),
  );
  const groupsContiguous = order.every((item, i) => {
    if (group[item] === -1) return true;
    const later = order.slice(i + 1);
    const leaves = later.findIndex((other) => group[other] !== group[item]);
    return leaves === -1 || later.slice(leaves).every((other) => group[other] !== group[item]);
  });
  return dependenciesHold && groupsContiguous;
}`,
    cases: [
      {
        call: "(() => { const g = [-1, -1, 1, 0, 0, 1, 0, -1]; const b = [[], [6], [5], [6], [3, 6], [], [], []]; return respectsOrder(8, g, b, sortItems(8, 2, g, b)); })()",
        expected: true,
      },
      { call: "sortItems(8, 2, [-1, -1, 1, 0, 0, 1, 0, -1], [[], [6], [5], [6], [3], [], [4], []])", expected: [] },
    ],
  },
};
