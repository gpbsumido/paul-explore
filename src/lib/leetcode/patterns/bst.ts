import type { Pattern } from "../types";

export const bst: Pattern = {
  id: "bst",
  name: "Binary Search Trees",
  phase: 2,
  tagline: "Left is smaller, right is bigger: use it to skip half the tree.",
  summary:
    "A binary search tree is binary search turned into a data structure. Everything in the left subtree is smaller than the node and everything in the right is bigger, so a search only goes one way, and an in-order traversal yields values in sorted order. Most BST questions are one of those two facts: walk down one side, or walk in order and treat it as a sorted array.",
  question: "Does the ordering let me skip one subtree, or would sorted order make this easy?",
  signals: [
    { phrase: "binary search tree", why: "The ordering invariant is the tool.", weight: 3 },
    { phrase: "bst", why: "BST means use the left < node < right ordering.", weight: 3 },
    { phrase: "kth smallest", why: "In-order traversal yields sorted order; stop at the kth.", weight: 2 },
    { phrase: "validate", why: "Each node must sit inside bounds inherited from its ancestors." },
    { phrase: "in-order", why: "In-order of a BST is sorted." },
    { phrase: "sorted array to", why: "Build a balanced BST by taking the middle as root.", weight: 2 },
    { phrase: "minimum absolute difference", why: "The closest values are adjacent in in-order." },
    { phrase: "insert", why: "Walk down one side to the empty spot." },
    { phrase: "delete", why: "Replace with the in-order successor when there are two children." },
    { phrase: "iterator", why: "A stack of left spines gives in-order one step at a time." },
  ],
  antiSignals: [
    "The tree has no ordering guarantee: a general binary tree needs full DFS.",
  ],
  complexity: { time: "O(h) per operation, O(n) to traverse", space: "O(h)" },
  template: {
    title: "Validate with bounds passed down",
    explanation:
      "Comparing a node only with its children misses cases like a right grandchild smaller than the root. Instead pass down the allowed range: going left tightens the upper bound, going right tightens the lower.",
    code: `function isValidBST(root: TreeNode | null): boolean {
  function within(node: TreeNode | null, low: number, high: number): boolean {
    if (!node) return true;
    if (node.val <= low || node.val >= high) return false;
    return within(node.left, low, node.val) && within(node.right, node.val, high);
  }
  return within(root, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY);
}`,
    cases: [
      { call: "isValidBST(treeFromLevelOrder([2, 1, 3]))", expected: true },
      { call: "isValidBST(treeFromLevelOrder([5, 1, 4, null, null, 3, 6]))", expected: false },
      { call: "isValidBST(treeFromLevelOrder([5, 4, 6, null, null, 3, 7]))", expected: false },
    ],
  },
  variants: [
    {
      title: "In-order is sorted order",
      explanation: "Kth Smallest: an iterative in-order walk with a stack, counting down k as nodes come off. Stops early instead of visiting the whole tree.",
      code: `function kthSmallest(root: TreeNode | null, k: number): number {
  const stack: TreeNode[] = [];
  let node = root;
  let remaining = k;
  while (node || stack.length > 0) {
    while (node) {
      stack.push(node);
      node = node.left;
    }
    const next = stack.pop() as TreeNode;
    remaining--;
    if (remaining === 0) return next.val;
    node = next.right;
  }
  return -1;
}`,
      cases: [
        { call: "kthSmallest(treeFromLevelOrder([3, 1, 4, null, 2]), 1)", expected: 1 },
        { call: "kthSmallest(treeFromLevelOrder([5, 3, 6, 2, 4, null, null, 1]), 3)", expected: 3 },
      ],
    },
    {
      title: "Walk down one side",
      explanation: "LCA in a BST: if both values are smaller, go left; both bigger, go right; otherwise this node splits them and is the answer. No recursion needed.",
      code: `function lowestCommonAncestorBST(root: TreeNode | null, p: number, q: number): number {
  let node = root;
  while (node) {
    if (p < node.val && q < node.val) node = node.left;
    else if (p > node.val && q > node.val) node = node.right;
    else return node.val;
  }
  return -1;
}`,
      cases: [
        { call: "lowestCommonAncestorBST(treeFromLevelOrder([6, 2, 8, 0, 4, 7, 9, null, null, 3, 5]), 2, 8)", expected: 6 },
        { call: "lowestCommonAncestorBST(treeFromLevelOrder([6, 2, 8, 0, 4, 7, 9, null, null, 3, 5]), 2, 4)", expected: 2 },
      ],
    },
  ],
  pitfalls: [
    "Validating by comparing a node only with its direct children.",
    "Starting bounds at the smallest 32-bit integer when node values can equal it. Infinity sidesteps it.",
    "Forgetting that O(h) is O(n) for a skewed tree. Say balanced or not when you quote complexity.",
  ],
  jsNotes: [
    "Number.NEGATIVE_INFINITY and Number.POSITIVE_INFINITY make clean open bounds; there's no integer overflow to dodge.",
  ],
  prerequisites: ["tree-dfs", "binary-search"],
  problems: [
    {
      slug: "search-in-a-binary-search-tree",
      title: "Search in a Binary Search Tree",
      difficulty: "Easy",
      prompt: "Find the node in a binary search tree whose value equals val and return its subtree, or null.",
      tell: "\"Binary search tree\" search: go left if smaller, right if bigger. Never visit both.",
    },
    {
      slug: "convert-sorted-array-to-binary-search-tree",
      title: "Convert Sorted Array to Binary Search Tree",
      difficulty: "Easy",
      prompt: "Convert a sorted array to a height-balanced binary search tree.",
      tell: "\"Sorted array to\" a balanced BST: the middle element is the root, recurse on each half.",
    },
    {
      slug: "minimum-absolute-difference-in-bst",
      title: "Minimum Absolute Difference in BST",
      difficulty: "Easy",
      prompt: "Return the minimum absolute difference between the values of any two different nodes in a BST.",
      tell: "\"Minimum absolute difference\" in a BST: closest values are neighbours in in-order, so compare each with the previous.",
    },
    {
      slug: "lowest-common-ancestor-of-a-binary-search-tree",
      title: "Lowest Common Ancestor of a Binary Search Tree",
      difficulty: "Medium",
      prompt: "Given a binary search tree and two of its nodes, return their lowest common ancestor.",
      tell: "In a BST the LCA is the first node whose value falls between the two targets. Walk down; no recursion needed.",
    },
    {
      slug: "validate-binary-search-tree",
      title: "Validate Binary Search Tree",
      difficulty: "Medium",
      prompt: "Determine whether a binary tree is a valid binary search tree, with strictly smaller values on the left and strictly bigger on the right, at every depth.",
      tell: "\"Validate\" a BST: pass down the allowed (low, high) range. Comparing only with children is the classic wrong answer.",
    },
    {
      slug: "kth-smallest-element-in-a-bst",
      title: "Kth Smallest Element in a BST",
      difficulty: "Medium",
      prompt: "Return the kth smallest value among all the nodes of a binary search tree.",
      tell: "\"Kth smallest\" in a BST: in-order is sorted, so stop at the kth node.",
    },
    {
      slug: "insert-into-a-binary-search-tree",
      title: "Insert into a Binary Search Tree",
      difficulty: "Medium",
      prompt: "Insert a value into a binary search tree and return the root. The value is not already in the tree.",
      tell: "\"Insert\" into a BST: walk down as if searching, attach at the first empty spot.",
    },
    {
      slug: "delete-node-in-a-bst",
      title: "Delete Node in a BST",
      difficulty: "Medium",
      prompt: "Delete the node with a given key from a BST and return the root, keeping it a valid BST.",
      tell: "\"Delete\" in a BST has three cases: leaf, one child, two children. With two, copy the in-order successor up and delete it from the right subtree.",
    },
    {
      slug: "binary-search-tree-iterator",
      title: "Binary Search Tree Iterator",
      difficulty: "Medium",
      prompt: "Implement an iterator over a BST that returns values in in-order with next and hasNext, using O(h) memory.",
      tell: "\"Iterator\" with O(h) memory: a stack holding the left spine; each next pops one and pushes the left spine of its right child.",
      alsoAccept: ["stack"],
    },
  ],
};
