import type { Solution } from "../types";

export const bitManipulationSolutions: Record<string, Solution> = {
  "single-number": {
    approach: [
      "XOR cancels pairs: x ^ x is 0 and x ^ 0 is x, in any order.",
      "XOR every number together. All the pairs cancel and the single number is what's left.",
    ],
    complexity: { time: "O(n)", space: "O(1)" },
    code: `function singleNumber(nums: number[]): number {
  return nums.reduce((acc, n) => acc ^ n, 0);
}`,
    cases: [
      { call: "singleNumber([2, 2, 1])", expected: 1 },
      { call: "singleNumber([4, 1, 2, 1, 2])", expected: 4 },
    ],
  },

  "number-of-1-bits": {
    approach: [
      "n & (n - 1) clears the lowest set bit.",
      "Repeat until n is 0, and count the steps. The loop runs once per 1 bit.",
      "Use >>> 0 first so a value with the top bit set is treated as unsigned.",
    ],
    complexity: { time: "O(set bits)", space: "O(1)" },
    code: `function hammingWeight(n: number): number {
  let value = n >>> 0;
  let count = 0;
  while (value !== 0) {
    value = (value & (value - 1)) >>> 0;
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

  "counting-bits": {
    approach: [
      "i has the same bits as i >> 1, plus its lowest bit.",
      "So bits[i] = bits[i >> 1] + (i & 1), built up from 0.",
    ],
    complexity: { time: "O(n)", space: "O(n)" },
    code: `function countBits(n: number): number[] {
  const bits = new Array<number>(n + 1).fill(0);
  for (let i = 1; i <= n; i++) bits[i] = bits[i >> 1] + (i & 1);
  return bits;
}`,
    cases: [
      { call: "countBits(2)", expected: [0, 1, 1] },
      { call: "countBits(5)", expected: [0, 1, 1, 2, 1, 2] },
    ],
  },

  "reverse-bits": {
    approach: [
      "Do 32 rounds. Each round shifts the result left and moves n's lowest bit into it, then shifts n right.",
      "JavaScript bitwise operators work on signed 32-bit ints, so finish with >>> 0 to read the result as unsigned.",
    ],
    complexity: { time: "O(1)", space: "O(1)" },
    code: `function reverseBits(n: number): number {
  let result = 0;
  let value = n;
  for (let i = 0; i < 32; i++) {
    result = (result << 1) | (value & 1);
    value >>>= 1;
  }
  return result >>> 0;
}`,
    cases: [
      { call: "reverseBits(43261596)", expected: 964176192 },
      { call: "reverseBits(4294967293)", expected: 3221225471 },
    ],
  },

  "missing-number": {
    approach: [
      "XOR every index 0..n with every value. Every number that's there shows up twice and cancels.",
      "The one left over is missing. Using the sum formula works too.",
    ],
    complexity: { time: "O(n)", space: "O(1)" },
    code: `function missingNumber(nums: number[]): number {
  let result = nums.length;
  nums.forEach((n, i) => {
    result ^= i ^ n;
  });
  return result;
}`,
    cases: [
      { call: "missingNumber([3, 0, 1])", expected: 2 },
      { call: "missingNumber([0, 1])", expected: 2 },
      { call: "missingNumber([9, 6, 4, 2, 3, 5, 7, 0, 1])", expected: 8 },
    ],
  },

  "sum-of-two-integers": {
    approach: [
      "XOR adds without carrying. AND, shifted left one place, gives the carries.",
      "Repeat with the partial sum and the carries until there's nothing left to carry.",
      "JavaScript's 32-bit bitwise operators make negative numbers work the same way.",
    ],
    complexity: { time: "O(1)", space: "O(1)" },
    code: `function getSum(a: number, b: number): number {
  let sum = a;
  let carry = b;
  while (carry !== 0) {
    const partial = sum ^ carry;
    carry = (sum & carry) << 1;
    sum = partial;
  }
  return sum;
}`,
    cases: [
      { call: "getSum(1, 2)", expected: 3 },
      { call: "getSum(2, 3)", expected: 5 },
      { call: "getSum(-2, 3)", expected: 1 },
    ],
  },

  "reverse-integer": {
    approach: [
      "Pop digits off the end with % 10 and push them onto the result with result × 10 + digit.",
      "Math.trunc keeps the sign behaving properly for negative numbers.",
      "If the result goes outside the 32-bit signed range, return 0.",
    ],
    complexity: { time: "O(log x)", space: "O(1)" },
    code: `function reverse(x: number): number {
  let value = x;
  let result = 0;
  while (value !== 0) {
    result = result * 10 + (value % 10);
    value = Math.trunc(value / 10);
  }
  if (result > 2147483647 || result < -2147483648) return 0;
  return result;
}`,
    cases: [
      { call: "reverse(123)", expected: 321 },
      { call: "reverse(-123)", expected: -321 },
      { call: "reverse(120)", expected: 21 },
      { call: "reverse(1534236469)", expected: 0 },
    ],
  },

  "single-number-ii": {
    approach: [
      "Every other number appears three times, so count each bit position across all the numbers.",
      "At any position where the count isn't a multiple of 3, the single number has that bit set.",
      "Build it bit by bit. The | operator gives a signed 32-bit result, so negatives come out correctly.",
    ],
    complexity: { time: "O(32 · n)", space: "O(1)" },
    code: `function singleNumber(nums: number[]): number {
  let result = 0;
  for (let bit = 0; bit < 32; bit++) {
    let count = 0;
    for (const n of nums) count += (n >> bit) & 1;
    if (count % 3 !== 0) result |= 1 << bit;
  }
  return result;
}`,
    cases: [
      { call: "singleNumber([2, 2, 3, 2])", expected: 3 },
      { call: "singleNumber([0, 1, 0, 1, 0, 1, 99])", expected: 99 },
      { call: "singleNumber([-2, -2, 1, 1, 4, 1, 4, 4, -4, -2])", expected: -4 },
    ],
  },
};
