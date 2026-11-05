import type { Solution } from "../types";

export const linkedListSolutions: Record<string, Solution> = {
  "reverse-linked-list": {
    approach: [
      "Walk the list with a previous pointer that starts at null.",
      "At each node, save next, point the node back at previous, then step both forward.",
      "When the walk ends, previous is the new head.",
    ],
    complexity: { time: "O(n)", space: "O(1)" },
    code: `function reverseList(head: ListNode | null): ListNode | null {
  let previous: ListNode | null = null;
  let current = head;
  while (current) {
    const next: ListNode | null = current.next;
    current.next = previous;
    previous = current;
    current = next;
  }
  return previous;
}`,
    cases: [
      { call: "arrayFromList(reverseList(listFromArray([1, 2, 3, 4, 5])))", expected: [5, 4, 3, 2, 1] },
      { call: "reverseList(null)", expected: null },
    ],
  },

  "merge-two-sorted-lists": {
    approach: [
      "Start from a dummy node so the head needs no special case.",
      "Repeatedly attach the smaller of the two front nodes and advance that list.",
      "When one list runs out, attach the rest of the other. Return dummy.next.",
    ],
    complexity: { time: "O(m + n)", space: "O(1)" },
    code: `function mergeTwoLists(list1: ListNode | null, list2: ListNode | null): ListNode | null {
  const dummy = new ListNode();
  let tail = dummy;
  let a = list1;
  let b = list2;
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
      { call: "arrayFromList(mergeTwoLists(null, listFromArray([0])))", expected: [0] },
    ],
  },

  "linked-list-cycle": {
    approach: [
      "Floyd's tortoise and hare: one pointer moves one step, the other two.",
      "If there's a cycle, the fast one laps the slow one and they meet.",
      "If the fast one reaches the end, there's no cycle.",
    ],
    complexity: { time: "O(n)", space: "O(1)" },
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

function withCycle(values: number[], pos: number): ListNode | null {
  const head = listFromArray(values);
  if (pos < 0 || !head) return head;
  let tail = head;
  let entry = head;
  for (let i = 0; tail.next; i++) {
    if (i < pos && entry.next) entry = entry.next;
    tail = tail.next;
  }
  tail.next = entry;
  return head;
}`,
    cases: [
      { call: "hasCycle(withCycle([3, 2, 0, -4], 1))", expected: true },
      { call: "hasCycle(withCycle([1, 2], 0))", expected: true },
      { call: "hasCycle(withCycle([1], -1))", expected: false },
    ],
  },

  "middle-of-the-linked-list": {
    approach: [
      "Move a slow pointer one step and a fast pointer two steps at a time.",
      "When fast can't move any further, slow is in the middle.",
      "With an even length this lands on the second middle, which is what the problem wants.",
    ],
    complexity: { time: "O(n)", space: "O(1)" },
    code: `function middleNode(head: ListNode | null): ListNode | null {
  let slow = head;
  let fast = head;
  while (fast && fast.next) {
    slow = (slow as ListNode).next;
    fast = fast.next.next;
  }
  return slow;
}`,
    cases: [
      { call: "arrayFromList(middleNode(listFromArray([1, 2, 3, 4, 5])))", expected: [3, 4, 5] },
      { call: "arrayFromList(middleNode(listFromArray([1, 2, 3, 4, 5, 6])))", expected: [4, 5, 6] },
    ],
  },

  "palindrome-linked-list": {
    approach: [
      "Find the middle with slow and fast pointers.",
      "Reverse the second half in place.",
      "Walk the first half and the reversed second half together, comparing values.",
    ],
    complexity: { time: "O(n)", space: "O(1)" },
    code: `function isPalindrome(head: ListNode | null): boolean {
  let slow = head;
  let fast = head;
  while (fast && fast.next) {
    slow = (slow as ListNode).next;
    fast = fast.next.next;
  }
  let previous: ListNode | null = null;
  while (slow) {
    const next: ListNode | null = slow.next;
    slow.next = previous;
    previous = slow;
    slow = next;
  }
  let left = head;
  let right = previous;
  while (left && right) {
    if (left.val !== right.val) return false;
    left = left.next;
    right = right.next;
  }
  return true;
}`,
    cases: [
      { call: "isPalindrome(listFromArray([1, 2, 2, 1]))", expected: true },
      { call: "isPalindrome(listFromArray([1, 2]))", expected: false },
      { call: "isPalindrome(listFromArray([1, 2, 3, 2, 1]))", expected: true },
    ],
  },

  "remove-nth-node-from-end-of-list": {
    approach: [
      "Start two pointers at a dummy node in front of the head.",
      "Move the lead pointer n + 1 steps ahead, so the gap between them is n.",
      "Move both until lead falls off the end. The trailing pointer is now just before the node to remove, so skip over it.",
    ],
    complexity: { time: "O(n)", space: "O(1)" },
    code: `function removeNthFromEnd(head: ListNode | null, n: number): ListNode | null {
  const dummy = new ListNode(0, head);
  let lead: ListNode | null = dummy;
  let trail: ListNode = dummy;
  for (let i = 0; i <= n; i++) lead = (lead as ListNode).next;
  while (lead) {
    lead = lead.next;
    trail = trail.next as ListNode;
  }
  trail.next = (trail.next as ListNode).next;
  return dummy.next;
}`,
    cases: [
      { call: "arrayFromList(removeNthFromEnd(listFromArray([1, 2, 3, 4, 5]), 2))", expected: [1, 2, 3, 5] },
      { call: "arrayFromList(removeNthFromEnd(listFromArray([1]), 1))", expected: [] },
      { call: "arrayFromList(removeNthFromEnd(listFromArray([1, 2]), 1))", expected: [1] },
    ],
  },

  "reorder-list": {
    approach: [
      "Find the middle and split the list there.",
      "Reverse the second half.",
      "Weave the two halves together, taking one node from each in turn.",
    ],
    complexity: { time: "O(n)", space: "O(1)" },
    code: `function reorderList(head: ListNode | null): void {
  if (!head) return;
  let slow: ListNode = head;
  let fast: ListNode | null = head;
  while (fast.next && fast.next.next) {
    slow = slow.next as ListNode;
    fast = fast.next.next;
  }
  let second: ListNode | null = slow.next;
  slow.next = null;
  let previous: ListNode | null = null;
  while (second) {
    const next: ListNode | null = second.next;
    second.next = previous;
    previous = second;
    second = next;
  }
  let first: ListNode | null = head;
  let back = previous;
  while (first && back) {
    const firstNext: ListNode | null = first.next;
    const backNext: ListNode | null = back.next;
    first.next = back;
    back.next = firstNext;
    first = firstNext;
    back = backNext;
  }
}`,
    cases: [
      { call: "(() => { const h = listFromArray([1, 2, 3, 4]); reorderList(h); return arrayFromList(h); })()", expected: [1, 4, 2, 3] },
      { call: "(() => { const h = listFromArray([1, 2, 3, 4, 5]); reorderList(h); return arrayFromList(h); })()", expected: [1, 5, 2, 4, 3] },
    ],
  },

  "add-two-numbers": {
    approach: [
      "The digits are stored least significant first, which is the order you add in by hand.",
      "Walk both lists together, adding the two digits and the carry.",
      "Write sum % 10 into a new node and carry floor(sum / 10). Keep going while either list or the carry remains.",
    ],
    complexity: { time: "O(max(m, n))", space: "O(max(m, n))" },
    code: `function addTwoNumbers(l1: ListNode | null, l2: ListNode | null): ListNode | null {
  const dummy = new ListNode();
  let tail = dummy;
  let a = l1;
  let b = l2;
  let carry = 0;
  while (a || b || carry) {
    const sum = (a ? a.val : 0) + (b ? b.val : 0) + carry;
    tail.next = new ListNode(sum % 10);
    tail = tail.next;
    carry = Math.floor(sum / 10);
    a = a ? a.next : null;
    b = b ? b.next : null;
  }
  return dummy.next;
}`,
    cases: [
      { call: "arrayFromList(addTwoNumbers(listFromArray([2, 4, 3]), listFromArray([5, 6, 4])))", expected: [7, 0, 8] },
      { call: "arrayFromList(addTwoNumbers(listFromArray([9, 9, 9, 9]), listFromArray([9, 9])))", expected: [8, 9, 0, 0, 1] },
    ],
  },

  "copy-list-with-random-pointer": {
    approach: [
      "First pass: make a copy of every node and remember original-to-copy in a Map.",
      "Second pass: set each copy's next and random to the copies of the original's next and random.",
      "Return the copy of the head.",
    ],
    complexity: { time: "O(n)", space: "O(n)" },
    code: `class _Node {
  val: number;
  next: _Node | null;
  random: _Node | null;
  constructor(val: number, next: _Node | null = null, random: _Node | null = null) {
    this.val = val;
    this.next = next;
    this.random = random;
  }
}

function copyRandomList(head: _Node | null): _Node | null {
  const copyOf = new Map<_Node, _Node>();
  for (let node = head; node; node = node.next) copyOf.set(node, new _Node(node.val));
  for (let node = head; node; node = node.next) {
    const copy = copyOf.get(node) as _Node;
    copy.next = node.next ? (copyOf.get(node.next) as _Node) : null;
    copy.random = node.random ? (copyOf.get(node.random) as _Node) : null;
  }
  return head ? (copyOf.get(head) as _Node) : null;
}

function buildRandomList(pairs: [number, number | null][]): _Node | null {
  const nodes = pairs.map(([val]) => new _Node(val));
  nodes.forEach((node, i) => {
    node.next = nodes[i + 1] ?? null;
    const target = pairs[i][1];
    node.random = target === null ? null : nodes[target];
  });
  return nodes[0] ?? null;
}

function describeRandomList(head: _Node | null): [number, number | null][] {
  const nodes: _Node[] = [];
  for (let node = head; node; node = node.next) nodes.push(node);
  return nodes.map((node): [number, number | null] => [node.val, node.random ? nodes.indexOf(node.random) : null]);
}`,
    cases: [
      {
        call: "describeRandomList(copyRandomList(buildRandomList([[7, null], [13, 0], [11, 4], [10, 2], [1, 0]])))",
        expected: [[7, null], [13, 0], [11, 4], [10, 2], [1, 0]],
      },
      {
        call: "(() => { const original = buildRandomList([[1, 1], [2, 1]]); const copy = copyRandomList(original); return copy !== original && copy !== null && copy.random !== (original as _Node).random; })()",
        expected: true,
      },
    ],
  },

  "lru-cache": {
    approach: [
      "A JavaScript Map remembers insertion order, so its first key is always the least recently used.",
      "On get, delete the key and set it again to move it to the back.",
      "On put, do the same; if the size goes over capacity, delete the first key.",
    ],
    complexity: { time: "O(1)", space: "O(capacity)" },
    code: `class LRUCache {
  private entries = new Map<number, number>();
  constructor(private capacity: number) {}
  get(key: number): number {
    const value = this.entries.get(key);
    if (value === undefined) return -1;
    this.entries.delete(key);
    this.entries.set(key, value);
    return value;
  }
  put(key: number, value: number): void {
    this.entries.delete(key);
    this.entries.set(key, value);
    if (this.entries.size > this.capacity) {
      const oldest = this.entries.keys().next().value as number;
      this.entries.delete(oldest);
    }
  }
}`,
    cases: [
      {
        call: "(() => { const c = new LRUCache(2); c.put(1, 1); c.put(2, 2); const a = c.get(1); c.put(3, 3); const b = c.get(2); c.put(4, 4); return [a, b, c.get(1), c.get(3), c.get(4)]; })()",
        expected: [1, -1, -1, 3, 4],
      },
      { call: "(() => { const c = new LRUCache(1); c.put(2, 1); c.put(2, 2); return c.get(2); })()", expected: 2 },
    ],
    alternative: {
      name: "Hash map and doubly linked list",
      approach: [
        "Keep a Map from key to node, and a doubly linked list ordered from most to least recently used.",
        "Sentinel nodes at both ends mean unlinking and inserting never have to check for a missing neighbour.",
        "get and put move the node to the front. When the Map goes over capacity, drop the node just before the tail sentinel.",
      ],
      complexity: { time: "O(1)", space: "O(capacity)" },
      code: `class DNode {
  prev: DNode | null = null;
  next: DNode | null = null;
  constructor(
    public key: number,
    public value: number,
  ) {}
}

class LRUCache {
  private nodes = new Map<number, DNode>();
  private head = new DNode(0, 0);
  private tail = new DNode(0, 0);
  constructor(private capacity: number) {
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }
  private unlink(node: DNode): void {
    (node.prev as DNode).next = node.next;
    (node.next as DNode).prev = node.prev;
  }
  private pushFront(node: DNode): void {
    node.prev = this.head;
    node.next = this.head.next;
    (this.head.next as DNode).prev = node;
    this.head.next = node;
  }
  get(key: number): number {
    const node = this.nodes.get(key);
    if (!node) return -1;
    this.unlink(node);
    this.pushFront(node);
    return node.value;
  }
  put(key: number, value: number): void {
    const existing = this.nodes.get(key);
    if (existing) {
      existing.value = value;
      this.unlink(existing);
      this.pushFront(existing);
      return;
    }
    const node = new DNode(key, value);
    this.nodes.set(key, node);
    this.pushFront(node);
    if (this.nodes.size > this.capacity) {
      const oldest = this.tail.prev as DNode;
      this.unlink(oldest);
      this.nodes.delete(oldest.key);
    }
  }
}`,
      cases: [
        {
          call: "(() => { const c = new LRUCache(2); c.put(1, 1); c.put(2, 2); const a = c.get(1); c.put(3, 3); const b = c.get(2); c.put(4, 4); return [a, b, c.get(1), c.get(3), c.get(4)]; })()",
          expected: [1, -1, -1, 3, 4],
        },
        { call: "(() => { const c = new LRUCache(1); c.put(2, 1); c.put(2, 2); return c.get(2); })()", expected: 2 },
      ],
    },
  },

  "find-the-duplicate-number": {
    approach: [
      "Treat each value as a pointer to an index: i points to nums[i]. The repeated value means two indices point to the same place, which makes a cycle.",
      "Run Floyd's slow and fast pointers until they meet inside the cycle.",
      "Reset one to the start and move both one step at a time. Where they meet is the cycle's entrance, which is the duplicate.",
    ],
    complexity: { time: "O(n)", space: "O(1)" },
    code: `function findDuplicate(nums: number[]): number {
  let slow = nums[0];
  let fast = nums[nums[0]];
  while (slow !== fast) {
    slow = nums[slow];
    fast = nums[nums[fast]];
  }
  slow = 0;
  while (slow !== fast) {
    slow = nums[slow];
    fast = nums[fast];
  }
  return slow;
}`,
    cases: [
      { call: "findDuplicate([1, 3, 4, 2, 2])", expected: 2 },
      { call: "findDuplicate([3, 1, 3, 4, 2])", expected: 3 },
      { call: "findDuplicate([3, 3, 3, 3, 3])", expected: 3 },
    ],
    alternative: {
      name: "Binary search on the value",
      approach: [
        "The values run from 1 to n, so search the values rather than the indexes.",
        "For a guess mid, count the numbers that are at most mid. If there are more than mid of them, the duplicate is somewhere in 1 to mid.",
        "Halve the range until one value is left. It's slower than the cycle but still O(1) space, leaves the array alone, and is easier to explain on the spot.",
      ],
      complexity: { time: "O(n log n)", space: "O(1)" },
      code: `function findDuplicate(nums: number[]): number {
  let low = 1;
  let high = nums.length - 1;
  while (low < high) {
    const mid = (low + high) >> 1;
    let atMostMid = 0;
    for (const n of nums) if (n <= mid) atMostMid++;
    if (atMostMid > mid) high = mid;
    else low = mid + 1;
  }
  return low;
}`,
      cases: [
        { call: "findDuplicate([1, 3, 4, 2, 2])", expected: 2 },
        { call: "findDuplicate([3, 1, 3, 4, 2])", expected: 3 },
        { call: "findDuplicate([3, 3, 3, 3, 3])", expected: 3 },
      ],
    },
  },

  "reverse-nodes-in-k-group": {
    approach: [
      "Work group by group from a dummy node. First check that k nodes remain; if not, leave the rest alone.",
      "Reverse those k nodes the usual way, pointing the group's first node at whatever follows the group.",
      "Hook the node before the group up to its new head, and move on with the old first node as the new 'before'.",
    ],
    complexity: { time: "O(n)", space: "O(1)" },
    code: `function reverseKGroup(head: ListNode | null, k: number): ListNode | null {
  const dummy = new ListNode(0, head);
  let before: ListNode = dummy;
  while (true) {
    let check: ListNode | null = before;
    for (let i = 0; i < k && check; i++) check = check.next;
    if (!check) break;
    const groupStart = before.next as ListNode;
    let previous: ListNode | null = check.next;
    let current: ListNode | null = groupStart;
    for (let i = 0; i < k; i++) {
      const node = current as ListNode;
      const next: ListNode | null = node.next;
      node.next = previous;
      previous = node;
      current = next;
    }
    before.next = previous;
    before = groupStart;
  }
  return dummy.next;
}`,
    cases: [
      { call: "arrayFromList(reverseKGroup(listFromArray([1, 2, 3, 4, 5]), 2))", expected: [2, 1, 4, 3, 5] },
      { call: "arrayFromList(reverseKGroup(listFromArray([1, 2, 3, 4, 5]), 3))", expected: [3, 2, 1, 4, 5] },
    ],
  },
};
