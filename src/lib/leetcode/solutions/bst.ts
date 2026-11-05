import type { Solution } from "../types";

export const bstSolutions: Record<string, Solution> = {
  "search-in-a-binary-search-tree": {
    approach: [
      "In a BST, everything smaller sits on the left and everything larger on the right.",
      "From the root, go left or right depending on how the value compares, until it's found or the path runs out.",
    ],
    complexity: { time: "O(h)", space: "O(1)" },
    code: `function searchBST(root: TreeNode | null, val: number): TreeNode | null {
  let node = root;
  while (node && node.val !== val) node = val < node.val ? node.left : node.right;
  return node;
}`,
    cases: [
      { call: "levelOrderFromTree(searchBST(treeFromLevelOrder([4, 2, 7, 1, 3]), 2))", expected: [2, 1, 3] },
      { call: "searchBST(treeFromLevelOrder([4, 2, 7, 1, 3]), 5)", expected: null },
    ],
  },

  "convert-sorted-array-to-binary-search-tree": {
    approach: [
      "The middle element becomes the root, so both sides have the same number of elements, give or take one.",
      "Build the left subtree from the left half and the right subtree from the right half, the same way.",
    ],
    complexity: { time: "O(n)", space: "O(log n)" },
    code: `function sortedArrayToBST(nums: number[]): TreeNode | null {
  const build = (low: number, high: number): TreeNode | null => {
    if (low > high) return null;
    const mid = (low + high) >> 1;
    return new TreeNode(nums[mid], build(low, mid - 1), build(mid + 1, high));
  };
  return build(0, nums.length - 1);
}`,
    cases: [
      { call: "levelOrderFromTree(sortedArrayToBST([-10, -3, 0, 5, 9]))", expected: [0, -10, 5, null, -3, null, 9] },
      { call: "levelOrderFromTree(sortedArrayToBST([1, 3]))", expected: [1, null, 3] },
    ],
  },

  "minimum-absolute-difference-in-bst": {
    approach: [
      "An in-order walk of a BST visits values in sorted order.",
      "In a sorted list, the closest pair is always two neighbours.",
      "Walk in order, compare each value with the previous one, and keep the smallest gap.",
    ],
    complexity: { time: "O(n)", space: "O(h)" },
    code: `function getMinimumDifference(root: TreeNode | null): number {
  let previous: number | null = null;
  let best = Infinity;
  const walk = (node: TreeNode | null) => {
    if (!node) return;
    walk(node.left);
    if (previous !== null) best = Math.min(best, node.val - previous);
    previous = node.val;
    walk(node.right);
  };
  walk(root);
  return best;
}`,
    cases: [
      { call: "getMinimumDifference(treeFromLevelOrder([4, 2, 6, 1, 3]))", expected: 1 },
      { call: "getMinimumDifference(treeFromLevelOrder([1, 0, 48, null, null, 12, 49]))", expected: 1 },
    ],
  },

  "lowest-common-ancestor-of-a-binary-search-tree": {
    approach: [
      "If p and q are both smaller than the node, the answer is in the left subtree. If both are larger, it's in the right.",
      "Otherwise they split here, or one of them is this node, so this node is the answer.",
    ],
    complexity: { time: "O(h)", space: "O(1)" },
    code: `function lowestCommonAncestor(root: TreeNode | null, p: TreeNode, q: TreeNode): TreeNode | null {
  let node = root;
  while (node) {
    if (p.val < node.val && q.val < node.val) node = node.left;
    else if (p.val > node.val && q.val > node.val) node = node.right;
    else return node;
  }
  return null;
}`,
    cases: [
      {
        call: "lowestCommonAncestor(treeFromLevelOrder([6, 2, 8, 0, 4, 7, 9, null, null, 3, 5]), new TreeNode(2), new TreeNode(8))?.val",
        expected: 6,
      },
      {
        call: "lowestCommonAncestor(treeFromLevelOrder([6, 2, 8, 0, 4, 7, 9, null, null, 3, 5]), new TreeNode(2), new TreeNode(4))?.val",
        expected: 2,
      },
    ],
  },

  "validate-binary-search-tree": {
    approach: [
      "Checking each node against only its children isn't enough. Every node has to fit within bounds set by all its ancestors.",
      "Pass down a (low, high) range. Going left caps high at the node's value; going right raises low to it.",
      "Any value outside its range, including equal to a bound, makes it invalid.",
    ],
    complexity: { time: "O(n)", space: "O(h)" },
    code: `function isValidBST(root: TreeNode | null): boolean {
  const valid = (node: TreeNode | null, low: number, high: number): boolean => {
    if (!node) return true;
    if (node.val <= low || node.val >= high) return false;
    return valid(node.left, low, node.val) && valid(node.right, node.val, high);
  };
  return valid(root, -Infinity, Infinity);
}`,
    cases: [
      { call: "isValidBST(treeFromLevelOrder([2, 1, 3]))", expected: true },
      { call: "isValidBST(treeFromLevelOrder([5, 1, 4, null, null, 3, 6]))", expected: false },
      { call: "isValidBST(treeFromLevelOrder([5, 4, 6, null, null, 3, 7]))", expected: false },
    ],
  },

  "kth-smallest-element-in-a-bst": {
    approach: [
      "An in-order walk visits values smallest first.",
      "Walk iteratively with a stack, counting nodes as they're visited.",
      "The k-th node visited is the answer, and the walk stops there.",
    ],
    complexity: { time: "O(h + k)", space: "O(h)" },
    code: `function kthSmallest(root: TreeNode | null, k: number): number {
  const stack: TreeNode[] = [];
  let node = root;
  let count = 0;
  while (node || stack.length > 0) {
    while (node) {
      stack.push(node);
      node = node.left;
    }
    const current = stack.pop() as TreeNode;
    if (++count === k) return current.val;
    node = current.right;
  }
  return -1;
}`,
    cases: [
      { call: "kthSmallest(treeFromLevelOrder([3, 1, 4, null, 2]), 1)", expected: 1 },
      { call: "kthSmallest(treeFromLevelOrder([5, 3, 6, 2, 4, null, null, 1]), 3)", expected: 3 },
    ],
  },

  "insert-into-a-binary-search-tree": {
    approach: [
      "Walk down as if searching for the value.",
      "When the step you'd take leads to null, attach the new node there.",
      "An empty tree just becomes the new node.",
    ],
    complexity: { time: "O(h)", space: "O(1)" },
    code: `function insertIntoBST(root: TreeNode | null, val: number): TreeNode | null {
  const fresh = new TreeNode(val);
  if (!root) return fresh;
  let node = root;
  while (true) {
    if (val < node.val) {
      if (!node.left) {
        node.left = fresh;
        return root;
      }
      node = node.left;
    } else {
      if (!node.right) {
        node.right = fresh;
        return root;
      }
      node = node.right;
    }
  }
}`,
    cases: [
      { call: "levelOrderFromTree(insertIntoBST(treeFromLevelOrder([4, 2, 7, 1, 3]), 5))", expected: [4, 2, 7, 1, 3, 5] },
      { call: "levelOrderFromTree(insertIntoBST(null, 1))", expected: [1] },
    ],
  },

  "delete-node-in-a-bst": {
    approach: [
      "Search for the key, recursing left or right.",
      "If the node has one child or none, replace it with that child.",
      "With two children, copy in its in-order successor (the smallest value in the right subtree), then delete that successor from the right subtree.",
    ],
    complexity: { time: "O(h)", space: "O(h)" },
    code: `function deleteNode(root: TreeNode | null, key: number): TreeNode | null {
  if (!root) return null;
  if (key < root.val) root.left = deleteNode(root.left, key);
  else if (key > root.val) root.right = deleteNode(root.right, key);
  else {
    if (!root.left) return root.right;
    if (!root.right) return root.left;
    let successor = root.right;
    while (successor.left) successor = successor.left;
    root.val = successor.val;
    root.right = deleteNode(root.right, successor.val);
  }
  return root;
}`,
    cases: [
      { call: "levelOrderFromTree(deleteNode(treeFromLevelOrder([5, 3, 6, 2, 4, null, 7]), 3))", expected: [5, 4, 6, 2, null, null, 7] },
      { call: "levelOrderFromTree(deleteNode(treeFromLevelOrder([5, 3, 6, 2, 4, null, 7]), 0))", expected: [5, 3, 6, 2, 4, null, 7] },
      { call: "deleteNode(null, 0)", expected: null },
    ],
  },

  "binary-search-tree-iterator": {
    approach: [
      "Run an in-order walk one step at a time, keeping the pending path on a stack.",
      "Start by pushing the root and every left child under it.",
      "next pops the top, then pushes the left spine of its right subtree. hasNext is whether the stack is empty. Memory is O(h).",
    ],
    complexity: { time: "O(1) amortised", space: "O(h)" },
    code: `class BSTIterator {
  private stack: TreeNode[] = [];
  constructor(root: TreeNode | null) {
    this.pushLeft(root);
  }
  next(): number {
    const node = this.stack.pop() as TreeNode;
    this.pushLeft(node.right);
    return node.val;
  }
  hasNext(): boolean {
    return this.stack.length > 0;
  }
  private pushLeft(node: TreeNode | null): void {
    for (let n = node; n; n = n.left) this.stack.push(n);
  }
}`,
    cases: [
      {
        call: "(() => { const it = new BSTIterator(treeFromLevelOrder([7, 3, 15, null, null, 9, 20])); const out: (number | boolean)[] = []; out.push(it.next(), it.next(), it.hasNext(), it.next(), it.hasNext(), it.next(), it.hasNext(), it.next(), it.hasNext()); return out; })()",
        expected: [3, 7, true, 9, true, 15, true, 20, false],
      },
      { call: "new BSTIterator(null).hasNext()", expected: false },
    ],
  },
};
