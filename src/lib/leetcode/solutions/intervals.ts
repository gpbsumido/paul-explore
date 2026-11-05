import type { Solution } from "../types";

export const intervalsSolutions: Record<string, Solution> = {
  "summary-ranges": {
    approach: [
      "Walk the sorted numbers, starting a range at the current one.",
      "Extend it while the next number is exactly one more.",
      "Write 'a' for a single number or 'a->b' for a run, then start the next range.",
    ],
    complexity: { time: "O(n)", space: "O(1) extra" },
    code: `function summaryRanges(nums: number[]): string[] {
  const ranges: string[] = [];
  let i = 0;
  while (i < nums.length) {
    const start = nums[i];
    while (i + 1 < nums.length && nums[i + 1] === nums[i] + 1) i++;
    ranges.push(start === nums[i] ? String(start) : start + "->" + nums[i]);
    i++;
  }
  return ranges;
}`,
    cases: [
      { call: "summaryRanges([0, 1, 2, 4, 5, 7])", expected: ["0->2", "4->5", "7"] },
      { call: "summaryRanges([0, 2, 3, 4, 6, 8, 9])", expected: ["0", "2->4", "6", "8->9"] },
      { call: "summaryRanges([])", expected: [] },
    ],
  },

  "merge-intervals": {
    approach: [
      "Sort by start.",
      "Walk the intervals: if one starts before the last merged interval ends, stretch that end to cover it.",
      "Otherwise it starts a new merged interval.",
    ],
    complexity: { time: "O(n log n)", space: "O(n)" },
    code: `function merge(intervals: number[][]): number[][] {
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  const merged: number[][] = [];
  for (const [start, end] of sorted) {
    const last = merged[merged.length - 1];
    if (last && start <= last[1]) last[1] = Math.max(last[1], end);
    else merged.push([start, end]);
  }
  return merged;
}`,
    cases: [
      { call: "merge([[1, 3], [2, 6], [8, 10], [15, 18]])", expected: [[1, 6], [8, 10], [15, 18]] },
      { call: "merge([[1, 4], [4, 5]])", expected: [[1, 5]] },
      { call: "merge([[1, 4], [0, 4]])", expected: [[0, 4]] },
    ],
  },

  "insert-interval": {
    approach: [
      "The list is sorted and doesn't overlap, so it splits into three parts.",
      "Copy every interval that ends before the new one starts.",
      "Merge everything that overlaps into the new interval by widening its start and end, push it, then copy the rest.",
    ],
    complexity: { time: "O(n)", space: "O(n)" },
    code: `function insert(intervals: number[][], newInterval: number[]): number[][] {
  const result: number[][] = [];
  let [start, end] = newInterval;
  let i = 0;
  while (i < intervals.length && intervals[i][1] < start) result.push(intervals[i++]);
  while (i < intervals.length && intervals[i][0] <= end) {
    start = Math.min(start, intervals[i][0]);
    end = Math.max(end, intervals[i][1]);
    i++;
  }
  result.push([start, end]);
  while (i < intervals.length) result.push(intervals[i++]);
  return result;
}`,
    cases: [
      { call: "insert([[1, 3], [6, 9]], [2, 5])", expected: [[1, 5], [6, 9]] },
      { call: "insert([[1, 2], [3, 5], [6, 7], [8, 10], [12, 16]], [4, 8])", expected: [[1, 2], [3, 10], [12, 16]] },
      { call: "insert([], [5, 7])", expected: [[5, 7]] },
    ],
  },

  "non-overlapping-intervals": {
    approach: [
      "Flip it around: keep as many intervals as possible, then the answer is everything else.",
      "Sort by end. The interval that ends earliest leaves the most room for the rest, so always keep it.",
      "Walk on, keeping each interval that starts at or after the last kept end, and count the ones you skip.",
    ],
    complexity: { time: "O(n log n)", space: "O(1) extra" },
    code: `function eraseOverlapIntervals(intervals: number[][]): number {
  const sorted = [...intervals].sort((a, b) => a[1] - b[1]);
  let lastEnd = -Infinity;
  let removed = 0;
  for (const [start, end] of sorted) {
    if (start >= lastEnd) lastEnd = end;
    else removed++;
  }
  return removed;
}`,
    cases: [
      { call: "eraseOverlapIntervals([[1, 2], [2, 3], [3, 4], [1, 3]])", expected: 1 },
      { call: "eraseOverlapIntervals([[1, 2], [1, 2], [1, 2]])", expected: 2 },
      { call: "eraseOverlapIntervals([[1, 2], [2, 3]])", expected: 0 },
    ],
  },

  "minimum-number-of-arrows-to-burst-balloons": {
    approach: [
      "Sort by end.",
      "Shoot the first arrow at the end of the first balloon, since that's as far right as it can go and still hit it.",
      "Every balloon starting at or before that point bursts too. The first one that starts after it needs a new arrow at its own end.",
    ],
    complexity: { time: "O(n log n)", space: "O(1) extra" },
    code: `function findMinArrowShots(points: number[][]): number {
  const sorted = [...points].sort((a, b) => a[1] - b[1]);
  let arrows = 0;
  let arrowAt = -Infinity;
  for (const [start, end] of sorted) {
    if (start > arrowAt) {
      arrows++;
      arrowAt = end;
    }
  }
  return arrows;
}`,
    cases: [
      { call: "findMinArrowShots([[10, 16], [2, 8], [1, 6], [7, 12]])", expected: 2 },
      { call: "findMinArrowShots([[1, 2], [3, 4], [5, 6], [7, 8]])", expected: 4 },
      { call: "findMinArrowShots([[1, 2], [2, 3], [3, 4], [4, 5]])", expected: 2 },
    ],
  },

  "interval-list-intersections": {
    approach: [
      "Walk both sorted lists with a pointer each.",
      "Two intervals overlap from the later start to the earlier end, if that range isn't empty.",
      "Then advance whichever interval ends first, because it can't overlap anything further on.",
    ],
    complexity: { time: "O(m + n)", space: "O(m + n)" },
    code: `function intervalIntersection(firstList: number[][], secondList: number[][]): number[][] {
  const result: number[][] = [];
  let i = 0;
  let j = 0;
  while (i < firstList.length && j < secondList.length) {
    const start = Math.max(firstList[i][0], secondList[j][0]);
    const end = Math.min(firstList[i][1], secondList[j][1]);
    if (start <= end) result.push([start, end]);
    if (firstList[i][1] < secondList[j][1]) i++;
    else j++;
  }
  return result;
}`,
    cases: [
      {
        call: "intervalIntersection([[0, 2], [5, 10], [13, 23], [24, 25]], [[1, 5], [8, 12], [15, 24], [25, 26]])",
        expected: [[1, 2], [5, 5], [8, 10], [15, 23], [24, 24], [25, 25]],
      },
      { call: "intervalIntersection([[1, 3], [5, 9]], [])", expected: [] },
    ],
  },

  "car-pooling": {
    approach: [
      "Treat each trip as +passengers at its start and -passengers at its end, like a difference array.",
      "Locations are small, so record those changes in an array indexed by location.",
      "Sweep left to right with a running total. If it ever goes over capacity, the answer is false.",
    ],
    complexity: { time: "O(n + L)", space: "O(L)" },
    code: `function carPooling(trips: number[][], capacity: number): boolean {
  const change = new Array<number>(1001).fill(0);
  for (const [passengers, from, to] of trips) {
    change[from] += passengers;
    change[to] -= passengers;
  }
  let onboard = 0;
  for (const delta of change) {
    onboard += delta;
    if (onboard > capacity) return false;
  }
  return true;
}`,
    cases: [
      { call: "carPooling([[2, 1, 5], [3, 3, 7]], 4)", expected: false },
      { call: "carPooling([[2, 1, 5], [3, 3, 7]], 5)", expected: true },
      { call: "carPooling([[2, 1, 5], [3, 5, 7]], 3)", expected: true },
    ],
  },

  "my-calendar-i": {
    approach: [
      "Keep a list of booked [start, end) ranges.",
      "Two half-open ranges overlap when each one starts before the other ends.",
      "Refuse a booking that overlaps anything; otherwise store it. A sorted structure gets this to O(log n) if they ask.",
    ],
    complexity: { time: "O(n) per booking", space: "O(n)" },
    code: `class MyCalendar {
  private booked: [number, number][] = [];
  book(startTime: number, endTime: number): boolean {
    for (const [start, end] of this.booked) {
      if (startTime < end && start < endTime) return false;
    }
    this.booked.push([startTime, endTime]);
    return true;
  }
}`,
    cases: [
      { call: "(() => { const c = new MyCalendar(); return [c.book(10, 20), c.book(15, 25), c.book(20, 30)]; })()", expected: [true, false, true] },
      { call: "(() => { const c = new MyCalendar(); return [c.book(5, 10), c.book(0, 5), c.book(4, 6)]; })()", expected: [true, true, false] },
    ],
  },

  "minimum-interval-to-include-each-query": {
    approach: [
      "Answer the queries offline, smallest first, and sort the intervals by start.",
      "For each query, push every interval that has started into a min-heap keyed by size.",
      "Pop intervals off the top that have already ended. The top that remains is the smallest one covering the query, or -1 if the heap is empty.",
    ],
    complexity: { time: "O((n + q) log n)", space: "O(n + q)" },
    code: `function minInterval(intervals: number[][], queries: number[]): number[] {
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  const order = queries.map((_, i) => i).sort((a, b) => queries[a] - queries[b]);
  const heap = new MinHeap<[number, number]>((a, b) => a[0] - b[0]);
  const answer = new Array<number>(queries.length).fill(-1);
  let next = 0;
  for (const qi of order) {
    const q = queries[qi];
    while (next < sorted.length && sorted[next][0] <= q) {
      const [start, end] = sorted[next++];
      heap.push([end - start + 1, end]);
    }
    while (heap.size > 0 && (heap.peek() as [number, number])[1] < q) heap.pop();
    if (heap.size > 0) answer[qi] = (heap.peek() as [number, number])[0];
  }
  return answer;
}`,
    cases: [
      { call: "minInterval([[1, 4], [2, 4], [3, 6], [4, 4]], [2, 3, 4, 5])", expected: [3, 3, 1, 4] },
      { call: "minInterval([[2, 3], [2, 5], [1, 8], [20, 25]], [2, 19, 5, 22])", expected: [2, -1, 4, 6] },
    ],
  },
};
