import type { Solution } from "../types";

export const twoPointersSolutions: Record<string, Solution> = {
  "valid-palindrome": {
    approach: [
      "Put one pointer at each end of the string.",
      "Skip anything that isn't a letter or digit on either side.",
      "Compare the two characters lowercased. A mismatch means it isn't a palindrome; otherwise move both inward until they meet.",
    ],
    complexity: { time: "O(n)", space: "O(1)" },
    code: `function isPalindrome(s: string): boolean {
  const isAlnum = (ch: string) => /[a-z0-9]/i.test(ch);
  let left = 0;
  let right = s.length - 1;
  while (left < right) {
    if (!isAlnum(s[left])) left++;
    else if (!isAlnum(s[right])) right--;
    else {
      if (s[left].toLowerCase() !== s[right].toLowerCase()) return false;
      left++;
      right--;
    }
  }
  return true;
}`,
    cases: [
      { call: 'isPalindrome("A man, a plan, a canal: Panama")', expected: true },
      { call: 'isPalindrome("race a car")', expected: false },
      { call: 'isPalindrome(" ")', expected: true },
    ],
  },

  "merge-sorted-array": {
    approach: [
      "Fill nums1 from the back, where the free space is, so nothing gets overwritten before it's read.",
      "Keep a pointer at the end of each array's real values and one at the last slot.",
      "Write the larger of the two values into the slot and step that pointer back. Once nums2 runs out, what's left of nums1 is already in place.",
    ],
    complexity: { time: "O(m + n)", space: "O(1)" },
    code: `function merge(nums1: number[], m: number, nums2: number[], n: number): void {
  let i = m - 1;
  let j = n - 1;
  for (let write = m + n - 1; j >= 0; write--) {
    if (i >= 0 && nums1[i] > nums2[j]) nums1[write] = nums1[i--];
    else nums1[write] = nums2[j--];
  }
}`,
    cases: [
      { call: "(() => { const a = [1, 2, 3, 0, 0, 0]; merge(a, 3, [2, 5, 6], 3); return a; })()", expected: [1, 2, 2, 3, 5, 6] },
      { call: "(() => { const a = [0]; merge(a, 0, [1], 1); return a; })()", expected: [1] },
    ],
  },

  "move-zeroes": {
    approach: [
      "Keep a write pointer for where the next non-zero belongs.",
      "Scan with a read pointer, and swap each non-zero into the write position, then advance write.",
      "The swaps push the zeroes to the back while keeping the non-zeroes in order.",
    ],
    complexity: { time: "O(n)", space: "O(1)" },
    code: `function moveZeroes(nums: number[]): void {
  let write = 0;
  for (let read = 0; read < nums.length; read++) {
    if (nums[read] !== 0) {
      [nums[write], nums[read]] = [nums[read], nums[write]];
      write++;
    }
  }
}`,
    cases: [
      { call: "(() => { const a = [0, 1, 0, 3, 12]; moveZeroes(a); return a; })()", expected: [1, 3, 12, 0, 0] },
      { call: "(() => { const a = [0]; moveZeroes(a); return a; })()", expected: [0] },
    ],
  },

  "remove-duplicates-from-sorted-array": {
    approach: [
      "Because the array is sorted, duplicates sit next to each other.",
      "Keep a write pointer for the end of the unique prefix.",
      "Copy a value forward only when it differs from the last unique one. The write pointer is the count.",
    ],
    complexity: { time: "O(n)", space: "O(1)" },
    code: `function removeDuplicates(nums: number[]): number {
  if (nums.length === 0) return 0;
  let write = 1;
  for (let read = 1; read < nums.length; read++) {
    if (nums[read] !== nums[write - 1]) nums[write++] = nums[read];
  }
  return write;
}`,
    cases: [
      { call: "(() => { const a = [1, 1, 2]; const k = removeDuplicates(a); return a.slice(0, k); })()", expected: [1, 2] },
      { call: "(() => { const a = [0, 0, 1, 1, 1, 2, 2, 3, 3, 4]; const k = removeDuplicates(a); return a.slice(0, k); })()", expected: [0, 1, 2, 3, 4] },
    ],
  },

  "two-sum-ii-input-array-is-sorted": {
    approach: [
      "Start with one pointer at each end of the sorted array.",
      "If the pair sums too high, the right value is too big, so move right inward. If it's too low, move left inward.",
      "Stop when the sum hits the target and return the 1-based indices.",
    ],
    complexity: { time: "O(n)", space: "O(1)" },
    code: `function twoSum(numbers: number[], target: number): number[] {
  let left = 0;
  let right = numbers.length - 1;
  while (left < right) {
    const sum = numbers[left] + numbers[right];
    if (sum === target) return [left + 1, right + 1];
    if (sum < target) left++;
    else right--;
  }
  return [];
}`,
    cases: [
      { call: "twoSum([2, 7, 11, 15], 9)", expected: [1, 2] },
      { call: "twoSum([2, 3, 4], 6)", expected: [1, 3] },
      { call: "twoSum([-1, 0], -1)", expected: [1, 2] },
    ],
  },

  "3sum": {
    approach: [
      "Sort, then fix one number at a time and look for a pair after it that sums to its negative.",
      "The pair search is Two Sum II: two pointers closing in from both ends.",
      "Skip repeated values for the fixed number and after each match, so no triplet comes out twice.",
    ],
    complexity: { time: "O(n²)", space: "O(1)" },
    code: `function threeSum(nums: number[]): number[][] {
  const sorted = [...nums].sort((a, b) => a - b);
  const result: number[][] = [];
  for (let i = 0; i < sorted.length - 2; i++) {
    if (sorted[i] > 0) break;
    if (i > 0 && sorted[i] === sorted[i - 1]) continue;
    let left = i + 1;
    let right = sorted.length - 1;
    while (left < right) {
      const sum = sorted[i] + sorted[left] + sorted[right];
      if (sum < 0) left++;
      else if (sum > 0) right--;
      else {
        result.push([sorted[i], sorted[left], sorted[right]]);
        left++;
        right--;
        while (left < right && sorted[left] === sorted[left - 1]) left++;
      }
    }
  }
  return result;
}`,
    cases: [
      { call: "threeSum([-1, 0, 1, 2, -1, -4])", expected: [[-1, -1, 2], [-1, 0, 1]] },
      { call: "threeSum([0, 1, 1])", expected: [] },
      { call: "threeSum([0, 0, 0])", expected: [[0, 0, 0]] },
    ],
  },

  "container-with-most-water": {
    approach: [
      "Start with the widest container: one pointer at each end.",
      "The area is limited by the shorter wall, so moving the taller one inward can never help.",
      "Move the shorter wall inward each step and keep the best area seen.",
    ],
    complexity: { time: "O(n)", space: "O(1)" },
    code: `function maxArea(height: number[]): number {
  let left = 0;
  let right = height.length - 1;
  let best = 0;
  while (left < right) {
    best = Math.max(best, Math.min(height[left], height[right]) * (right - left));
    if (height[left] < height[right]) left++;
    else right--;
  }
  return best;
}`,
    cases: [
      { call: "maxArea([1, 8, 6, 2, 5, 4, 8, 3, 7])", expected: 49 },
      { call: "maxArea([1, 1])", expected: 1 },
    ],
  },

  "sort-colors": {
    approach: [
      "Dutch national flag: three pointers split the array into 0s, 1s, unknown and 2s.",
      "A 0 at mid swaps down to low, and both advance. A 1 just moves mid along.",
      "A 2 swaps up to high and high steps back, but mid stays put, because the value swapped in hasn't been looked at yet.",
    ],
    complexity: { time: "O(n)", space: "O(1)" },
    code: `function sortColors(nums: number[]): void {
  let low = 0;
  let mid = 0;
  let high = nums.length - 1;
  while (mid <= high) {
    if (nums[mid] === 0) {
      [nums[low], nums[mid]] = [nums[mid], nums[low]];
      low++;
      mid++;
    } else if (nums[mid] === 1) {
      mid++;
    } else {
      [nums[mid], nums[high]] = [nums[high], nums[mid]];
      high--;
    }
  }
}`,
    cases: [
      { call: "(() => { const a = [2, 0, 2, 1, 1, 0]; sortColors(a); return a; })()", expected: [0, 0, 1, 1, 2, 2] },
      { call: "(() => { const a = [2, 0, 1]; sortColors(a); return a; })()", expected: [0, 1, 2] },
    ],
  },

  "trapping-rain-water": {
    approach: [
      "Water above a bar is the lower of the tallest bar to its left and right, minus its own height.",
      "Walk two pointers inward, tracking the tallest bar seen from each side.",
      "Whichever side has the lower max is settled: its water depends only on that max, so add it and move that pointer.",
    ],
    complexity: { time: "O(n)", space: "O(1)" },
    code: `function trap(height: number[]): number {
  let left = 0;
  let right = height.length - 1;
  let leftMax = 0;
  let rightMax = 0;
  let water = 0;
  while (left < right) {
    leftMax = Math.max(leftMax, height[left]);
    rightMax = Math.max(rightMax, height[right]);
    if (leftMax < rightMax) {
      water += leftMax - height[left];
      left++;
    } else {
      water += rightMax - height[right];
      right--;
    }
  }
  return water;
}`,
    cases: [
      { call: "trap([0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1])", expected: 6 },
      { call: "trap([4, 2, 0, 3, 2, 5])", expected: 9 },
    ],
  },
};
