import type { Pattern } from "../types";

export const linkedList: Pattern = {
  id: "linked-list",
  name: "Linked Lists",
  phase: 2,
  tagline: "Draw the arrows, then rewire them in the right order.",
  summary:
    "Linked-list questions are pointer bookkeeping, and they repeat a handful of moves: a dummy head so the first node isn't a special case, reversing by walking prev/current/next, fast and slow pointers to find the middle or a cycle, and a gap of n between two pointers to find the nth from the end. Most medium list questions are two of those moves glued together.",
  question: "Which of the four moves (dummy head, reverse, fast/slow, gap of n) does this need, and in what order?",
  signals: [
    { phrase: "linked list", why: "The data structure is the hint: reach for the standard pointer moves.", weight: 2 },
    { phrase: "cycle", why: "Floyd's fast and slow pointers meet inside a cycle.", weight: 2 },
    { phrase: "middle", why: "When fast reaches the end, slow is at the middle." },
    { phrase: "nth node from the end", why: "Start a second pointer n steps behind the first.", weight: 2 },
    { phrase: "reverse", why: "Reversal walks prev, current, next." },
    { phrase: "head of", why: "\"Given the head of\" is how LeetCode introduces a list." },
    { phrase: "reorder", why: "Reorder List: find the middle, reverse the back half, weave." },
    { phrase: "merge two sorted lists", why: "A dummy head and a tail pointer.", weight: 2 },
    { phrase: "random pointer", why: "Deep copy with a map from old node to new node.", weight: 2 },
    { phrase: "least recently used", why: "LRU cache is a hash map plus a doubly linked list.", weight: 2 },
    { phrase: "k-group", why: "Reverse in chunks of k, reconnecting the ends." },
    { phrase: "digits are stored in reverse order", why: "Add Two Numbers: walk both lists with a carry.", weight: 2 },
    { phrase: "without modifying the array", why: "Find the Duplicate Number treats values as next pointers and runs Floyd." },
  ],
  antiSignals: [
    "You need random access by index: copy to an array first if the question allows extra space, then think in array patterns.",
  ],
  complexity: { time: "O(n)", space: "O(1) for the pointer moves" },
  template: {
    title: "Reverse in place",
    explanation:
      "Save next before you overwrite current.next, point current back at prev, then step both forward. When current falls off the end, prev is the new head. This loop is a building block in a third of all list questions.",
    code: `function reverseList(head: ListNode | null): ListNode | null {
  let prev: ListNode | null = null;
  let current = head;
  while (current) {
    const next: ListNode | null = current.next;
    current.next = prev;
    prev = current;
    current = next;
  }
  return prev;
}`,
    cases: [
      { call: "arrayFromList(reverseList(listFromArray([1, 2, 3, 4, 5])))", expected: [5, 4, 3, 2, 1] },
      { call: "reverseList(null)", expected: null },
    ],
  },
  variants: [
    {
      title: "Fast and slow pointers",
      explanation:
        "Fast moves two, slow moves one. If there's a cycle they must meet; if fast reaches null there isn't. Stop at fast.next being null instead and slow sits at the middle.",
      code: `function hasCycle(head: ListNode | null): boolean {
  let slow = head;
  let fast = head;
  while (fast && fast.next) {
    slow = (slow as ListNode).next;
    fast = fast.next.next;
    if (slow === fast) return true;
  }
  return false;
}

function middleNode(head: ListNode | null): ListNode | null {
  let slow = head;
  let fast = head;
  while (fast && fast.next) {
    slow = (slow as ListNode).next;
    fast = fast.next.next;
  }
  return slow;
}`,
      cases: [
        { call: "(() => { const h = listFromArray([3, 2, 0, -4]) as ListNode; let t = h; while (t.next) t = t.next; t.next = h.next; return hasCycle(h); })()", expected: true },
        { call: "hasCycle(listFromArray([1, 2]))", expected: false },
        { call: "arrayFromList(middleNode(listFromArray([1, 2, 3, 4, 5])))", expected: [3, 4, 5] },
      ],
    },
    {
      title: "Dummy head",
      explanation:
        "Merge Two Sorted Lists: a dummy node in front means the tail always has somewhere to attach, so there's no special case for the first node. Return dummy.next.",
      code: `function mergeTwoLists(a: ListNode | null, b: ListNode | null): ListNode | null {
  const dummy = new ListNode();
  let tail = dummy;
  while (a && b) {
    if (a.val <= b.val) {
      tail.next = a;
      a = a.next;
    } else {
      tail.next = b;
      b = b.next;
    }
    tail = tail.next;
  }
  tail.next = a ?? b;
  return dummy.next;
}`,
      cases: [
        { call: "arrayFromList(mergeTwoLists(listFromArray([1, 2, 4]), listFromArray([1, 3, 4])))", expected: [1, 1, 2, 3, 4, 4] },
        { call: "mergeTwoLists(null, null)", expected: null },
      ],
    },
  ],
  pitfalls: [
    "Overwriting current.next before saving it, which loses the rest of the list.",
    "Checking fast.next.next without checking fast.next first, which crashes on even-length lists.",
    "Forgetting to cut the last node's next when splitting a list, which leaves a cycle behind.",
  ],
  jsNotes: [
    "LeetCode types every pointer as ListNode | null. A local const next: ListNode | null avoids TypeScript widening errors inside the loop.",
    "Nodes are objects, so === compares identity. That's exactly what cycle detection needs.",
  ],
  prerequisites: ["two-pointers"],
  problems: [
    {
      slug: "reverse-linked-list",
      title: "Reverse Linked List",
      difficulty: "Easy",
      prompt: "Given the head of a singly linked list, reverse the list and return the new head.",
      tell: "\"Reverse\" a \"linked list\": prev, current, next. Do it both iteratively and recursively.",
    },
    {
      slug: "merge-two-sorted-lists",
      title: "Merge Two Sorted Lists",
      difficulty: "Easy",
      prompt: "Merge two sorted lists into one sorted linked list by splicing their nodes together, and return its head.",
      tell: "\"Merge two sorted lists\": a dummy head and a tail pointer that always takes the smaller node.",
    },
    {
      slug: "linked-list-cycle",
      title: "Linked List Cycle",
      difficulty: "Easy",
      prompt: "Given the head of a linked list, determine whether it has a cycle, using O(1) memory.",
      tell: "\"Cycle\" with \"O(1) memory\" rules out a visited Set. Fast and slow pointers.",
    },
    {
      slug: "middle-of-the-linked-list",
      title: "Middle of the Linked List",
      difficulty: "Easy",
      prompt: "Given the head of a singly linked list, return the middle node. With two middles, return the second.",
      tell: "\"Middle\" of a list in one pass: when fast reaches the end, slow is halfway.",
    },
    {
      slug: "palindrome-linked-list",
      title: "Palindrome Linked List",
      difficulty: "Easy",
      prompt: "Given the head of a singly linked list, return true if it is a palindrome, ideally in O(n) time and O(1) space.",
      tell: "Two moves glued together: find the middle with fast/slow, reverse the back half, then compare.",
      alsoAccept: ["two-pointers"],
    },
    {
      slug: "remove-nth-node-from-end-of-list",
      title: "Remove Nth Node From End of List",
      difficulty: "Medium",
      prompt: "Remove the nth node from the end of the linked list and return its head, in one pass.",
      tell: "\"Nth node from the end\": move one pointer n ahead, then walk both until the leader hits the end. A dummy head handles removing the first node.",
    },
    {
      slug: "reorder-list",
      title: "Reorder List",
      difficulty: "Medium",
      prompt: "Reorder L0 → L1 → … → Ln into L0 → Ln → L1 → Ln-1 → …, changing the nodes rather than their values.",
      tell: "\"Reorder\" into first, last, second, second-last: find the middle, reverse the second half, weave the two together.",
    },
    {
      slug: "add-two-numbers",
      title: "Add Two Numbers",
      difficulty: "Medium",
      prompt: "Two non-negative numbers are given as linked lists where the digits are stored in reverse order. Add them and return the sum as a linked list.",
      tell: "Reverse digit order means you add from the head: walk both lists with a carry, and keep going while either list or the carry remains.",
    },
    {
      slug: "copy-list-with-random-pointer",
      title: "Copy List with Random Pointer",
      difficulty: "Medium",
      prompt: "Each node has a next pointer and a random pointer to any node or null. Return a deep copy of the list.",
      tell: "\"Random pointer\" plus deep copy: a Map from each original node to its copy, then wire next and random in a second pass.",
      alsoAccept: ["arrays-hashing"],
    },
    {
      slug: "lru-cache",
      title: "LRU Cache",
      difficulty: "Medium",
      prompt: "Design a least recently used cache with get and put in O(1) average time, evicting the least recently used key when full.",
      tell: "\"Least recently used\" in O(1): a hash map to find nodes, a doubly linked list to move them to the front. (In JavaScript a Map's insertion order does it too: say both.)",
      alsoAccept: ["arrays-hashing"],
    },
    {
      slug: "find-the-duplicate-number",
      title: "Find the Duplicate Number",
      difficulty: "Medium",
      prompt: "An array of n + 1 integers holds values in 1..n, with one repeated. Find it without modifying the array and using constant extra space.",
      tell: "\"Without modifying the array\" and constant space: treat each value as a next pointer, so the duplicate is where a cycle starts. Floyd's algorithm.",
      alsoAccept: ["binary-search"],
    },
    {
      slug: "reverse-nodes-in-k-group",
      title: "Reverse Nodes in k-Group",
      difficulty: "Hard",
      prompt: "Reverse the nodes of a linked list k at a time and return the head. A leftover group shorter than k stays as it is.",
      tell: "\"k-group\": check that k nodes remain, reverse exactly those, reconnect the group's ends, repeat. Dummy head throughout.",
    },
  ],
};
