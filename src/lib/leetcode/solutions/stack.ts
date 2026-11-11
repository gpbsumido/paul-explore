import type { Solution } from "../types";

export const stackSolutions: Record<string, Solution> = {
  "valid-parentheses": {
    approach: [
      "Push every opening bracket onto a stack.",
      "On a closing bracket, the top of the stack has to be its matching opener. If it isn't, or the stack is empty, it's invalid.",
      "The string is valid only if the stack is empty at the end.",
    ],
    complexity: { time: "O(n)", space: "O(n)" },
    code: `function isValid(s: string): boolean {
  const opener: Record<string, string> = { ")": "(", "]": "[", "}": "{" };
  const stack: string[] = [];
  for (const ch of s) {
    if (!(ch in opener)) stack.push(ch);
    else if (stack.pop() !== opener[ch]) return false;
  }
  return stack.length === 0;
}`,
    cases: [
      { call: 'isValid("()[]{}")', expected: true },
      { call: 'isValid("(]")', expected: false },
      { call: 'isValid("([)]")', expected: false },
      { call: 'isValid("{[]}")', expected: true },
    ],
  },

  "implement-queue-using-stacks": {
    approach: [
      "Push onto an inbox stack.",
      "To pop or peek, take from an outbox stack. Only when the outbox is empty, pour the whole inbox into it, which reverses the order so the oldest is on top.",
      "Each element moves at most twice, so every operation is amortised O(1).",
    ],
    complexity: { time: "O(1) amortised", space: "O(n)" },
    code: `class MyQueue {
  private inbox: number[] = [];
  private outbox: number[] = [];
  push(x: number): void {
    this.inbox.push(x);
  }
  pop(): number {
    this.refill();
    return this.outbox.pop() as number;
  }
  peek(): number {
    this.refill();
    return this.outbox[this.outbox.length - 1];
  }
  empty(): boolean {
    return this.inbox.length === 0 && this.outbox.length === 0;
  }
  private refill(): void {
    if (this.outbox.length > 0) return;
    while (this.inbox.length > 0) this.outbox.push(this.inbox.pop() as number);
  }
}`,
    cases: [
      {
        call: "(() => { const q = new MyQueue(); q.push(1); q.push(2); return [q.peek(), q.pop(), q.empty()]; })()",
        expected: [1, 1, false],
      },
      {
        call: "(() => { const q = new MyQueue(); q.push(1); q.pop(); q.push(2); q.push(3); return [q.pop(), q.pop(), q.empty()]; })()",
        expected: [2, 3, true],
      },
    ],
  },

  "min-stack": {
    approach: [
      "Store pairs on the stack: the value and the minimum of everything at or below it.",
      "On push, the new minimum is the smaller of the value and the current top's minimum.",
      "getMin reads the top's minimum, so popping restores the old minimum for free.",
    ],
    complexity: { time: "O(1)", space: "O(n)" },
    code: `class MinStack {
  private items: [number, number][] = [];
  push(val: number): void {
    const min = this.items.length === 0 ? val : Math.min(val, this.getMin());
    this.items.push([val, min]);
  }
  pop(): void {
    this.items.pop();
  }
  top(): number {
    return this.items[this.items.length - 1][0];
  }
  getMin(): number {
    return this.items[this.items.length - 1][1];
  }
}`,
    cases: [
      {
        call: "(() => { const s = new MinStack(); s.push(-2); s.push(0); s.push(-3); const a = s.getMin(); s.pop(); return [a, s.top(), s.getMin()]; })()",
        expected: [-3, 0, -2],
      },
      { call: "(() => { const s = new MinStack(); s.push(5); s.push(5); s.pop(); return s.getMin(); })()", expected: 5 },
    ],
  },

  "evaluate-reverse-polish-notation": {
    approach: [
      "Numbers go on a stack.",
      "An operator pops the right operand first, then the left, and pushes the result back.",
      "Division truncates toward zero, so use Math.trunc. The single value left is the answer.",
    ],
    complexity: { time: "O(n)", space: "O(n)" },
    code: `function evalRPN(tokens: string[]): number {
  const stack: number[] = [];
  for (const token of tokens) {
    if (token === "+" || token === "-" || token === "*" || token === "/") {
      const right = stack.pop() as number;
      const left = stack.pop() as number;
      if (token === "+") stack.push(left + right);
      else if (token === "-") stack.push(left - right);
      else if (token === "*") stack.push(left * right);
      else stack.push(Math.trunc(left / right));
    } else {
      stack.push(Number(token));
    }
  }
  return stack[0];
}`,
    cases: [
      { call: 'evalRPN(["2", "1", "+", "3", "*"])', expected: 9 },
      { call: 'evalRPN(["4", "13", "5", "/", "+"])', expected: 6 },
      { call: 'evalRPN(["10", "6", "9", "3", "+", "-11", "*", "/", "*", "17", "+", "5", "+"])', expected: 22 },
    ],
  },

  "decode-string": {
    approach: [
      "Read left to right, building the current string and the current repeat count.",
      "On '[', push the string so far and the count, then start both fresh.",
      "On ']', pop them back and set the string to the popped string plus the inner string repeated count times.",
    ],
    complexity: { time: "O(output)", space: "O(output)" },
    code: `function decodeString(s: string): string {
  const stack: [string, number][] = [];
  let current = "";
  let count = 0;
  for (const ch of s) {
    if (ch >= "0" && ch <= "9") {
      count = count * 10 + Number(ch);
    } else if (ch === "[") {
      stack.push([current, count]);
      current = "";
      count = 0;
    } else if (ch === "]") {
      const [before, times] = stack.pop() as [string, number];
      current = before + current.repeat(times);
    } else {
      current += ch;
    }
  }
  return current;
}`,
    cases: [
      { call: 'decodeString("3[a]2[bc]")', expected: "aaabcbc" },
      { call: 'decodeString("3[a2[c]]")', expected: "accaccacc" },
      { call: 'decodeString("2[abc]3[cd]ef")', expected: "abcabccdcdcdef" },
    ],
  },

  "asteroid-collision": {
    approach: [
      "The stack holds the asteroids still flying. Only a right-mover on the stack meeting a new left-mover can collide.",
      "While that's the case, compare sizes: the smaller one explodes, and equal sizes both explode.",
      "If the new asteroid survives, push it.",
    ],
    complexity: { time: "O(n)", space: "O(n)" },
    code: `function asteroidCollision(asteroids: number[]): number[] {
  const stack: number[] = [];
  for (const asteroid of asteroids) {
    let alive = true;
    while (alive && asteroid < 0 && stack.length > 0 && stack[stack.length - 1] > 0) {
      const top = stack[stack.length - 1];
      if (top < -asteroid) stack.pop();
      else {
        if (top === -asteroid) stack.pop();
        alive = false;
      }
    }
    if (alive) stack.push(asteroid);
  }
  return stack;
}`,
    cases: [
      { call: "asteroidCollision([5, 10, -5])", expected: [5, 10] },
      { call: "asteroidCollision([8, -8])", expected: [] },
      { call: "asteroidCollision([10, 2, -5])", expected: [10] },
      { call: "asteroidCollision([-2, -1, 1, 2])", expected: [-2, -1, 1, 2] },
    ],
  },

  "simplify-path": {
    approach: [
      "Split on '/' and walk the parts.",
      "Skip empty parts and '.'. A '..' pops the last directory, if there is one.",
      "Anything else is a directory name to push. Join the stack with '/' and put a '/' in front.",
    ],
    complexity: { time: "O(n)", space: "O(n)" },
    code: `function simplifyPath(path: string): string {
  const stack: string[] = [];
  for (const part of path.split("/")) {
    if (part === "" || part === ".") continue;
    if (part === "..") stack.pop();
    else stack.push(part);
  }
  return "/" + stack.join("/");
}`,
    cases: [
      { call: 'simplifyPath("/home/")', expected: "/home" },
      { call: 'simplifyPath("/home//foo/")', expected: "/home/foo" },
      { call: 'simplifyPath("/../")', expected: "/" },
      { call: 'simplifyPath("/a/./b/../../c/")', expected: "/c" },
    ],
  },

  "basic-calculator": {
    approach: [
      "Keep a running result and the sign of the next term.",
      "Digits build a number. A '+' or '-' adds the finished number with its sign to the result and sets the next sign.",
      "On '(', push the result and sign and start fresh. On ')', finish the inner result, multiply by the pushed sign and add the pushed result.",
    ],
    complexity: { time: "O(n)", space: "O(n)" },
    code: `function calculate(s: string): number {
  const stack: number[] = [];
  let result = 0;
  let sign = 1;
  let num = 0;
  for (const ch of s) {
    if (ch >= "0" && ch <= "9") {
      num = num * 10 + Number(ch);
    } else if (ch === "+" || ch === "-") {
      result += sign * num;
      num = 0;
      sign = ch === "+" ? 1 : -1;
    } else if (ch === "(") {
      stack.push(result, sign);
      result = 0;
      sign = 1;
    } else if (ch === ")") {
      result += sign * num;
      num = 0;
      const outerSign = stack.pop() as number;
      const outerResult = stack.pop() as number;
      result = outerResult + outerSign * result;
    }
  }
  return result + sign * num;
}`,
    cases: [
      { call: 'calculate("1 + 1")', expected: 2 },
      { call: 'calculate(" 2-1 + 2 ")', expected: 3 },
      { call: 'calculate("(1+(4+5+2)-3)+(6+8)")', expected: 23 },
      { call: 'calculate("-(2 + 3)")', expected: -5 },
    ],
  },
};
