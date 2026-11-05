import type { Pattern } from "../types";

export const bitManipulation: Pattern = {
  id: "bit-manipulation",
  name: "Bit Manipulation",
  phase: 4,
  tagline: "XOR cancels pairs, n & (n - 1) drops the lowest set bit.",
  summary:
    "A handful of identities cover most bit questions. XOR of a number with itself is 0 and with 0 is itself, so XOR-ing everything cancels every pair and leaves the odd one out. n & (n - 1) clears the lowest set bit, so looping it counts bits. Shifting and masking reads or sets bit i. Reach for these when the question says \"without extra space\", \"appears twice except one\", \"binary representation\", or forbids the + operator.",
  question: "Would looking at the numbers as bits make pairs cancel or the counting trivial?",
  signals: [
    { phrase: "appears twice", why: "Everything paired except one: XOR cancels the pairs.", weight: 3 },
    { phrase: "appears exactly once", why: "The odd element out of repeated ones.", weight: 2 },
    { phrase: "appears three times", why: "Count each bit position modulo three." },
    { phrase: "binary representation", why: "Asking about the bits directly.", weight: 2 },
    { phrase: "1 bits", why: "Counting set bits: n & (n - 1) or a shift loop.", weight: 3 },
    { phrase: "set bits", why: "Popcount questions." },
    { phrase: "reverse bits", why: "Shift bits out of one end and into the other.", weight: 3 },
    { phrase: "without using the operators", why: "Sum of Two Integers: XOR adds without carry, AND finds the carry.", weight: 3 },
    { phrase: "constant extra space", why: "A common nudge from a hash set towards XOR." },
    { phrase: "missing", why: "XOR every index and value; the missing number survives." },
    { phrase: "32-bit", why: "Signed 32-bit limits and unsigned shifts matter." },
    { phrase: "xor", why: "Named outright.", weight: 2 },
  ],
  antiSignals: [
    "Extra space is allowed and clarity matters more: a Set or a count Map is easier to explain.",
  ],
  complexity: { time: "O(n), or O(number of bits) per number", space: "O(1)" },
  template: {
    title: "XOR cancels every pair",
    explanation:
      "a ^ a is 0 and a ^ 0 is a, and XOR doesn't care about order. XOR the whole array and every pair cancels, leaving the single number. O(n) time, O(1) space.",
    code: `function singleNumber(nums: number[]): number {
  return nums.reduce((acc, n) => acc ^ n, 0);
}`,
    cases: [
      { call: "singleNumber([2, 2, 1])", expected: 1 },
      { call: "singleNumber([4, 1, 2, 1, 2])", expected: 4 },
    ],
  },
  variants: [
    {
      title: "Drop the lowest set bit",
      explanation: "n & (n - 1) clears the lowest 1 bit, so the loop runs once per set bit rather than once per bit position.",
      code: `function hammingWeight(n: number): number {
  let count = 0;
  while (n !== 0) {
    n &= n - 1;
    count++;
  }
  return count;
}`,
      cases: [
        { call: "hammingWeight(11)", expected: 3 },
        { call: "hammingWeight(128)", expected: 1 },
        { call: "hammingWeight(2147483645)", expected: 30 },
      ],
    },
    {
      title: "Bits from the smaller number: counting bits",
      explanation: "i >> 1 drops the last bit of i, so bits[i] = bits[i >> 1] + (i & 1). A one-line DP over the bits.",
      code: `function countBits(n: number): number[] {
  const bits = new Array<number>(n + 1).fill(0);
  for (let i = 1; i <= n; i++) bits[i] = bits[i >> 1] + (i & 1);
  return bits;
}`,
      cases: [
        { call: "countBits(5)", expected: [0, 1, 1, 2, 1, 2] },
        { call: "countBits(0)", expected: [0] },
      ],
    },
    {
      title: "Add without +",
      explanation:
        "XOR adds each bit without the carry; AND then shift left gives the carry. Repeat until there's no carry. JavaScript bitwise operators work on 32-bit integers, so negatives work too.",
      code: `function getSum(a: number, b: number): number {
  while (b !== 0) {
    const carry = (a & b) << 1;
    a ^= b;
    b = carry;
  }
  return a;
}`,
      cases: [
        { call: "getSum(1, 2)", expected: 3 },
        { call: "getSum(-2, 3)", expected: 1 },
      ],
    },
  ],
  pitfalls: [
    "Bitwise operators in JavaScript truncate to signed 32-bit integers, so values above 2^31 - 1 come out negative.",
    "Using >> where you meant >>>: >> copies the sign bit in, >>> fills with zeros.",
    "Operator precedence: n & 1 === 0 parses as n & (1 === 0). Parenthesise.",
  ],
  jsNotes: [
    "x >>> 0 reinterprets a signed 32-bit result as unsigned, which Reverse Bits needs for its answer.",
    "Number.prototype.toString(2) and parseInt(s, 2) are handy for checking your work, not for the answer.",
  ],
  prerequisites: ["arrays-hashing"],
  problems: [
    {
      slug: "single-number",
      title: "Single Number",
      difficulty: "Easy",
      prompt: "Every element appears twice except for one, which appears exactly once. Find it in linear time with constant extra space.",
      tell: "\"Appears twice\" except one, plus \"constant extra space\": XOR everything.",
    },
    {
      slug: "number-of-1-bits",
      title: "Number of 1 Bits",
      difficulty: "Easy",
      prompt: "Return the number of set bits (1 bits) in the binary representation of a positive integer.",
      tell: "Count \"1 bits\": n & (n - 1) drops one per loop.",
    },
    {
      slug: "counting-bits",
      title: "Counting Bits",
      difficulty: "Easy",
      prompt: "For every i from 0 to n, return the number of 1 bits in the binary representation of i.",
      tell: "\"1 bits\" for every i: bits[i] = bits[i >> 1] + (i & 1) reuses the smaller answer.",
      alsoAccept: ["dp-1d"],
    },
    {
      slug: "reverse-bits",
      title: "Reverse Bits",
      difficulty: "Easy",
      prompt: "Reverse the bits of a 32-bit unsigned integer.",
      tell: "\"Reverse bits\" of a \"32-bit\" value: shift the lowest bit of n into the result 32 times, then >>> 0.",
    },
    {
      slug: "missing-number",
      title: "Missing Number",
      difficulty: "Easy",
      prompt: "Given n distinct numbers from the range 0 to n, return the only number missing from the range.",
      tell: "The \"missing\" one: XOR every index and value, or subtract the sum from n(n + 1) / 2.",
      alsoAccept: ["arrays-hashing"],
    },
    {
      slug: "sum-of-two-integers",
      title: "Sum of Two Integers",
      difficulty: "Medium",
      prompt: "Return the sum of two integers without using the operators + and -.",
      tell: "\"Without using the operators\": XOR for the sum without carry, AND and shift for the carry, repeat.",
    },
    {
      slug: "reverse-integer",
      title: "Reverse Integer",
      difficulty: "Medium",
      prompt: "Reverse the digits of a signed 32-bit integer, returning 0 if the result overflows the 32-bit range.",
      tell: "Digits rather than bits, but it's about \"32-bit\" overflow: check the bounds before each multiply by 10.",
    },
    {
      slug: "single-number-ii",
      title: "Single Number II",
      difficulty: "Medium",
      prompt: "Every element appears three times except for one, which appears exactly once. Find it with constant extra space.",
      tell: "\"Appears three times\": count each bit position across all numbers modulo 3; the leftover bits are the answer.",
    },
  ],
};
