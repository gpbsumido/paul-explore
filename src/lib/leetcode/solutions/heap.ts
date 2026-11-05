import type { Solution } from "../types";

export const heapSolutions: Record<string, Solution> = {
  "last-stone-weight": {
    approach: [
      "Put every stone in a max-heap.",
      "Pop the two heaviest. If they differ, push back the difference.",
      "Stop when one stone or none is left.",
    ],
    complexity: { time: "O(n log n)", space: "O(n)" },
    code: `function lastStoneWeight(stones: number[]): number {
  const heap = new MinHeap<number>((a, b) => b - a);
  stones.forEach((s) => heap.push(s));
  while (heap.size > 1) {
    const heaviest = heap.pop() as number;
    const second = heap.pop() as number;
    if (heaviest !== second) heap.push(heaviest - second);
  }
  return heap.peek() ?? 0;
}`,
    cases: [
      { call: "lastStoneWeight([2, 7, 4, 1, 8, 1])", expected: 1 },
      { call: "lastStoneWeight([1])", expected: 1 },
      { call: "lastStoneWeight([3, 3])", expected: 0 },
    ],
  },

  "kth-largest-element-in-a-stream": {
    approach: [
      "Keep a min-heap of the k largest values seen so far.",
      "Add each new value, and if the heap grows past k, pop the smallest.",
      "The top of the heap is then the k-th largest.",
    ],
    complexity: { time: "O(log k) per add", space: "O(k)" },
    code: `class KthLargest {
  private heap = new MinHeap<number>((a, b) => a - b);
  constructor(private k: number, nums: number[]) {
    nums.forEach((n) => this.add(n));
  }
  add(val: number): number {
    this.heap.push(val);
    if (this.heap.size > this.k) this.heap.pop();
    return this.heap.peek() as number;
  }
}`,
    cases: [
      {
        call: "(() => { const k = new KthLargest(3, [4, 5, 8, 2]); return [3, 5, 10, 9, 4].map((v) => k.add(v)); })()",
        expected: [4, 5, 5, 8, 8],
      },
      { call: "(() => { const k = new KthLargest(1, []); return [-3, -2, -4, 0, 4].map((v) => k.add(v)); })()", expected: [-3, -2, -2, 0, 4] },
    ],
  },

  "kth-largest-element-in-an-array": {
    approach: [
      "Keep a min-heap capped at k elements.",
      "Push every number, popping the smallest whenever the heap passes k.",
      "What's left on top is the k-th largest.",
    ],
    complexity: { time: "O(n log k)", space: "O(k)" },
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
    alternative: {
      name: "Quickselect",
      approach: [
        "Sorted ascending, the k-th largest sits at index n - k. Quickselect finds what belongs there without sorting the rest.",
        "Pick a random pivot and partition three ways: smaller, equal, larger.",
        "If index n - k lands in the equal block, that's the answer. Otherwise keep only the side that holds it. Random pivots keep the average linear, and the three-way split stops a run of equal values from making it quadratic.",
      ],
      complexity: { time: "O(n) average, O(n²) worst", space: "O(1)" },
      code: `function findKthLargest(nums: number[], k: number): number {
  const target = nums.length - k;
  let low = 0;
  let high = nums.length - 1;
  while (true) {
    const pivot = nums[low + Math.floor(Math.random() * (high - low + 1))];
    let lt = low;
    let i = low;
    let gt = high;
    while (i <= gt) {
      if (nums[i] < pivot) {
        [nums[lt], nums[i]] = [nums[i], nums[lt]];
        lt++;
        i++;
      } else if (nums[i] > pivot) {
        [nums[i], nums[gt]] = [nums[gt], nums[i]];
        gt--;
      } else {
        i++;
      }
    }
    if (target < lt) high = lt - 1;
    else if (target > gt) low = gt + 1;
    else return pivot;
  }
}`,
      cases: [
        { call: "findKthLargest([3, 2, 1, 5, 6, 4], 2)", expected: 5 },
        { call: "findKthLargest([3, 2, 3, 1, 2, 4, 5, 5, 6], 4)", expected: 4 },
        { call: "findKthLargest([2, 2, 2, 2, 2], 3)", expected: 2 },
      ],
    },
  },

  "k-closest-points-to-origin": {
    approach: [
      "Keep a max-heap of k points, ordered by squared distance. No square root is needed to compare distances.",
      "Push each point, and pop the farthest when the heap passes k.",
      "The heap ends up holding the k closest.",
    ],
    complexity: { time: "O(n log k)", space: "O(k)" },
    code: `function kClosest(points: number[][], k: number): number[][] {
  const distance = (p: number[]) => p[0] * p[0] + p[1] * p[1];
  const heap = new MinHeap<number[]>((a, b) => distance(b) - distance(a));
  for (const point of points) {
    heap.push(point);
    if (heap.size > k) heap.pop();
  }
  const result: number[][] = [];
  while (heap.size > 0) result.push(heap.pop() as number[]);
  return result;
}`,
    cases: [
      { call: "kClosest([[1, 3], [-2, 2]], 1)", expected: [[-2, 2]] },
      { call: "kClosest([[3, 3], [5, -1], [-2, 4]], 2).sort((a, b) => a[0] - b[0])", expected: [[-2, 4], [3, 3]] },
    ],
  },

  "task-scheduler": {
    approach: [
      "The most frequent task sets the shape: maxCount blocks, each n + 1 slots wide, with the last block cut short.",
      "That gives (maxCount - 1) · (n + 1) + the number of tasks tied for the top count.",
      "If there are more tasks than that, they fill every gap with no idling, so the answer is the larger of the formula and the task count.",
    ],
    complexity: { time: "O(n)", space: "O(1)" },
    code: `function leastInterval(tasks: string[], n: number): number {
  const counts = new Array<number>(26).fill(0);
  for (const task of tasks) counts[task.charCodeAt(0) - 65]++;
  const maxCount = Math.max(...counts);
  const tiedForMax = counts.filter((c) => c === maxCount).length;
  return Math.max(tasks.length, (maxCount - 1) * (n + 1) + tiedForMax);
}`,
    cases: [
      { call: 'leastInterval(["A", "A", "A", "B", "B", "B"], 2)', expected: 8 },
      { call: 'leastInterval(["A", "C", "A", "B", "D", "B"], 1)', expected: 6 },
      { call: 'leastInterval(["A", "A", "A", "B", "B", "B"], 3)', expected: 10 },
    ],
  },

  "reorganize-string": {
    approach: [
      "If any letter appears more than ceil(n / 2) times, it can't be done.",
      "Otherwise sort the letters by count, most frequent first.",
      "Fill the even indices first, then the odd ones. The busiest letter takes the evens, so no two copies end up next to each other.",
    ],
    complexity: { time: "O(n)", space: "O(n)" },
    code: `function reorganizeString(s: string): string {
  const counts = new Map<string, number>();
  for (const ch of s) counts.set(ch, (counts.get(ch) ?? 0) + 1);
  const byCount = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  if (byCount[0][1] > Math.ceil(s.length / 2)) return "";
  const out = new Array<string>(s.length);
  let index = 0;
  for (const [ch, count] of byCount) {
    for (let i = 0; i < count; i++) {
      if (index >= s.length) index = 1;
      out[index] = ch;
      index += 2;
    }
  }
  return out.join("");
}`,
    cases: [
      { call: 'reorganizeString("aab")', expected: "aba" },
      { call: 'reorganizeString("aaab")', expected: "" },
      { call: '(() => { const r = reorganizeString("aabbcc"); return r.length === 6 && [...r].every((ch, i) => i === 0 || ch !== r[i - 1]); })()', expected: true },
    ],
  },

  "find-k-pairs-with-smallest-sums": {
    approach: [
      "Picture a grid where cell (i, j) is nums1[i] + nums2[j]. Rows and columns both increase.",
      "Seed a min-heap with (i, 0) for the first k rows.",
      "Pop the smallest pair k times, and after popping (i, j), push its right-hand neighbour (i, j + 1).",
    ],
    complexity: { time: "O(k log k)", space: "O(k)" },
    code: `function kSmallestPairs(nums1: number[], nums2: number[], k: number): number[][] {
  const heap = new MinHeap<[number, number]>((a, b) => nums1[a[0]] + nums2[a[1]] - (nums1[b[0]] + nums2[b[1]]));
  for (let i = 0; i < Math.min(k, nums1.length); i++) heap.push([i, 0]);
  const result: number[][] = [];
  while (result.length < k && heap.size > 0) {
    const [i, j] = heap.pop() as [number, number];
    result.push([nums1[i], nums2[j]]);
    if (j + 1 < nums2.length) heap.push([i, j + 1]);
  }
  return result;
}`,
    cases: [
      { call: "kSmallestPairs([1, 7, 11], [2, 4, 6], 3)", expected: [[1, 2], [1, 4], [1, 6]] },
      { call: "kSmallestPairs([1, 2], [3], 3)", expected: [[1, 3], [2, 3]] },
    ],
  },

  "merge-k-sorted-lists": {
    approach: [
      "Put the head of every list in a min-heap keyed on value.",
      "Pop the smallest node, attach it to the result, and push its next node if there is one.",
      "Each of the n nodes passes through a heap of at most k entries.",
    ],
    complexity: { time: "O(n log k)", space: "O(k)" },
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
      { call: "mergeKLists([null])", expected: null },
    ],
    alternative: {
      name: "Merge in pairs",
      approach: [
        "Merge the lists in pairs the way merge sort does: the first with the second, the third with the fourth, and so on.",
        "Each round halves the number of lists, so there are log k rounds.",
        "Every round touches each of the n nodes once. There's no heap, which is the answer if they ask for one without a priority queue.",
      ],
      complexity: { time: "O(n log k)", space: "O(k)" },
      code: `function mergeKLists(lists: (ListNode | null)[]): ListNode | null {
  const mergeTwo = (a: ListNode | null, b: ListNode | null): ListNode | null => {
    const dummy = new ListNode();
    let tail = dummy;
    while (a && b) {
      if (a.val <= b.val) {
        tail.next = a;
        tail = a;
        a = a.next;
      } else {
        tail.next = b;
        tail = b;
        b = b.next;
      }
    }
    tail.next = a ?? b;
    return dummy.next;
  };
  if (lists.length === 0) return null;
  let round = lists;
  while (round.length > 1) {
    const next: (ListNode | null)[] = [];
    for (let i = 0; i < round.length; i += 2) next.push(mergeTwo(round[i], round[i + 1] ?? null));
    round = next;
  }
  return round[0];
}`,
      cases: [
        { call: "arrayFromList(mergeKLists([listFromArray([1, 4, 5]), listFromArray([1, 3, 4]), listFromArray([2, 6])]))", expected: [1, 1, 2, 3, 4, 4, 5, 6] },
        { call: "mergeKLists([])", expected: null },
        { call: "mergeKLists([null])", expected: null },
      ],
    },
  },

  "find-median-from-data-stream": {
    approach: [
      "Split the numbers into two heaps: a max-heap for the smaller half and a min-heap for the larger half.",
      "Add each number to the low half, move the low half's top across to the high half, and if the high half is now bigger, move its top back.",
      "The low half is the same size or one bigger, so the median is its top or the average of both tops.",
    ],
    complexity: { time: "O(log n) add, O(1) median", space: "O(n)" },
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
      {
        call: "(() => { const m = new MedianFinder(); m.addNum(1); m.addNum(2); const a = m.findMedian(); m.addNum(3); return [a, m.findMedian()]; })()",
        expected: [1.5, 2],
      },
      { call: "(() => { const m = new MedianFinder(); [5, 15, 1, 3].forEach((n) => m.addNum(n)); return m.findMedian(); })()", expected: 4 },
    ],
  },

  ipo: {
    approach: [
      "Sort the projects by the capital they need.",
      "Before each pick, push every project you can now afford into a max-heap of profits.",
      "Take the most profitable one, add its profit to your capital, and repeat up to k times. Stop early if nothing is affordable.",
    ],
    complexity: { time: "O(n log n)", space: "O(n)" },
    code: `function findMaximizedCapital(k: number, w: number, profits: number[], capital: number[]): number {
  const projects = capital.map((c, i) => [c, profits[i]]).sort((a, b) => a[0] - b[0]);
  const affordable = new MinHeap<number>((a, b) => b - a);
  let money = w;
  let next = 0;
  for (let pick = 0; pick < k; pick++) {
    while (next < projects.length && projects[next][0] <= money) affordable.push(projects[next++][1]);
    if (affordable.size === 0) break;
    money += affordable.pop() as number;
  }
  return money;
}`,
    cases: [
      { call: "findMaximizedCapital(2, 0, [1, 2, 3], [0, 1, 1])", expected: 4 },
      { call: "findMaximizedCapital(3, 0, [1, 2, 3], [0, 1, 2])", expected: 6 },
    ],
  },
};
