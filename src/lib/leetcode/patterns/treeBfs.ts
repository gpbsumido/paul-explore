import type { Pattern } from "../types";

export const treeBfs: Pattern = {
  id: "tree-bfs",
  name: "Tree BFS",
  phase: 2,
  tagline: "Process the tree one level at a time.",
  summary:
    "When a question talks about levels (each level's values, the rightmost node per level, a zigzag, the width of a level) or about the shallowest something, a queue processes nodes in level order and you can snapshot the queue's length to know where each level ends. BFS also finds the minimum depth without exploring the deep branches DFS would wander into first.",
  question: "Is the answer organised by level, or about the nearest node to the root?",
  signals: [
    { phrase: "level order", why: "Level order is BFS by definition.", weight: 3 },
    { phrase: "each level", why: "Per-level answers come from processing one level of the queue at a time.", weight: 2 },
    { phrase: "level by level", why: "BFS with a level-size snapshot." },
    { phrase: "right side view", why: "The last node of each level is what you see from the right.", weight: 2 },
    { phrase: "zigzag", why: "Level order, alternating the direction each level is read.", weight: 2 },
    { phrase: "minimum depth", why: "The first leaf BFS reaches is the shallowest.", weight: 2 },
    { phrase: "width", why: "Width needs positions within a level, which BFS tracks." },
    { phrase: "average of levels", why: "Per-level sums in level order.", weight: 2 },
    { phrase: "next right pointer", why: "Link each node to the next one in the same level." },
    { phrase: "distance k", why: "Nodes at distance k: turn parent links into a graph and BFS k steps." },
    { phrase: "closest", why: "Nearest-to-root answers are found by BFS first." },
  ],
  antiSignals: [
    "The answer combines values from subtrees (heights, sums, paths): recursive DFS is shorter.",
  ],
  complexity: { time: "O(n)", space: "O(w), where w is the widest level" },
  template: {
    title: "Snapshot the level, then process exactly that many",
    explanation:
      "Each round takes the current frontier as one level, collects its values, and builds the next frontier from its children. Swapping arrays per level avoids shift() and makes the level boundary obvious.",
    code: `function levelOrder(root: TreeNode | null): number[][] {
  const levels: number[][] = [];
  let frontier: TreeNode[] = root ? [root] : [];
  while (frontier.length > 0) {
    levels.push(frontier.map((node) => node.val));
    const next: TreeNode[] = [];
    for (const node of frontier) {
      if (node.left) next.push(node.left);
      if (node.right) next.push(node.right);
    }
    frontier = next;
  }
  return levels;
}`,
    cases: [
      { call: "levelOrder(treeFromLevelOrder([3, 9, 20, null, null, 15, 7]))", expected: [[3], [9, 20], [15, 7]] },
      { call: "levelOrder(null)", expected: [] },
    ],
  },
  variants: [
    {
      title: "Read one thing off each level",
      explanation: "Right Side View is level order keeping only the last value per level. Minimum Depth returns the level number at the first leaf.",
      code: `function rightSideView(root: TreeNode | null): number[] {
  const seen: number[] = [];
  let frontier: TreeNode[] = root ? [root] : [];
  while (frontier.length > 0) {
    seen.push(frontier[frontier.length - 1].val);
    frontier = frontier.flatMap((node) => [node.left, node.right].filter((c): c is TreeNode => c !== null));
  }
  return seen;
}

function minDepth(root: TreeNode | null): number {
  let depth = 0;
  let frontier: TreeNode[] = root ? [root] : [];
  while (frontier.length > 0) {
    depth++;
    if (frontier.some((node) => !node.left && !node.right)) return depth;
    frontier = frontier.flatMap((node) => [node.left, node.right].filter((c): c is TreeNode => c !== null));
  }
  return depth;
}`,
      cases: [
        { call: "rightSideView(treeFromLevelOrder([1, 2, 3, null, 5, null, 4]))", expected: [1, 3, 4] },
        { call: "minDepth(treeFromLevelOrder([2, null, 3, null, 4, null, 5, null, 6]))", expected: 5 },
        { call: "minDepth(treeFromLevelOrder([3, 9, 20, null, null, 15, 7]))", expected: 2 },
      ],
    },
  ],
  pitfalls: [
    "Using queue.shift() in a loop: O(n) per call in JavaScript. Swap arrays per level or keep a head index.",
    "Reading queue.length inside the loop that's pushing to it, so the level boundary moves. Snapshot it first, or swap arrays.",
  ],
  jsNotes: [
    "A type-guard filter, .filter((c): c is TreeNode => c !== null), is how you drop nulls and keep TypeScript happy.",
  ],
  deepDive: "/learn/trees-graphs",
  prerequisites: ["tree-dfs"],
  problems: [
    {
      slug: "average-of-levels-in-binary-tree",
      title: "Average of Levels in Binary Tree",
      difficulty: "Easy",
      prompt: "Given the root of a binary tree, return the average value of the nodes on each level.",
      tell: "\"Average\" per \"level\": level order with a sum per level.",
    },
    {
      slug: "minimum-depth-of-binary-tree",
      title: "Minimum Depth of Binary Tree",
      difficulty: "Easy",
      prompt: "Return the minimum depth of a binary tree: the number of nodes on the shortest path from the root down to the nearest leaf.",
      tell: "\"Minimum depth\" to the nearest leaf: BFS stops at the first leaf it meets, never exploring deeper branches.",
      alsoAccept: ["tree-dfs"],
    },
    {
      slug: "binary-tree-level-order-traversal",
      title: "Binary Tree Level Order Traversal",
      difficulty: "Medium",
      prompt: "Return the level order traversal of a binary tree's values: left to right, level by level.",
      tell: "\"Level order\" is the pattern's name. The template, nothing more.",
    },
    {
      slug: "binary-tree-right-side-view",
      title: "Binary Tree Right Side View",
      difficulty: "Medium",
      prompt: "Imagine standing on the right side of a binary tree. Return the values of the nodes you can see, top to bottom.",
      tell: "\"Right side view\" is the last node of each level. (DFS visiting right first, recording the first node per depth, also works.)",
      alsoAccept: ["tree-dfs"],
    },
    {
      slug: "binary-tree-zigzag-level-order-traversal",
      title: "Binary Tree Zigzag Level Order Traversal",
      difficulty: "Medium",
      prompt: "Return the zigzag level order traversal: left to right on one level, right to left on the next, alternating.",
      tell: "\"Zigzag level order\": ordinary level order, reversing every other level's values.",
    },
    {
      slug: "maximum-width-of-binary-tree",
      title: "Maximum Width of Binary Tree",
      difficulty: "Medium",
      prompt: "Return the maximum width of any level of the binary tree, counting the null positions between the end nodes.",
      tell: "\"Width\" counting gaps: give each node a heap-style index (2i, 2i + 1) during BFS. Re-base per level so the numbers don't blow up.",
    },
    {
      slug: "populating-next-right-pointers-in-each-node",
      title: "Populating Next Right Pointers in Each Node",
      difficulty: "Medium",
      prompt: "In a perfect binary tree, set each node's next right pointer to the node to its right on the same level, or null.",
      tell: "\"Next right pointer\" on each level: link nodes as you walk a level. The O(1) version uses the already-linked level above.",
    },
    {
      slug: "all-nodes-distance-k-in-binary-tree",
      title: "All Nodes Distance K in Binary Tree",
      difficulty: "Medium",
      prompt: "Given a binary tree, a target node and k, return the values of all nodes at distance k from the target.",
      tell: "\"Distance k\" can go up through parents. Record each node's parent, then BFS k steps out from the target as if it were a graph.",
      alsoAccept: ["graphs"],
    },
  ],
};
