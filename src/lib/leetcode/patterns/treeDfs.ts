import type { Pattern } from "../types";

export const treeDfs: Pattern = {
  id: "tree-dfs",
  name: "Tree DFS",
  phase: 2,
  tagline: "Trust the recursion: solve it for the children, combine at the parent.",
  summary:
    "Nearly every binary tree question is a recursive function that asks each subtree for something (its height, whether it's balanced, its best path) and combines the two answers at the node. Decide first what the function returns for a subtree, then what it does with its children's answers, then the base case for null. If information flows down instead (a running sum, the max so far on the path), pass it as a parameter. Some questions need both: return one thing upward while updating a global best.",
  question: "If my children already told me their answers, how would I compute mine?",
  signals: [
    { phrase: "binary tree", why: "The default tool for a binary tree is a recursive DFS.", weight: 1 },
    { phrase: "root of a binary tree", why: "LeetCode's opener for a tree question; start from the recursion.", weight: 1 },
    { phrase: "depth", why: "Depth is 1 + max of the children's depths." },
    { phrase: "height", why: "Height comes back up from the children." },
    { phrase: "diameter", why: "Return height upward, update a global best with left + right.", weight: 2 },
    { phrase: "path sum", why: "Pass the remaining sum down; check at the leaves.", weight: 2 },
    { phrase: "root-to-leaf", why: "Root-to-leaf paths carry state down the recursion." },
    { phrase: "balanced", why: "Return height, or a sentinel when a subtree is already unbalanced." },
    { phrase: "invert", why: "Swap children, recurse on both." },
    { phrase: "same tree", why: "Compare node values and recurse on matching children.", weight: 2 },
    { phrase: "subtree", why: "Subtree checks run same-tree at every node." },
    { phrase: "lowest common ancestor", why: "Return whichever target a subtree found; the node where both sides report is the LCA.", weight: 2 },
    { phrase: "preorder and inorder", why: "Preorder gives the root, inorder splits left from right.", weight: 2 },
    { phrase: "maximum path sum", why: "Return the best single-branch gain, update a global with both branches.", weight: 2 },
    { phrase: "serialize", why: "Preorder with null markers round-trips a tree." },
    { phrase: "good nodes", why: "Pass the max seen on the path down." },
  ],
  antiSignals: [
    "The answer is per level or about the shortest distance from the root: BFS is more natural.",
    "The tree is a binary search tree and the question uses ordering: use the BST property to skip subtrees.",
  ],
  complexity: { time: "O(n)", space: "O(h) call stack, where h is the height" },
  template: {
    title: "Return up, combine at the node",
    explanation:
      "Each call returns its subtree's height. The node combines its children's heights into its own height (returned) and into a candidate diameter (left + right edges through this node), kept in a variable the recursion closes over.",
    code: `function diameterOfBinaryTree(root: TreeNode | null): number {
  let best = 0;
  function height(node: TreeNode | null): number {
    if (!node) return 0;
    const left = height(node.left);
    const right = height(node.right);
    best = Math.max(best, left + right);
    return 1 + Math.max(left, right);
  }
  height(root);
  return best;
}`,
    cases: [
      { call: "diameterOfBinaryTree(treeFromLevelOrder([1, 2, 3, 4, 5]))", expected: 3 },
      { call: "diameterOfBinaryTree(treeFromLevelOrder([1, 2]))", expected: 1 },
    ],
  },
  variants: [
    {
      title: "Pass state down",
      explanation: "Path Sum: the remaining target travels down. A leaf answers the question; every other node delegates to its children.",
      code: `function hasPathSum(root: TreeNode | null, targetSum: number): boolean {
  if (!root) return false;
  const remaining = targetSum - root.val;
  if (!root.left && !root.right) return remaining === 0;
  return hasPathSum(root.left, remaining) || hasPathSum(root.right, remaining);
}`,
      cases: [
        { call: "hasPathSum(treeFromLevelOrder([5, 4, 8, 11, null, 13, 4, 7, 2, null, null, null, 1]), 22)", expected: true },
        { call: "hasPathSum(treeFromLevelOrder([1, 2, 3]), 5)", expected: false },
      ],
    },
    {
      title: "Report what you found upward",
      explanation:
        "Lowest Common Ancestor: a subtree returns p or q if it contains one, else null. The first node where both sides return something is the answer; otherwise pass up whichever side found one.",
      code: `function lowestCommonAncestor(root: TreeNode | null, p: number, q: number): TreeNode | null {
  if (!root || root.val === p || root.val === q) return root;
  const left = lowestCommonAncestor(root.left, p, q);
  const right = lowestCommonAncestor(root.right, p, q);
  if (left && right) return root;
  return left ?? right;
}`,
      cases: [
        { call: "lowestCommonAncestor(treeFromLevelOrder([3, 5, 1, 6, 2, 0, 8, null, null, 7, 4]), 5, 1)?.val", expected: 3 },
        { call: "lowestCommonAncestor(treeFromLevelOrder([3, 5, 1, 6, 2, 0, 8, null, null, 7, 4]), 5, 4)?.val", expected: 5 },
      ],
    },
  ],
  pitfalls: [
    "Treating a node with one child as a leaf. A leaf has neither child; Minimum Depth and Path Sum both fail on this.",
    "Mixing what the function returns with what the question asks for. In Diameter and Max Path Sum they differ, which is why a separate best variable exists.",
    "Deep, skewed trees can overflow the call stack around ten thousand levels. Mention an iterative stack if the constraints allow 10^5 nodes in a line.",
  ],
  jsNotes: [
    "A nested function closing over a let best is the idiomatic way to keep a global answer without a class field.",
    "LeetCode passes TreeNode | null; returning early on !node narrows the type for the rest of the function.",
  ],
  deepDive: "/learn/trees-graphs",
  prerequisites: ["stack"],
  problems: [
    {
      slug: "maximum-depth-of-binary-tree",
      title: "Maximum Depth of Binary Tree",
      difficulty: "Easy",
      prompt: "Given the root of a binary tree, return its maximum depth: the number of nodes on the longest root-to-leaf path.",
      tell: "\"Depth\" is 1 + max(left, right). The one-line recursion every other tree question builds on.",
    },
    {
      slug: "invert-binary-tree",
      title: "Invert Binary Tree",
      difficulty: "Easy",
      prompt: "Given the root of a binary tree, invert it so it becomes its mirror image, and return the root.",
      tell: "\"Invert\": swap the two children, recurse into both. Pre-order or post-order both work.",
    },
    {
      slug: "same-tree",
      title: "Same Tree",
      difficulty: "Easy",
      prompt: "Given the roots of two binary trees, check whether they are the same tree: identical structure and node values.",
      tell: "\"Same tree\": both null is true, one null is false, otherwise values match and both pairs of children match.",
    },
    {
      slug: "diameter-of-binary-tree",
      title: "Diameter of Binary Tree",
      difficulty: "Easy",
      prompt: "Return the diameter of a binary tree: the number of edges on the longest path between any two nodes, which may not pass through the root.",
      tell: "\"Diameter\": return height upward, update a global best with left + right at every node.",
    },
    {
      slug: "balanced-binary-tree",
      title: "Balanced Binary Tree",
      difficulty: "Easy",
      prompt: "Determine whether a binary tree is height-balanced: at every node the subtree heights differ by at most one.",
      tell: "\"Balanced\" needs heights from below: return -1 as soon as any subtree is unbalanced, so it stays O(n).",
    },
    {
      slug: "subtree-of-another-tree",
      title: "Subtree of Another Tree",
      difficulty: "Easy",
      prompt: "Given two binary trees, return true if the second appears as a subtree of the first, with the same structure and values.",
      tell: "\"Subtree\": run same-tree from every node of the big tree. O(m × n), and say so.",
    },
    {
      slug: "path-sum",
      title: "Path Sum",
      difficulty: "Easy",
      prompt: "Return true if the binary tree has a root-to-leaf path whose values add up to targetSum.",
      tell: "\"Root-to-leaf\" \"path sum\": pass the remaining target down, check it at leaves.",
    },
    {
      slug: "lowest-common-ancestor-of-a-binary-tree",
      title: "Lowest Common Ancestor of a Binary Tree",
      difficulty: "Medium",
      prompt: "Given a binary tree and two of its nodes p and q, return their lowest common ancestor.",
      tell: "\"Lowest common ancestor\" in a general tree: each subtree reports whether it found p or q; the node where both sides report is the answer.",
    },
    {
      slug: "construct-binary-tree-from-preorder-and-inorder-traversal",
      title: "Construct Binary Tree from Preorder and Inorder Traversal",
      difficulty: "Medium",
      prompt: "Build the binary tree from its preorder and inorder traversal arrays. Values are unique.",
      tell: "\"Preorder and inorder\": preorder's next value is the root, its position in inorder splits the left and right subtrees. A Map of inorder indices makes it O(n).",
    },
    {
      slug: "count-good-nodes-in-binary-tree",
      title: "Count Good Nodes in Binary Tree",
      difficulty: "Medium",
      prompt: "A node is good if no node on the path from the root to it has a greater value. Count the good nodes in the binary tree.",
      tell: "\"Good nodes\" depend on the path above: pass the running max down as a parameter.",
    },
    {
      slug: "binary-tree-maximum-path-sum",
      title: "Binary Tree Maximum Path Sum",
      difficulty: "Hard",
      prompt: "A path can start and end at any nodes in the binary tree. Return the maximum path sum of any non-empty path.",
      tell: "\"Maximum path sum\": return the best one-sided gain (clamped at 0) upward, and update a global with node + left gain + right gain.",
    },
    {
      slug: "serialize-and-deserialize-binary-tree",
      title: "Serialize and Deserialize Binary Tree",
      difficulty: "Hard",
      prompt: "Design functions to serialize a binary tree to a string and deserialize that string back into the same tree.",
      tell: "\"Serialize\": preorder with a marker for null is enough to rebuild. Deserialize by consuming tokens in the same order.",
      alsoAccept: ["tree-bfs"],
    },
  ],
};
