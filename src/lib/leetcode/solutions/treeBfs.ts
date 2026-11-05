import type { Solution } from "../types";

export const treeBfsSolutions: Record<string, Solution> = {
  "average-of-levels-in-binary-tree": {
    approach: [
      "Go level by level, starting with just the root.",
      "Average the values on the current level, then build the next level from their children.",
    ],
    complexity: { time: "O(n)", space: "O(w)" },
    code: `function averageOfLevels(root: TreeNode | null): number[] {
  const averages: number[] = [];
  let level = root ? [root] : [];
  while (level.length > 0) {
    averages.push(level.reduce((sum, node) => sum + node.val, 0) / level.length);
    level = level.flatMap((node) => [node.left, node.right]).filter((n): n is TreeNode => n !== null);
  }
  return averages;
}`,
    cases: [
      { call: "averageOfLevels(treeFromLevelOrder([3, 9, 20, null, null, 15, 7]))", expected: [3, 14.5, 11] },
      { call: "averageOfLevels(treeFromLevelOrder([3, 9, 20, 15, 7]))", expected: [3, 14.5, 11] },
    ],
  },

  "minimum-depth-of-binary-tree": {
    approach: [
      "BFS reaches the shallowest leaf first, so stop at the first leaf found.",
      "Go level by level, counting depth.",
      "The first node with no children ends the search.",
    ],
    complexity: { time: "O(n)", space: "O(w)" },
    code: `function minDepth(root: TreeNode | null): number {
  if (!root) return 0;
  let level = [root];
  let depth = 1;
  while (level.length > 0) {
    const next: TreeNode[] = [];
    for (const node of level) {
      if (!node.left && !node.right) return depth;
      if (node.left) next.push(node.left);
      if (node.right) next.push(node.right);
    }
    level = next;
    depth++;
  }
  return depth;
}`,
    cases: [
      { call: "minDepth(treeFromLevelOrder([3, 9, 20, null, null, 15, 7]))", expected: 2 },
      { call: "minDepth(treeFromLevelOrder([2, null, 3, null, 4, null, 5, null, 6]))", expected: 5 },
      { call: "minDepth(null)", expected: 0 },
    ],
  },

  "binary-tree-level-order-traversal": {
    approach: [
      "Start with a level holding only the root.",
      "Record the level's values, then replace the level with all of its children, left to right.",
      "Stop when a level is empty.",
    ],
    complexity: { time: "O(n)", space: "O(w)" },
    code: `function levelOrder(root: TreeNode | null): number[][] {
  const result: number[][] = [];
  let level = root ? [root] : [];
  while (level.length > 0) {
    result.push(level.map((node) => node.val));
    const next: TreeNode[] = [];
    for (const node of level) {
      if (node.left) next.push(node.left);
      if (node.right) next.push(node.right);
    }
    level = next;
  }
  return result;
}`,
    cases: [
      { call: "levelOrder(treeFromLevelOrder([3, 9, 20, null, null, 15, 7]))", expected: [[3], [9, 20], [15, 7]] },
      { call: "levelOrder(treeFromLevelOrder([1]))", expected: [[1]] },
      { call: "levelOrder(null)", expected: [] },
    ],
  },

  "binary-tree-right-side-view": {
    approach: [
      "Go level by level.",
      "The node seen from the right is the last one on each level.",
    ],
    complexity: { time: "O(n)", space: "O(w)" },
    code: `function rightSideView(root: TreeNode | null): number[] {
  const view: number[] = [];
  let level = root ? [root] : [];
  while (level.length > 0) {
    view.push(level[level.length - 1].val);
    const next: TreeNode[] = [];
    for (const node of level) {
      if (node.left) next.push(node.left);
      if (node.right) next.push(node.right);
    }
    level = next;
  }
  return view;
}`,
    cases: [
      { call: "rightSideView(treeFromLevelOrder([1, 2, 3, null, 5, null, 4]))", expected: [1, 3, 4] },
      { call: "rightSideView(treeFromLevelOrder([1, 2, 3, 4, null, null, null, 5]))", expected: [1, 3, 4, 5] },
      { call: "rightSideView(null)", expected: [] },
    ],
  },

  "binary-tree-zigzag-level-order-traversal": {
    approach: [
      "Do a normal level-order traversal.",
      "Reverse the values of every other level before recording them.",
      "Keep the queue itself in normal order, so the children stay correct.",
    ],
    complexity: { time: "O(n)", space: "O(w)" },
    code: `function zigzagLevelOrder(root: TreeNode | null): number[][] {
  const result: number[][] = [];
  let level = root ? [root] : [];
  let leftToRight = true;
  while (level.length > 0) {
    const values = level.map((node) => node.val);
    result.push(leftToRight ? values : values.reverse());
    leftToRight = !leftToRight;
    const next: TreeNode[] = [];
    for (const node of level) {
      if (node.left) next.push(node.left);
      if (node.right) next.push(node.right);
    }
    level = next;
  }
  return result;
}`,
    cases: [
      { call: "zigzagLevelOrder(treeFromLevelOrder([3, 9, 20, null, null, 15, 7]))", expected: [[3], [20, 9], [15, 7]] },
      { call: "zigzagLevelOrder(treeFromLevelOrder([1, 2, 3, 4, null, null, 5]))", expected: [[1], [3, 2], [4, 5]] },
    ],
  },

  "maximum-width-of-binary-tree": {
    approach: [
      "Number the nodes like a heap: the children of i are 2i and 2i + 1.",
      "A level's width is the last index minus the first, plus one.",
      "The indices double every level, so re-base them against the first index on each level to keep them small.",
    ],
    complexity: { time: "O(n)", space: "O(w)" },
    code: `function widthOfBinaryTree(root: TreeNode | null): number {
  if (!root) return 0;
  let level: [TreeNode, number][] = [[root, 0]];
  let best = 0;
  while (level.length > 0) {
    const first = level[0][1];
    best = Math.max(best, level[level.length - 1][1] - first + 1);
    const next: [TreeNode, number][] = [];
    for (const [node, index] of level) {
      const i = index - first;
      if (node.left) next.push([node.left, 2 * i]);
      if (node.right) next.push([node.right, 2 * i + 1]);
    }
    level = next;
  }
  return best;
}`,
    cases: [
      { call: "widthOfBinaryTree(treeFromLevelOrder([1, 3, 2, 5, 3, null, 9]))", expected: 4 },
      { call: "widthOfBinaryTree(treeFromLevelOrder([1, 3, 2, 5, null, null, 9, 6, null, 7]))", expected: 7 },
      { call: "widthOfBinaryTree(treeFromLevelOrder([1, 3, 2, 5]))", expected: 2 },
    ],
  },

  "populating-next-right-pointers-in-each-node": {
    approach: [
      "The tree is perfect, so the level below can be wired from the level above without a queue.",
      "For each node on a level, point its left child at its right child.",
      "Point its right child at the left child of the node's next neighbour. Then drop down to the leftmost node of the next level.",
    ],
    complexity: { time: "O(n)", space: "O(1)" },
    code: `class _Node {
  val: number;
  left: _Node | null = null;
  right: _Node | null = null;
  next: _Node | null = null;
  constructor(val: number) {
    this.val = val;
  }
}

function connect(root: _Node | null): _Node | null {
  for (let leftmost = root; leftmost && leftmost.left; leftmost = leftmost.left) {
    for (let node: _Node | null = leftmost; node; node = node.next) {
      (node.left as _Node).next = node.right;
      if (node.next) (node.right as _Node).next = node.next.left;
    }
  }
  return root;
}

function perfectTree(values: number[]): _Node | null {
  const nodes = values.map((v) => new _Node(v));
  nodes.forEach((node, i) => {
    node.left = nodes[2 * i + 1] ?? null;
    node.right = nodes[2 * i + 2] ?? null;
  });
  return nodes[0] ?? null;
}

function readByNext(root: _Node | null): (number | string)[] {
  const out: (number | string)[] = [];
  for (let leftmost = root; leftmost; leftmost = leftmost.left) {
    for (let node: _Node | null = leftmost; node; node = node.next) out.push(node.val);
    out.push("#");
  }
  return out;
}`,
    cases: [
      { call: "readByNext(connect(perfectTree([1, 2, 3, 4, 5, 6, 7])))", expected: [1, "#", 2, 3, "#", 4, 5, 6, 7, "#"] },
      { call: "readByNext(connect(perfectTree([])))", expected: [] },
    ],
  },

  "all-nodes-distance-k-in-binary-tree": {
    approach: [
      "A tree only points down, but distance goes up too, so first record each node's parent.",
      "Now it's a graph. BFS out from the target along left, right and parent edges, marking nodes as seen.",
      "After k rounds, the nodes in the frontier are the answer.",
    ],
    complexity: { time: "O(n)", space: "O(n)" },
    code: `function distanceK(root: TreeNode | null, target: TreeNode, k: number): number[] {
  const parent = new Map<TreeNode, TreeNode | null>();
  const stack: [TreeNode | null, TreeNode | null][] = [[root, null]];
  while (stack.length > 0) {
    const [node, from] = stack.pop() as [TreeNode | null, TreeNode | null];
    if (!node) continue;
    parent.set(node, from);
    stack.push([node.left, node], [node.right, node]);
  }
  const seen = new Set<TreeNode>([target]);
  let frontier = [target];
  for (let step = 0; step < k; step++) {
    const next: TreeNode[] = [];
    for (const node of frontier) {
      for (const neighbour of [node.left, node.right, parent.get(node) ?? null]) {
        if (neighbour && !seen.has(neighbour)) {
          seen.add(neighbour);
          next.push(neighbour);
        }
      }
    }
    frontier = next;
  }
  return frontier.map((node) => node.val);
}

function findNode(root: TreeNode | null, val: number): TreeNode {
  const stack = [root];
  while (stack.length > 0) {
    const node = stack.pop();
    if (!node) continue;
    if (node.val === val) return node;
    stack.push(node.left, node.right);
  }
  throw new Error("no node with value " + val);
}`,
    cases: [
      {
        call: "(() => { const t = treeFromLevelOrder([3, 5, 1, 6, 2, 0, 8, null, null, 7, 4]); return distanceK(t, findNode(t, 5), 2).sort((a, b) => a - b); })()",
        expected: [1, 4, 7],
      },
      { call: "(() => { const t = treeFromLevelOrder([1]); return distanceK(t, findNode(t, 1), 3); })()", expected: [] },
    ],
  },
};
