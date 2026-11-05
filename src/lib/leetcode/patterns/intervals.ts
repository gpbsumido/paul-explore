import type { Pattern } from "../types";

export const intervals: Pattern = {
  id: "intervals",
  name: "Intervals",
  phase: 2,
  tagline: "Sort by start, then each interval only has to look at the last one kept.",
  summary:
    "Interval questions get easy once the intervals are sorted, by start for merging and inserting and by end for picking the most non-overlapping ones. After sorting, each interval only has to compare itself with the last one kept. Two intervals [a, b] and [c, d] overlap when a < d and c < b, and merging takes the min start and max end. For \"how many at once\" questions, split each interval into a +1 at its start and a -1 at its end and sweep.",
  question: "If I sort these by start (or end), does each one only need to compare with the previous?",
  signals: [
    { phrase: "intervals", why: "The word itself: sort, then compare neighbours.", weight: 2 },
    { phrase: "overlapping", why: "Overlap checks between neighbours after sorting.", weight: 2 },
    { phrase: "merge", why: "Merging overlapping ranges after a sort by start." },
    { phrase: "meeting", why: "Meetings are intervals; rooms needed is a sweep or a heap of end times." },
    { phrase: "non-overlapping", why: "Most non-overlapping is greedy by earliest end.", weight: 2 },
    { phrase: "start and end", why: "Pairs of start and end are intervals by another name." },
    { phrase: "balloons", why: "Arrows through balloons: greedy by end point.", weight: 2 },
    { phrase: "booking", why: "Double booking checks a new interval against existing ones." },
    { phrase: "passengers", why: "Capacity over time is a sweep line of pickups and drop-offs." },
    { phrase: "ranges", why: "Ranges are intervals; summarising them is merging consecutive values." },
    { phrase: "intersection", why: "Two sorted interval lists intersect with one pointer each." },
    { phrase: "insert", why: "Insert Interval: copy the ones before, merge the overlapping, copy the rest." },
  ],
  antiSignals: [
    "The ranges are over indices of one array and the question is about their contents: that's a sliding window or prefix sums.",
  ],
  complexity: { time: "O(n log n) for the sort", space: "O(n) for the output" },
  template: {
    title: "Sort by start, merge into the last kept",
    explanation:
      "After sorting by start, an interval either overlaps the last merged one (extend its end) or starts a new one. Using max for the end matters: a short interval inside a long one mustn't shrink it.",
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
      { call: "merge([[1, 4], [2, 3]])", expected: [[1, 4]] },
    ],
  },
  variants: [
    {
      title: "Greedy by end: keep the most non-overlapping",
      explanation:
        "To remove the fewest intervals, keep the one that ends earliest whenever two clash, because it leaves the most room for what follows. Sort by end and count the clashes.",
      code: `function eraseOverlapIntervals(intervals: number[][]): number {
  const sorted = [...intervals].sort((a, b) => a[1] - b[1]);
  let removed = 0;
  let lastEnd = Number.NEGATIVE_INFINITY;
  for (const [start, end] of sorted) {
    if (start < lastEnd) removed++;
    else lastEnd = end;
  }
  return removed;
}`,
      cases: [
        { call: "eraseOverlapIntervals([[1, 2], [2, 3], [3, 4], [1, 3]])", expected: 1 },
        { call: "eraseOverlapIntervals([[1, 2], [1, 2], [1, 2]])", expected: 2 },
      ],
    },
    {
      title: "Sweep line: how many at once",
      explanation:
        "Car Pooling: each trip adds passengers at its start and removes them at its end. Sort the events (drop-offs before pickups at the same spot) and track the running total.",
      code: `function carPooling(trips: number[][], capacity: number): boolean {
  const events: [number, number][] = [];
  for (const [passengers, from, to] of trips) {
    events.push([from, passengers], [to, -passengers]);
  }
  events.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  let load = 0;
  for (const [, change] of events) {
    load += change;
    if (load > capacity) return false;
  }
  return true;
}`,
      cases: [
        { call: "carPooling([[2, 1, 5], [3, 3, 7]], 4)", expected: false },
        { call: "carPooling([[2, 1, 5], [3, 5, 7]], 3)", expected: true },
      ],
    },
  ],
  pitfalls: [
    "Not asking whether touching intervals like [1, 2] and [2, 3] overlap. The answer changes < to <=.",
    "Mutating the input with sort() when the caller expects it unchanged. Copy first.",
    "Taking the new interval's end instead of the max when merging, so containment shrinks the range.",
  ],
  jsNotes: [
    "Sort tuples with a two-key comparator: (a, b) => a[0] - b[0] || a[1] - b[1].",
  ],
  prerequisites: ["heap"],
  problems: [
    {
      slug: "summary-ranges",
      title: "Summary Ranges",
      difficulty: "Easy",
      prompt: "Given a sorted unique integer array, return the smallest list of ranges that cover all the numbers exactly, like '0->2'.",
      tell: "\"Ranges\" over sorted values: extend the current range while the next number is consecutive, otherwise close it and start another.",
    },
    {
      slug: "merge-intervals",
      title: "Merge Intervals",
      difficulty: "Medium",
      prompt: "Merge all overlapping intervals and return the non-overlapping intervals that cover the input.",
      tell: "\"Merge\" \"overlapping\" \"intervals\": sort by start, extend the last kept or start a new one.",
    },
    {
      slug: "insert-interval",
      title: "Insert Interval",
      difficulty: "Medium",
      prompt: "Insert a new interval into a sorted list of non-overlapping intervals, merging where necessary.",
      tell: "Already sorted, so \"insert\" is three phases: copy intervals ending before it, merge every overlapping one into it, copy the rest. O(n), no sort.",
    },
    {
      slug: "non-overlapping-intervals",
      title: "Non-overlapping Intervals",
      difficulty: "Medium",
      prompt: "Return the minimum number of intervals to remove so the rest are non-overlapping.",
      tell: "Fewest removals is the same as most \"non-overlapping\" kept: greedy by earliest end.",
      alsoAccept: ["greedy"],
    },
    {
      slug: "minimum-number-of-arrows-to-burst-balloons",
      title: "Minimum Number of Arrows to Burst Balloons",
      difficulty: "Medium",
      prompt: "Balloons span horizontal ranges with a start and end. An arrow shot vertically bursts every balloon it touches. Return the minimum arrows needed.",
      tell: "\"Balloons\" as ranges: sort by end, shoot at the first end, skip every balloon that covers it.",
      alsoAccept: ["greedy"],
    },
    {
      slug: "interval-list-intersections",
      title: "Interval List Intersections",
      difficulty: "Medium",
      prompt: "Given two lists of disjoint, sorted intervals, return the intersection of the two lists.",
      tell: "Two sorted \"intervals\" lists: one pointer each, record max(starts) to min(ends) if valid, advance whichever ends first.",
      alsoAccept: ["two-pointers"],
    },
    {
      slug: "car-pooling",
      title: "Car Pooling",
      difficulty: "Medium",
      prompt: "A car with a given capacity drives east. Trips pick up passengers at one point and drop them at another. Can it complete every trip?",
      tell: "\"Passengers\" on board over distance: a sweep line of +pickups and -drop-offs. A difference array works too, since positions are small.",
      alsoAccept: ["prefix-sum"],
    },
    {
      slug: "my-calendar-i",
      title: "My Calendar I",
      difficulty: "Medium",
      prompt: "Implement a calendar that adds a booking [start, end) only if it causes no double booking with an existing event.",
      tell: "\"Booking\" without double booking: check the new interval against the neighbours in sorted order (a list, or a balanced tree at scale).",
    },
    {
      slug: "minimum-interval-to-include-each-query",
      title: "Minimum Interval to Include Each Query",
      difficulty: "Hard",
      prompt: "For each query point, return the size of the smallest interval that contains it, or -1.",
      tell: "Offline queries over \"intervals\": sort both, push intervals that start before the query into a min-heap by size, pop the ones that end before it.",
      alsoAccept: ["heap"],
    },
  ],
};
