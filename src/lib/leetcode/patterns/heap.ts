import type { Pattern } from "../types";

export const heap: Pattern = {
  id: "heap",
  name: "Heaps & Top K",
  phase: 2,
  tagline: "Always know the smallest (or biggest) thing, cheaply, while things keep changing.",
  summary:
    "A heap gives you the minimum in O(1) and lets you add or remove in O(log n). Reach for one when you repeatedly need the current best: the k largest of a stream, the next meeting to end, the closest unvisited node, the smallest head among k sorted lists. The counter-intuitive move is keeping a min-heap of size k to find the k largest: the root is the weakest of the current top k, so anything smaller than it is out.",
  question: "Do I keep needing the current smallest or largest item while items are added and removed?",
  signals: [
    { phrase: "kth largest", why: "A min-heap of size k keeps the k largest; its root is the kth.", weight: 3 },
    { phrase: "kth smallest", why: "A max-heap of size k, or a min-heap popped k times." },
    { phrase: "k closest", why: "Keep the k best by distance in a bounded heap.", weight: 3 },
    { phrase: "top k", why: "Top k is the textbook bounded heap.", weight: 2 },
    { phrase: "k most frequent", why: "Count, then keep a size-k heap by count." },
    { phrase: "median", why: "Two heaps: a max-heap for the lower half, a min-heap for the upper.", weight: 2 },
    { phrase: "data stream", why: "Values arriving one at a time with a running statistic call for a heap." },
    { phrase: "merge k sorted", why: "A heap of the k current heads picks the next smallest.", weight: 3 },
    { phrase: "k pairs with the smallest", why: "Expand candidates lazily from a heap.", weight: 2 },
    { phrase: "heaviest", why: "Repeatedly take the two heaviest: a max-heap." },
    { phrase: "schedule", why: "Scheduling by priority or end time uses a heap." },
    { phrase: "cooling", why: "Task Scheduler: most frequent task first, held back during cooldown." },
    { phrase: "adjacent characters are not the same", why: "Reorganise String: always place the most frequent remaining letter." },
    { phrase: "capital", why: "IPO: unlock projects by capital, pick the most profitable with a heap.", weight: 2 },
  ],
  antiSignals: [
    "You need the kth element once from a static array: quickselect is O(n) average, and sorting is O(n log n) and simpler. Mention both.",
    "You need the max of a sliding window: a monotonic deque is O(n) against the heap's O(n log n).",
  ],
  complexity: { time: "O(n log k) for top k", space: "O(k)" },
  template: {
    title: "Min-heap of size k keeps the k largest",
    explanation:
      "Push everything, and whenever the heap grows past k, pop the smallest. What's left is the k largest, and the root is the kth largest. Uses the MinHeap from the toolkit page.",
    code: `function findKthLargest(nums: number[], k: number): number {
  const heap = new MinHeap<number>((a, b) => a - b);
  for (const n of nums) {
    heap.push(n);
    if (heap.size > k) heap.pop();
  }
  return heap.peek() as number;
}`,
    cases: [
      { call: "findKthLargest([3, 2, 1, 5, 6, 4], 2)", expected: 5 },
      { call: "findKthLargest([3, 2, 3, 1, 2, 4, 5, 5, 6], 4)", expected: 4 },
    ],
  },
  variants: [
    {
      title: "Merge k sorted lists",
      explanation: "The heap holds at most one node per list: the current head. Pop the smallest, append it, push its successor. O(N log k) for N nodes total.",
      code: `function mergeKLists(lists: (ListNode | null)[]): ListNode | null {
  const heap = new MinHeap<ListNode>((a, b) => a.val - b.val);
  for (const head of lists) if (head) heap.push(head);
  const dummy = new ListNode();
  let tail = dummy;
  while (heap.size > 0) {
    const node = heap.pop() as ListNode;
    tail.next = node;
    tail = node;
    if (node.next) heap.push(node.next);
  }
  return dummy.next;
}`,
      cases: [
        { call: "arrayFromList(mergeKLists([listFromArray([1, 4, 5]), listFromArray([1, 3, 4]), listFromArray([2, 6])]))", expected: [1, 1, 2, 3, 4, 4, 5, 6] },
        { call: "mergeKLists([])", expected: null },
      ],
    },
    {
      title: "Two heaps for a running median",
      explanation:
        "low is a max-heap of the smaller half, high a min-heap of the larger half. Add to low, move low's max to high, and rebalance so low is never smaller. The median is low's top or the average of both tops.",
      code: `class MedianFinder {
  private low = new MinHeap<number>((a, b) => b - a);
  private high = new MinHeap<number>((a, b) => a - b);

  addNum(num: number): void {
    this.low.push(num);
    this.high.push(this.low.pop() as number);
    if (this.high.size > this.low.size) this.low.push(this.high.pop() as number);
  }

  findMedian(): number {
    if (this.low.size > this.high.size) return this.low.peek() as number;
    return ((this.low.peek() as number) + (this.high.peek() as number)) / 2;
  }
}`,
      cases: [
        { call: "(() => { const m = new MedianFinder(); m.addNum(1); m.addNum(2); const a = m.findMedian(); m.addNum(3); return [a, m.findMedian()]; })()", expected: [1.5, 2] },
      ],
    },
  ],
  pitfalls: [
    "Using a max-heap of everything for kth largest: O(n log n) and O(n) space, when a size-k min-heap is O(n log k).",
    "Comparators that return booleans. They must return a negative, zero or positive number.",
    "For objects, comparing whole objects instead of the priority field.",
  ],
  jsNotes: [
    "JavaScript has no heap. LeetCode ships @datastructures-js/priority-queue, but interview pads usually don't: be ready to write the toolkit page's MinHeap in five minutes, or ask whether you can assume one.",
    "Sorting once is O(n log n) and often acceptable for static input. Say it, then offer the heap when the data streams in.",
  ],
  prerequisites: ["arrays-hashing"],
  problems: [
    {
      slug: "last-stone-weight",
      title: "Last Stone Weight",
      difficulty: "Easy",
      prompt: "Repeatedly smash the two heaviest stones together; equal stones vanish, otherwise the difference remains. Return the weight of the last stone, or 0.",
      tell: "\"Two heaviest\" again and again while new stones appear: a max-heap.",
    },
    {
      slug: "kth-largest-element-in-a-stream",
      title: "Kth Largest Element in a Stream",
      difficulty: "Easy",
      prompt: "Design a class that receives numbers from a data stream and returns the kth largest element after each one.",
      tell: "\"Kth largest\" of a \"data stream\": keep a min-heap of size k; its root is always the answer.",
    },
    {
      slug: "kth-largest-element-in-an-array",
      title: "Kth Largest Element in an Array",
      difficulty: "Medium",
      prompt: "Return the kth largest element in an unsorted array. Can you solve it without sorting?",
      tell: "\"Kth largest\" without sorting: a size-k min-heap, O(n log k). Quickselect is the O(n) average answer to mention.",
    },
    {
      slug: "k-closest-points-to-origin",
      title: "K Closest Points to Origin",
      difficulty: "Medium",
      prompt: "Given points on a plane, return the k closest points to the origin.",
      tell: "\"K closest\": a max-heap of size k by squared distance (no square root needed), evicting the farthest.",
    },
    {
      slug: "task-scheduler",
      title: "Task Scheduler",
      difficulty: "Medium",
      prompt: "Each task takes one unit of time and identical tasks need n units of cooling between them. Return the minimum time to finish all tasks.",
      tell: "Most frequent task first, held back while cooling: a max-heap plus a cooldown queue. The counting formula is the faster answer to know.",
      alsoAccept: ["greedy"],
    },
    {
      slug: "reorganize-string",
      title: "Reorganize String",
      difficulty: "Medium",
      prompt: "Rearrange the characters so that two adjacent characters are not the same, or return an empty string if impossible.",
      tell: "\"Adjacent characters are not the same\": always place the most frequent remaining letter that isn't the previous one. Max-heap by count.",
      alsoAccept: ["greedy"],
    },
    {
      slug: "find-k-pairs-with-smallest-sums",
      title: "Find K Pairs with Smallest Sums",
      difficulty: "Medium",
      prompt: "Given two sorted arrays, return the k pairs with the smallest sums, one element from each array.",
      tell: "\"K pairs with the smallest\" sums: seed a min-heap with (i, 0) pairs and expand each popped pair's neighbour lazily.",
    },
    {
      slug: "merge-k-sorted-lists",
      title: "Merge k Sorted Lists",
      difficulty: "Hard",
      prompt: "Merge k sorted linked lists into one sorted linked list.",
      tell: "\"Merge k sorted\": a heap of the current heads always yields the next smallest. O(N log k).",
    },
    {
      slug: "find-median-from-data-stream",
      title: "Find Median from Data Stream",
      difficulty: "Hard",
      prompt: "Design a structure that adds numbers from a data stream and returns the median of everything added so far.",
      tell: "\"Median\" of a \"data stream\": two heaps, max-heap for the low half and min-heap for the high half, kept balanced.",
    },
    {
      slug: "ipo",
      title: "IPO",
      difficulty: "Hard",
      prompt: "You have initial capital and can finish at most k projects, each with a capital requirement and a profit. Maximise your final capital.",
      tell: "Projects unlock as \"capital\" grows: sort by requirement, push affordable ones into a max-heap by profit, take the best each round.",
      alsoAccept: ["greedy"],
    },
  ],
};
