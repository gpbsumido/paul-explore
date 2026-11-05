import type { Pattern } from "../types";

export const greedy: Pattern = {
  id: "greedy",
  name: "Greedy",
  phase: 4,
  tagline: "Take the locally best move, but only once you can argue it never hurts.",
  summary:
    "A greedy solution commits to the best-looking choice at each step and never revisits it. It's often a single pass, which makes it tempting and dangerous: many problems that look greedy need DP. The discipline is the exchange argument. If some optimal answer made a different choice, could you swap in yours without making it worse? If yes, greedy is safe. Common shapes: track the farthest reachable point, sort and match smallest with smallest, reset when a running total goes negative.",
  question: "Is there a choice I can make now that provably never makes the final answer worse?",
  signals: [
    { phrase: "maximum number of", why: "Maximising a count with a simple local rule is often greedy." },
    { phrase: "minimum number of", why: "Minimum jumps, arrows or coins: check whether a greedy choice is provably safe." },
    { phrase: "jump", why: "Jump Game: track the farthest index reachable so far.", weight: 2 },
    { phrase: "reach the last index", why: "Reachability by farthest-reach greedy.", weight: 3 },
    { phrase: "gas station", why: "Reset the start whenever the tank goes negative.", weight: 3 },
    { phrase: "circuit", why: "A circular route with a running balance." },
    { phrase: "content children", why: "Assign Cookies: sort both and match the smallest cookie that works." },
    { phrase: "change", why: "Lemonade Change: hand back the largest bill that fits." },
    { phrase: "as many parts as possible", why: "Partition Labels: cut when you pass the last occurrence of everything seen.", weight: 2 },
    { phrase: "groups of size", why: "Hand of Straights: start each group at the smallest card left." },
    { phrase: "consecutive", why: "Building consecutive runs greedily from the smallest value." },
    { phrase: "wildcard", why: "Valid Parenthesis String: track the range of possible open counts." },
    { phrase: "candies", why: "Candy: one pass left to right, one right to left, take the max.", weight: 2 },
    { phrase: "as many transactions", why: "Unlimited trades: take every upward step.", weight: 2 },
  ],
  antiSignals: [
    "A counter-example breaks the local rule (coin change with coins 1, 3, 4 and amount 6): that's DP.",
    "The question asks for the number of ways: counting is almost never greedy.",
  ],
  complexity: { time: "O(n), or O(n log n) when you sort first", space: "O(1) to O(n)" },
  template: {
    title: "Farthest reach",
    explanation:
      "Jump Game: walk left to right keeping the farthest index you could reach. If you ever stand on an index beyond it, you're stuck. You never need to know which jumps you took, only how far they could take you.",
    code: `function canJump(nums: number[]): boolean {
  let farthest = 0;
  for (let i = 0; i < nums.length; i++) {
    if (i > farthest) return false;
    farthest = Math.max(farthest, i + nums[i]);
  }
  return true;
}`,
    cases: [
      { call: "canJump([2, 3, 1, 1, 4])", expected: true },
      { call: "canJump([3, 2, 1, 0, 4])", expected: false },
      { call: "canJump([0])", expected: true },
    ],
  },
  variants: [
    {
      title: "Reset when the running total goes negative",
      explanation:
        "Gas Station: if the total gas is at least the total cost, some start works. Whenever the tank drops below zero, no station from the current start up to here can be the answer, so start after it.",
      code: `function canCompleteCircuit(gas: number[], cost: number[]): number {
  let total = 0;
  let tank = 0;
  let start = 0;
  for (let i = 0; i < gas.length; i++) {
    const balance = gas[i] - cost[i];
    total += balance;
    tank += balance;
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
    {
      title: "Cut at the last occurrence",
      explanation:
        "Partition Labels: record where each letter last appears. Walk the string stretching the current part's end to cover every letter seen; when the index reaches that end, close the part.",
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
        { call: "partitionLabels('ababcbacadefegdehijhklij')", expected: [9, 7, 8] },
        { call: "partitionLabels('eccbbbbdec')", expected: [10] },
      ],
    },
  ],
  pitfalls: [
    "Trusting a greedy rule without trying to break it. Spend a minute hunting for a counter-example before coding.",
    "Coin change with arbitrary coins looks greedy and isn't.",
    "Sorting by the wrong key: intervals by end, not start, when maximising how many fit.",
  ],
  jsNotes: [
    "Default sort() compares as strings, so [10, 9, 1].sort() gives [1, 10, 9]. Always pass (a, b) => a - b.",
  ],
  prerequisites: ["intervals"],
  problems: [
    {
      slug: "assign-cookies",
      title: "Assign Cookies",
      difficulty: "Easy",
      prompt: "Each child has a greed factor and each cookie a size; a child is content with a cookie at least their greed. Return the maximum number of content children.",
      tell: "\"Maximum number of\" \"content children\": sort both, give each child the smallest cookie that satisfies them.",
    },
    {
      slug: "lemonade-change",
      title: "Lemonade Change",
      difficulty: "Easy",
      prompt: "Lemonade costs $5 and customers pay with $5, $10 or $20 bills in order. Can you give every customer correct change?",
      tell: "Giving \"change\": always hand back a $10 before two $5s, because $5s are more flexible.",
    },
    {
      slug: "best-time-to-buy-and-sell-stock-ii",
      title: "Best Time to Buy and Sell Stock II",
      difficulty: "Medium",
      prompt: "You may complete as many transactions as you like, holding at most one share at a time. Return the maximum profit.",
      tell: "\"As many transactions\" as you like: add up every positive day-to-day difference.",
    },
    {
      slug: "jump-game",
      title: "Jump Game",
      difficulty: "Medium",
      prompt: "Each element is your maximum jump length from that position. Can you reach the last index?",
      tell: "\"Jump\" and \"reach the last index\": track the farthest reachable index; fail if you outrun it.",
    },
    {
      slug: "jump-game-ii",
      title: "Jump Game II",
      difficulty: "Medium",
      prompt: "Return the minimum number of jumps to reach the last index, which is always reachable.",
      tell: "\"Minimum number of\" jumps: BFS by levels without a queue. Each jump covers a window; the next window ends at the farthest reach inside it.",
    },
    {
      slug: "gas-station",
      title: "Gas Station",
      difficulty: "Medium",
      prompt: "Stations on a circuit have gas and the cost to the next station. Return the starting station to travel around once, or -1.",
      tell: "\"Gas station\" \"circuit\": if total gas ≥ total cost a start exists; reset after any point the tank goes negative.",
    },
    {
      slug: "hand-of-straights",
      title: "Hand of Straights",
      difficulty: "Medium",
      prompt: "Can the cards be rearranged into groups of size groupSize, each of consecutive values?",
      tell: "\"Groups of size\" k of \"consecutive\" cards: the smallest card left must start a group, so count, sort, and consume runs.",
    },
    {
      slug: "partition-labels",
      title: "Partition Labels",
      difficulty: "Medium",
      prompt: "Partition the string into as many parts as possible so each letter appears in at most one part. Return the part sizes.",
      tell: "\"As many parts as possible\": record each letter's last index and close a part when you reach the furthest one seen.",
    },
    {
      slug: "valid-parenthesis-string",
      title: "Valid Parenthesis String",
      difficulty: "Medium",
      prompt: "A string has '(', ')' and '*', where '*' is a wildcard that can be '(', ')' or empty. Is it valid?",
      tell: "A \"wildcard\" makes the open count a range: track the min and max possible opens; fail if max goes negative, clamp min at zero.",
      alsoAccept: ["stack"],
    },
    {
      slug: "merge-triplets-to-form-target-triplet",
      title: "Merge Triplets to Form Target Triplet",
      difficulty: "Medium",
      prompt: "Merging two triplets takes the max of each position. Can you form the target triplet by merging some of the given triplets?",
      tell: "Ignore any triplet with a value above the target; check the rest cover each target position.",
    },
    {
      slug: "candy",
      title: "Candy",
      difficulty: "Hard",
      prompt: "Children stand in a line with ratings. Each gets at least one candy, and a child rated higher than a neighbour gets more candies. Return the minimum total.",
      tell: "\"Candies\" relative to both neighbours: one left-to-right pass, one right-to-left pass, take the max of each.",
    },
  ],
};
