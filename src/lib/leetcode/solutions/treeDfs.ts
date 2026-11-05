import type { Solution } from "../types";

export const treeDfsSolutions: Record<string, Solution> = {
  "maximum-depth-of-binary-tree": {
    approach: [
      "An empty tree has depth 0.",
      "Otherwise the depth is 1 plus the deeper of the two subtrees.",
    ],
    complexity: { time: "O(n)", space: "O(h)" },
    code: `function maxDepth(root: TreeNode | null): number {
  if (!root) return 0;
  return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}`,
    cases: [
      { call: "maxDepth(treeFromLevelOrder([3, 9, 20, null, null, 15, 7]))", expected: 3 },
      { call: "maxDepth(treeFromLevelOrder([1, null, 2]))", expected: 2 },
      { call: "maxDepth(null)", expected: 0 },
    ],
  },

  "invert-binary-tree": {
    approach: [
      "Swap each node's left and right children.",
      "Do the same to both subtrees. The order doesn't matter, as long as every node gets swapped once.",
    ],
    complexity: { time: "O(n)", space: "O(h)" },
    code: `function invertTree(root: TreeNode | null): TreeNode | null {
  if (!root) return null;
  const left = invertTree(root.left);
  root.left = invertTree(root.right);
  root.right = left;
  return root;
}`,
    cases: [
      { call: "levelOrderFromTree(invertTree(treeFromLevelOrder([4, 2, 7, 1, 3, 6, 9])))", expected: [4, 7, 2, 9, 6, 3, 1] },
      { call: "levelOrderFromTree(invertTree(treeFromLevelOrder([2, 1, 3])))", expected: [2, 3, 1] },
    ],
  },

  "same-tree": {
    approach: [
      "Two empty trees are the same. If only one is empty, or the values differ, they aren't.",
      "Otherwise both left subtrees and both right subtrees have to be the same.",
    ],
    complexity: { time: "O(n)", space: "O(h)" },
    code: `function isSameTree(p: TreeNode | null, q: TreeNode | null): boolean {
  if (!p || !q) return p === q;
  return p.val === q.val && isSameTree(p.left, q.left) && isSameTree(p.right, q.right);
}`,
    cases: [
      { call: "isSameTree(treeFromLevelOrder([1, 2, 3]), treeFromLevelOrder([1, 2, 3]))", expected: true },
      { call: "isSameTree(treeFromLevelOrder([1, 2]), treeFromLevelOrder([1, null, 2]))", expected: false },
    ],
  },

  "diameter-of-binary-tree": {
    approach: [
      "The longest path through a node is the height of its left subtree plus the height of its right subtree.",
      "Return the height from a post-order DFS, and update a best-so-far with left + right at every node.",
      "The best value seen anywhere is the diameter, counted in edges.",
    ],
    complexity: { time: "O(n)", space: "O(h)" },
    code: `function diameterOfBinaryTree(root: TreeNode | null): number {
  let best = 0;
  const height = (node: TreeNode | null): number => {
    if (!node) return 0;
    const left = height(node.left);
    const right = height(node.right);
    best = Math.max(best, left + right);
    return 1 + Math.max(left, right);
  };
  height(root);
  return best;
}`,
    cases: [
      { call: "diameterOfBinaryTree(treeFromLevelOrder([1, 2, 3, 4, 5]))", expected: 3 },
      { call: "diameterOfBinaryTree(treeFromLevelOrder([1, 2]))", expected: 1 },
    ],
  },

  "balanced-binary-tree": {
    approach: [
      "Compute heights bottom-up, and use -1 to mean 'unbalanced somewhere below'.",
      "If either subtree is -1, or their heights differ by more than 1, return -1.",
      "Otherwise return the height. The tree is balanced if the root isn't -1. One pass, rather than recomputing heights at every node.",
    ],
    complexity: { time: "O(n)", space: "O(h)" },
    code: `function isBalanced(root: TreeNode | null): boolean {
  const height = (node: TreeNode | null): number => {
    if (!node) return 0;
    const left = height(node.left);
    if (left === -1) return -1;
    const right = height(node.right);
    if (right === -1 || Math.abs(left - right) > 1) return -1;
    return 1 + Math.max(left, right);
  };
  return height(root) !== -1;
}`,
    cases: [
      { call: "isBalanced(treeFromLevelOrder([3, 9, 20, null, null, 15, 7]))", expected: true },
      { call: "isBalanced(treeFromLevelOrder([1, 2, 2, 3, 3, null, null, 4, 4]))", expected: false },
      { call: "isBalanced(null)", expected: true },
    ],
  },

  "subtree-of-another-tree": {
    approach: [
      "Write a same-tree check.",
      "Walk every node of the big tree and check whether the subtree starting there is the same as the small tree.",
      "Any match means yes.",
    ],
    complexity: { time: "O(m · n)", space: "O(h)" },
    code: `function isSubtree(root: TreeNode | null, subRoot: TreeNode | null): boolean {
  const same = (a: TreeNode | null, b: TreeNode | null): boolean => {
    if (!a || !b) return a === b;
    return a.val === b.val && same(a.left, b.left) && same(a.right, b.right);
  };
  if (!root) return subRoot === null;
  return same(root, subRoot) || isSubtree(root.left, subRoot) || isSubtree(root.right, subRoot);
}`,
    cases: [
      { call: "isSubtree(treeFromLevelOrder([3, 4, 5, 1, 2]), treeFromLevelOrder([4, 1, 2]))", expected: true },
      { call: "isSubtree(treeFromLevelOrder([3, 4, 5, 1, 2, null, null, null, null, 0]), treeFromLevelOrder([4, 1, 2]))", expected: false },
    ],
  },

  "path-sum": {
    approach: [
      "Subtract each node's value from the target on the way down.",
      "At a leaf, check whether what's left equals the leaf's value.",
      "Any root-to-leaf path that hits it is enough.",
    ],
    complexity: { time: "O(n)", space: "O(h)" },
    code: `function hasPathSum(root: TreeNode | null, targetSum: number): boolean {
  if (!root) return false;
  if (!root.left && !root.right) return root.val === targetSum;
  const remaining = targetSum - root.val;
  return hasPathSum(root.left, remaining) || hasPathSum(root.right, remaining);
}`,
    cases: [
      { call: "hasPathSum(treeFromLevelOrder([5, 4, 8, 11, null, 13, 4, 7, 2, null, null, null, 1]), 22)", expected: true },
      { call: "hasPathSum(treeFromLevelOrder([1, 2, 3]), 5)", expected: false },
      { call: "hasPathSum(null, 0)", expected: false },
    ],
  },

  "lowest-common-ancestor-of-a-binary-tree": {
    approach: [
      "Search both subtrees for p or q.",
      "If a node is p or q, return it. If both subtrees found something, this node is where the paths split, so it's the answer.",
      "Otherwise pass up whichever side found something.",
    ],
    complexity: { time: "O(n)", space: "O(h)" },
    code: `function lowestCommonAncestor(root: TreeNode | null, p: TreeNode, q: TreeNode): TreeNode | null {
  if (!root || root === p || root === q) return root;
  const left = lowestCommonAncestor(root.left, p, q);
  const right = lowestCommonAncestor(root.right, p, q);
  if (left && right) return root;
  return left ?? right;
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
        call: "(() => { const t = treeFromLevelOrder([3, 5, 1, 6, 2, 0, 8, null, null, 7, 4]); return lowestCommonAncestor(t, findNode(t, 5), findNode(t, 1))?.val; })()",
        expected: 3,
      },
      {
        call: "(() => { const t = treeFromLevelOrder([3, 5, 1, 6, 2, 0, 8, null, null, 7, 4]); return lowestCommonAncestor(t, findNode(t, 5), findNode(t, 4))?.val; })()",
        expected: 5,
      },
    ],
  },

  "construct-binary-tree-from-preorder-and-inorder-traversal": {
    approach: [
      "Preorder's next value is always the root of the subtree being built.",
      "Its position in inorder splits that range into the left and right subtrees. Look positions up in a Map for O(1).",
      "Build the left subtree, then the right, consuming preorder from the front as you go.",
    ],
    complexity: { time: "O(n)", space: "O(n)" },
    code: `function buildTree(preorder: number[], inorder: number[]): TreeNode | null {
  const indexOf = new Map(inorder.map((value, i) => [value, i]));
  let next = 0;
  const build = (low: number, high: number): TreeNode | null => {
    if (low > high) return null;
    const value = preorder[next++];
    const mid = indexOf.get(value) as number;
    const node = new TreeNode(value);
    node.left = build(low, mid - 1);
    node.right = build(mid + 1, high);
    return node;
  };
  return build(0, inorder.length - 1);
}`,
    cases: [
      { call: "levelOrderFromTree(buildTree([3, 9, 20, 15, 7], [9, 3, 15, 20, 7]))", expected: [3, 9, 20, null, null, 15, 7] },
      { call: "levelOrderFromTree(buildTree([-1], [-1]))", expected: [-1] },
    ],
  },

  "count-good-nodes-in-binary-tree": {
    approach: [
      "Carry the largest value seen on the path from the root down.",
      "A node is good when its value is at least that maximum.",
      "Count it if so, update the maximum, and add up the counts from both children.",
    ],
    complexity: { time: "O(n)", space: "O(h)" },
    code: `function goodNodes(root: TreeNode | null): number {
  const count = (node: TreeNode | null, maxSoFar: number): number => {
    if (!node) return 0;
    const good = node.val >= maxSoFar ? 1 : 0;
    const nextMax = Math.max(maxSoFar, node.val);
    return good + count(node.left, nextMax) + count(node.right, nextMax);
  };
  return count(root, -Infinity);
}`,
    cases: [
      { call: "goodNodes(treeFromLevelOrder([3, 1, 4, 3, null, 1, 5]))", expected: 4 },
      { call: "goodNodes(treeFromLevelOrder([3, 3, null, 4, 2]))", expected: 3 },
      { call: "goodNodes(treeFromLevelOrder([1]))", expected: 1 },
    ],
  },

  "binary-tree-maximum-path-sum": {
    approach: [
      "From each node, work out the best downward path: the node plus the better child path, ignoring any child path that's negative.",
      "The best path that bends at a node is node + left gain + right gain. Compare it against the global best.",
      "Return only the one-sided gain upward, because a path can't fork on its way up.",
    ],
    complexity: { time: "O(n)", space: "O(h)" },
    code: `function maxPathSum(root: TreeNode | null): number {
  let best = -Infinity;
  const gain = (node: TreeNode | null): number => {
    if (!node) return 0;
    const left = Math.max(0, gain(node.left));
    const right = Math.max(0, gain(node.right));
    best = Math.max(best, node.val + left + right);
    return node.val + Math.max(left, right);
  };
  gain(root);
  return best;
}`,
    cases: [
      { call: "maxPathSum(treeFromLevelOrder([1, 2, 3]))", expected: 6 },
      { call: "maxPathSum(treeFromLevelOrder([-10, 9, 20, null, null, 15, 7]))", expected: 42 },
      { call: "maxPathSum(treeFromLevelOrder([-3]))", expected: -3 },
    ],
  },

  "serialize-and-deserialize-binary-tree": {
    approach: [
      "Serialise with a preorder walk, writing '#' for every missing child so the shape is unambiguous.",
      "Deserialise by reading the same tokens in the same order.",
      "A '#' is null; anything else makes a node, then builds its left subtree, then its right.",
    ],
    complexity: { time: "O(n)", space: "O(n)" },
    code: `function serialize(root: TreeNode | null): string {
  const out: string[] = [];
  const walk = (node: TreeNode | null) => {
    if (!node) {
      out.push("#");
      return;
    }
    out.push(String(node.val));
    walk(node.left);
    walk(node.right);
  };
  walk(root);
  return out.join(",");
}

function deserialize(data: string): TreeNode | null {
  const tokens = data.split(",");
  let next = 0;
  const build = (): TreeNode | null => {
    const token = tokens[next++];
    if (token === "#") return null;
    const node = new TreeNode(Number(token));
    node.left = build();
    node.right = build();
    return node;
  };
  return build();
}`,
    cases: [
      { call: "levelOrderFromTree(deserialize(serialize(treeFromLevelOrder([1, 2, 3, null, null, 4, 5]))))", expected: [1, 2, 3, null, null, 4, 5] },
      { call: "serialize(null)", expected: "#" },
      { call: "deserialize(serialize(null))", expected: null },
    ],
  },
};
