import type { Solution } from "../types";

export const greedySolutions: Record<string, Solution> = {
  "assign-cookies": {
    approach: [
      "Sort the children's greed and the cookie sizes.",
      "Give each cookie, smallest first, to the least greedy child it satisfies. A small cookie is useless to a greedier child.",
      "Count the children who get one.",
    ],
    complexity: { time: "O(n log n + m log m)", space: "O(1) extra" },
    code: `function findContentChildren(g: number[], s: number[]): number {
  const greed = [...g].sort((a, b) => a - b);
  const sizes = [...s].sort((a, b) => a - b);
  let child = 0;
  for (const size of sizes) {
    if (child < greed.length && size >= greed[child]) child++;
  }
  return child;
}`,
    cases: [
      { call: "findContentChildren([1, 2, 3], [1, 1])", expected: 1 },
      { call: "findContentChildren([1, 2], [1, 2, 3])", expected: 2 },
    ],
  },

  "lemonade-change": {
    approach: [
      "Only $5 and $10 bills are useful as change, so count those.",
      "A $10 needs one $5 back. A $20 needs $15: give a $10 and a $5 if you can, which saves the more flexible $5s, otherwise three $5s.",
      "If change ever can't be made, return false.",
    ],
    complexity: { time: "O(n)", space: "O(1)" },
    code: `function lemonadeChange(bills: number[]): boolean {
  let fives = 0;
  let tens = 0;
  for (const bill of bills) {
    if (bill === 5) fives++;
    else if (bill === 10) {
      if (fives === 0) return false;
      fives--;
      tens++;
    } else if (tens > 0 && fives > 0) {
      tens--;
      fives--;
    } else if (fives >= 3) {
      fives -= 3;
    } else {
      return false;
    }
  }
  return true;
}`,
    cases: [
      { call: "lemonadeChange([5, 5, 5, 10, 20])", expected: true },
      { call: "lemonadeChange([5, 5, 10, 10, 20])", expected: false },
    ],
  },

  "best-time-to-buy-and-sell-stock-ii": {
    approach: [
      "With unlimited trades, any rising run can be split into one-day rises.",
      "So add up every day-to-day increase and ignore the drops.",
    ],
    complexity: { time: "O(n)", space: "O(1)" },
    code: `function maxProfit(prices: number[]): number {
  let profit = 0;
  for (let i = 1; i < prices.length; i++) profit += Math.max(0, prices[i] - prices[i - 1]);
  return profit;
}`,
    cases: [
      { call: "maxProfit([7, 1, 5, 3, 6, 4])", expected: 7 },
      { call: "maxProfit([1, 2, 3, 4, 5])", expected: 4 },
      { call: "maxProfit([7, 6, 4, 3, 1])", expected: 0 },
    ],
  },

  "jump-game": {
    approach: [
      "Track the furthest index reachable so far.",
      "Walk forward. If you're ever standing past that reach, you're stuck.",
      "Otherwise stretch the reach with i + nums[i]. Getting to the end means it's reachable.",
    ],
    complexity: { time: "O(n)", space: "O(1)" },
    code: `function canJump(nums: number[]): boolean {
  let reach = 0;
  for (let i = 0; i < nums.length; i++) {
    if (i > reach) return false;
    reach = Math.max(reach, i + nums[i]);
  }
  return true;
}`,
    cases: [
      { call: "canJump([2, 3, 1, 1, 4])", expected: true },
      { call: "canJump([3, 2, 1, 0, 4])", expected: false },
    ],
  },

  "jump-game-ii": {
    approach: [
      "Think of it as BFS by levels: every index reachable with j jumps is one level.",
      "Walk forward, tracking the furthest point reachable from the current level.",
      "When you reach the end of the current level, take a jump, and the next level ends at that furthest point.",
    ],
    complexity: { time: "O(n)", space: "O(1)" },
    code: `function jump(nums: number[]): number {
  let jumps = 0;
  let levelEnd = 0;
  let furthest = 0;
  for (let i = 0; i < nums.length - 1; i++) {
    furthest = Math.max(furthest, i + nums[i]);
    if (i === levelEnd) {
      jumps++;
      levelEnd = furthest;
    }
  }
  return jumps;
}`,
    cases: [
      { call: "jump([2, 3, 1, 1, 4])", expected: 2 },
      { call: "jump([2, 3, 0, 1, 4])", expected: 2 },
      { call: "jump([0])", expected: 0 },
    ],
  },

  "gas-station": {
    approach: [
      "If the total gas is less than the total cost, no start works.",
      "Otherwise drive from station 0 with a running tank. Whenever it goes negative, no station from the current start up to here can be the start.",
      "So restart from the next station with an empty tank. The last restart is the answer.",
    ],
    complexity: { time: "O(n)", space: "O(1)" },
    code: `function canCompleteCircuit(gas: number[], cost: number[]): number {
  let total = 0;
  let tank = 0;
  let start = 0;
  for (let i = 0; i < gas.length; i++) {
    const net = gas[i] - cost[i];
    total += net;
    tank += net;
    if (tank < 0) {
      start = i + 1;
      tank = 0;
    }
  }
  return total < 0 ? -1 : start;
}`,
    cases: [
      { call: "canCompleteCircuit([1, 2, 3, 4, 5], [3, 4, 5, 1, 2])", expected: 3 },
      { call: "canCompleteCircuit([2, 3, 4], [3, 4, 3])", expected: -1 },
    ],
  },

  "hand-of-straights": {
    approach: [
      "Count every card value.",
      "The smallest card left has to start a group, because nothing smaller can come before it.",
      "Take values from the smallest up: if one still has n copies left, it starts n groups, each using one copy of the next groupSize values. A shortfall means it can't be done.",
    ],
    complexity: { time: "O(n log n)", space: "O(n)" },
    code: `function isNStraightHand(hand: number[], groupSize: number): boolean {
  if (hand.length % groupSize !== 0) return false;
  const counts = new Map<number, number>();
  for (const card of hand) counts.set(card, (counts.get(card) ?? 0) + 1);
  const values = [...counts.keys()].sort((a, b) => a - b);
  for (const start of values) {
    const groups = counts.get(start) ?? 0;
    if (groups === 0) continue;
    for (let v = start; v < start + groupSize; v++) {
      const have = counts.get(v) ?? 0;
      if (have < groups) return false;
      counts.set(v, have - groups);
    }
  }
  return true;
}`,
    cases: [
      { call: "isNStraightHand([1, 2, 3, 6, 2, 3, 4, 7, 8], 3)", expected: true },
      { call: "isNStraightHand([1, 2, 3, 4, 5], 4)", expected: false },
    ],
  },

  "partition-labels": {
    approach: [
      "Record the last index of every letter.",
      "Walk the string, stretching the current part's end to cover the last index of every letter seen.",
      "When the walk reaches that end, nothing inside the part appears later, so close it off and record its length.",
    ],
    complexity: { time: "O(n)", space: "O(1)" },
    code: `function partitionLabels(s: string): number[] {
  const last = new Map<string, number>();
  for (let i = 0; i < s.length; i++) last.set(s[i], i);
  const sizes: number[] = [];
  let start = 0;
  let end = 0;
  for (let i = 0; i < s.length; i++) {
    end = Math.max(end, last.get(s[i]) as number);
    if (i === end) {
      sizes.push(end - start + 1);
      start = i + 1;
    }
  }
  return sizes;
}`,
    cases: [
      { call: 'partitionLabels("ababcbacadefegdehijhklij")', expected: [9, 7, 8] },
      { call: 'partitionLabels("eccbbbbdec")', expected: [10] },
    ],
  },

  "valid-parenthesis-string": {
    approach: [
      "Track the range of how many '(' could be open: a low and a high count.",
      "'(' raises both and ')' lowers both. '*' could be either, so it lowers low and raises high.",
      "If high goes negative, there are too many ')'. Keep low at zero or above. The string is valid if low is 0 at the end.",
    ],
    complexity: { time: "O(n)", space: "O(1)" },
    code: `function checkValidString(s: string): boolean {
  let low = 0;
  let high = 0;
  for (const ch of s) {
    if (ch === "(") {
      low++;
      high++;
    } else if (ch === ")") {
      low--;
      high--;
    } else {
      low--;
      high++;
    }
    if (high < 0) return false;
    low = Math.max(low, 0);
  }
  return low === 0;
}`,
    cases: [
      { call: 'checkValidString("()")', expected: true },
      { call: 'checkValidString("(*)")', expected: true },
      { call: 'checkValidString("(*))")', expected: true },
      { call: 'checkValidString("(((*)")', expected: false },
    ],
  },

  "merge-triplets-to-form-target-triplet": {
    approach: [
      "Merging takes the max of each position, so any triplet with a value above the target's in some position can never be used.",
      "Of the triplets that are left, see which positions some triplet matches exactly.",
      "If all three positions are matched by usable triplets, merging them gives the target.",
    ],
    complexity: { time: "O(n)", space: "O(1)" },
    code: `function mergeTriplets(triplets: number[][], target: number[]): boolean {
  const matched = [false, false, false];
  for (const t of triplets) {
    if (t[0] > target[0] || t[1] > target[1] || t[2] > target[2]) continue;
    for (let i = 0; i < 3; i++) if (t[i] === target[i]) matched[i] = true;
  }
  return matched.every(Boolean);
}`,
    cases: [
      { call: "mergeTriplets([[2, 5, 3], [1, 8, 4], [1, 7, 5]], [2, 7, 5])", expected: true },
      { call: "mergeTriplets([[3, 4, 5], [4, 5, 6]], [3, 2, 5])", expected: false },
      { call: "mergeTriplets([[2, 5, 3], [2, 3, 4], [1, 2, 5], [5, 2, 3]], [5, 5, 5])", expected: true },
    ],
  },

  candy: {
    approach: [
      "Give everyone one candy.",
      "Left to right: a child rated higher than their left neighbour gets one more than that neighbour.",
      "Right to left: a child rated higher than their right neighbour needs more than that neighbour too, so take the max of what they have and right + 1. Sum it all.",
    ],
    complexity: { time: "O(n)", space: "O(n)" },
    code: `function candy(ratings: number[]): number {
  const candies = new Array<number>(ratings.length).fill(1);
  for (let i = 1; i < ratings.length; i++) {
    if (ratings[i] > ratings[i - 1]) candies[i] = candies[i - 1] + 1;
  }
  for (let i = ratings.length - 2; i >= 0; i--) {
    if (ratings[i] > ratings[i + 1]) candies[i] = Math.max(candies[i], candies[i + 1] + 1);
  }
  return candies.reduce((a, b) => a + b, 0);
}`,
    cases: [
      { call: "candy([1, 0, 2])", expected: 5 },
      { call: "candy([1, 2, 2])", expected: 4 },
      { call: "candy([1, 3, 2, 2, 1])", expected: 7 },
    ],
  },
};
