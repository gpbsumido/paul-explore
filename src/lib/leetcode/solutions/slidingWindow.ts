import type { Solution } from "../types";

export const slidingWindowSolutions: Record<string, Solution> = {
  "best-time-to-buy-and-sell-stock": {
    approach: [
      "The best sale on any day uses the cheapest price before it.",
      "Walk the prices once, tracking the lowest price so far.",
      "At each day, compare selling today against the best profit so far.",
    ],
    complexity: { time: "O(n)", space: "O(1)" },
    code: `function maxProfit(prices: number[]): number {
  let lowest = Infinity;
  let best = 0;
  for (const price of prices) {
    lowest = Math.min(lowest, price);
    best = Math.max(best, price - lowest);
  }
  return best;
}`,
    cases: [
      { call: "maxProfit([7, 1, 5, 3, 6, 4])", expected: 5 },
      { call: "maxProfit([7, 6, 4, 3, 1])", expected: 0 },
    ],
  },

  "maximum-average-subarray-i": {
    approach: [
      "Sum the first k numbers.",
      "Slide the fixed-size window one step at a time: add the number coming in and subtract the one going out.",
      "Keep the largest sum and divide by k at the end.",
    ],
    complexity: { time: "O(n)", space: "O(1)" },
    code: `function findMaxAverage(nums: number[], k: number): number {
  let sum = 0;
  for (let i = 0; i < k; i++) sum += nums[i];
  let best = sum;
  for (let i = k; i < nums.length; i++) {
    sum += nums[i] - nums[i - k];
    best = Math.max(best, sum);
  }
  return best / k;
}`,
    cases: [
      { call: "findMaxAverage([1, 12, -5, -6, 50, 3], 4)", expected: 12.75 },
      { call: "findMaxAverage([5], 1)", expected: 5 },
    ],
  },

  "longest-substring-without-repeating-characters": {
    approach: [
      "Grow a window to the right one character at a time.",
      "Remember the last index of every character. If the new character was last seen inside the window, jump the left edge past it.",
      "The window never holds a repeat, so its width is a candidate answer at every step.",
    ],
    complexity: { time: "O(n)", space: "O(k)" },
    code: `function lengthOfLongestSubstring(s: string): number {
  const lastSeen = new Map<string, number>();
  let left = 0;
  let best = 0;
  for (let right = 0; right < s.length; right++) {
    const previous = lastSeen.get(s[right]);
    if (previous !== undefined && previous >= left) left = previous + 1;
    lastSeen.set(s[right], right);
    best = Math.max(best, right - left + 1);
  }
  return best;
}`,
    cases: [
      { call: 'lengthOfLongestSubstring("abcabcbb")', expected: 3 },
      { call: 'lengthOfLongestSubstring("bbbbb")', expected: 1 },
      { call: 'lengthOfLongestSubstring("pwwkew")', expected: 3 },
    ],
  },

  "longest-repeating-character-replacement": {
    approach: [
      "A window is fixable if its length minus its most common letter's count is at most k.",
      "Grow the window right, counting letters and tracking the highest count seen.",
      "When the window needs more than k changes, slide the left edge one step. The best count never has to go down, because only a higher one could make a longer answer.",
    ],
    complexity: { time: "O(n)", space: "O(1)" },
    code: `function characterReplacement(s: string, k: number): number {
  const counts = new Array<number>(26).fill(0);
  let left = 0;
  let maxCount = 0;
  let best = 0;
  for (let right = 0; right < s.length; right++) {
    const index = s.charCodeAt(right) - 65;
    counts[index]++;
    maxCount = Math.max(maxCount, counts[index]);
    while (right - left + 1 - maxCount > k) {
      counts[s.charCodeAt(left) - 65]--;
      left++;
    }
    best = Math.max(best, right - left + 1);
  }
  return best;
}`,
    cases: [
      { call: 'characterReplacement("ABAB", 2)', expected: 4 },
      { call: 'characterReplacement("AABABBA", 1)', expected: 4 },
    ],
  },

  "permutation-in-string": {
    approach: [
      "A permutation of s1 is any window of s2 with the same letter counts.",
      "Count s1, then slide a window of s1's length across s2, adding the entering letter and removing the leaving one.",
      "If the two count arrays ever match, a permutation is there.",
    ],
    complexity: { time: "O(n)", space: "O(1)" },
    code: `function checkInclusion(s1: string, s2: string): boolean {
  if (s1.length > s2.length) return false;
  const need = new Array<number>(26).fill(0);
  const windowCounts = new Array<number>(26).fill(0);
  for (let i = 0; i < s1.length; i++) {
    need[s1.charCodeAt(i) - 97]++;
    windowCounts[s2.charCodeAt(i) - 97]++;
  }
  const same = () => need.every((count, i) => count === windowCounts[i]);
  if (same()) return true;
  for (let right = s1.length; right < s2.length; right++) {
    windowCounts[s2.charCodeAt(right) - 97]++;
    windowCounts[s2.charCodeAt(right - s1.length) - 97]--;
    if (same()) return true;
  }
  return false;
}`,
    cases: [
      { call: 'checkInclusion("ab", "eidbaooo")', expected: true },
      { call: 'checkInclusion("ab", "eidboaoo")', expected: false },
    ],
  },

  "minimum-size-subarray-sum": {
    approach: [
      "All numbers are positive, so growing the window only raises the sum and shrinking only lowers it.",
      "Extend right, adding to the sum.",
      "While the sum reaches the target, record the width and drop the left value. Return 0 if nothing ever reached it.",
    ],
    complexity: { time: "O(n)", space: "O(1)" },
    code: `function minSubArrayLen(target: number, nums: number[]): number {
  let left = 0;
  let sum = 0;
  let best = Infinity;
  for (let right = 0; right < nums.length; right++) {
    sum += nums[right];
    while (sum >= target) {
      best = Math.min(best, right - left + 1);
      sum -= nums[left++];
    }
  }
  return best === Infinity ? 0 : best;
}`,
    cases: [
      { call: "minSubArrayLen(7, [2, 3, 1, 2, 4, 3])", expected: 2 },
      { call: "minSubArrayLen(4, [1, 4, 4])", expected: 1 },
      { call: "minSubArrayLen(11, [1, 1, 1, 1, 1, 1, 1, 1])", expected: 0 },
    ],
  },

  "fruit-into-baskets": {
    approach: [
      "This is the longest window with at most two distinct values.",
      "Grow right, counting each fruit type in a Map.",
      "When a third type appears, shrink from the left until one type's count hits zero and it's deleted.",
    ],
    complexity: { time: "O(n)", space: "O(1)" },
    code: `function totalFruit(fruits: number[]): number {
  const counts = new Map<number, number>();
  let left = 0;
  let best = 0;
  for (let right = 0; right < fruits.length; right++) {
    counts.set(fruits[right], (counts.get(fruits[right]) ?? 0) + 1);
    while (counts.size > 2) {
      const fruit = fruits[left++];
      const remaining = (counts.get(fruit) ?? 0) - 1;
      if (remaining === 0) counts.delete(fruit);
      else counts.set(fruit, remaining);
    }
    best = Math.max(best, right - left + 1);
  }
  return best;
}`,
    cases: [
      { call: "totalFruit([1, 2, 1])", expected: 3 },
      { call: "totalFruit([0, 1, 2, 2])", expected: 3 },
      { call: "totalFruit([1, 2, 3, 2, 2])", expected: 4 },
    ],
  },

  "max-consecutive-ones-iii": {
    approach: [
      "Look for the longest window containing at most k zeroes, since those are the ones that get flipped.",
      "Grow right, counting zeroes.",
      "When there are more than k, move left forward until one zero leaves the window.",
    ],
    complexity: { time: "O(n)", space: "O(1)" },
    code: `function longestOnes(nums: number[], k: number): number {
  let left = 0;
  let zeroes = 0;
  let best = 0;
  for (let right = 0; right < nums.length; right++) {
    if (nums[right] === 0) zeroes++;
    while (zeroes > k) {
      if (nums[left] === 0) zeroes--;
      left++;
    }
    best = Math.max(best, right - left + 1);
  }
  return best;
}`,
    cases: [
      { call: "longestOnes([1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0], 2)", expected: 6 },
      { call: "longestOnes([0, 0, 1, 1, 0, 0, 1, 1, 1, 0, 1, 1, 0, 0, 0, 1, 1, 1, 1], 3)", expected: 10 },
    ],
  },

  "minimum-window-substring": {
    approach: [
      "Count what t needs, and track how many distinct characters are still short.",
      "Grow right. When a character's need drops to zero, one fewer is missing.",
      "While nothing is missing, the window is valid: record it if it's the smallest, then give back the left character and move left on.",
    ],
    complexity: { time: "O(m + n)", space: "O(k)" },
    code: `function minWindow(s: string, t: string): string {
  const need = new Map<string, number>();
  for (const ch of t) need.set(ch, (need.get(ch) ?? 0) + 1);
  let missing = need.size;
  let left = 0;
  let bestStart = 0;
  let bestLength = Infinity;
  for (let right = 0; right < s.length; right++) {
    const entering = s[right];
    if (need.has(entering)) {
      const count = (need.get(entering) ?? 0) - 1;
      need.set(entering, count);
      if (count === 0) missing--;
    }
    while (missing === 0) {
      if (right - left + 1 < bestLength) {
        bestStart = left;
        bestLength = right - left + 1;
      }
      const leaving = s[left++];
      if (need.has(leaving)) {
        const count = (need.get(leaving) ?? 0) + 1;
        need.set(leaving, count);
        if (count === 1) missing++;
      }
    }
  }
  return bestLength === Infinity ? "" : s.slice(bestStart, bestStart + bestLength);
}`,
    cases: [
      { call: 'minWindow("ADOBECODEBANC", "ABC")', expected: "BANC" },
      { call: 'minWindow("a", "a")', expected: "a" },
      { call: 'minWindow("a", "aa")', expected: "" },
    ],
  },

  "sliding-window-maximum": {
    approach: [
      "Keep a deque of indices whose values are decreasing from front to back.",
      "Before adding an index, pop smaller values off the back, because they can never be a maximum again.",
      "Drop the front if it has left the window. Once the window is full, the front is its maximum.",
    ],
    complexity: { time: "O(n)", space: "O(k)" },
    code: `function maxSlidingWindow(nums: number[], k: number): number[] {
  const deque: number[] = [];
  let head = 0;
  const result: number[] = [];
  for (let i = 0; i < nums.length; i++) {
    while (deque.length > head && nums[deque[deque.length - 1]] <= nums[i]) deque.pop();
    deque.push(i);
    if (deque[head] <= i - k) head++;
    if (i >= k - 1) result.push(nums[deque[head]]);
  }
  return result;
}`,
    cases: [
      { call: "maxSlidingWindow([1, 3, -1, -3, 5, 3, 6, 7], 3)", expected: [3, 3, 5, 5, 6, 7] },
      { call: "maxSlidingWindow([1], 1)", expected: [1] },
    ],
  },
};
