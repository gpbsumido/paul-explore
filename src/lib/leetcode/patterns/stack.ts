import type { Pattern } from "../types";

export const stack: Pattern = {
  id: "stack",
  name: "Stacks",
  phase: 1,
  tagline: "The most recent unfinished thing is the next one to finish.",
  summary:
    "A stack fits whenever the input nests: brackets, function calls, directories, expressions, collisions where the newest item interacts with the one just before it. Push when something opens, pop when it closes, and the top of the stack is always the innermost thing still open. When the question involves undoing, matching or evaluating in order, it's usually a stack.",
  question: "Does each new element only interact with the most recent unresolved one?",
  signals: [
    { phrase: "valid parentheses", why: "Matching brackets: push opens, pop on close and check the pair.", weight: 2 },
    { phrase: "parentheses", why: "Nested brackets are the canonical stack input." },
    { phrase: "brackets", why: "Each close must match the most recent open." },
    { phrase: "nested", why: "Nesting means the innermost open thing closes first." },
    { phrase: "reverse polish", why: "Postfix evaluation: push numbers, pop two on each operator.", weight: 2 },
    { phrase: "evaluate", why: "Evaluating expressions in order uses a stack of operands." },
    { phrase: "decode", why: "k[encoded] strings nest, so push the context on [ and pop on ]." },
    { phrase: "simplify", why: "Path simplification pushes directories and pops on '..'." },
    { phrase: "undo", why: "Undo is popping the most recent action." },
    { phrase: "minimum element in constant time", why: "Min Stack keeps the running min alongside each element.", weight: 2 },
    { phrase: "collide", why: "A new asteroid only collides with the most recent surviving one." },
    { phrase: "backspace", why: "Backspace pops the last character typed." },
    { phrase: "calculator", why: "Expression evaluation with precedence or parentheses uses a stack of saved state." },
    { phrase: "using only two stacks", why: "Queue from two stacks: pour the input stack into the output stack lazily." },
  ],
  antiSignals: [
    "You need the next greater or smaller element for every position: that's the monotonic stack, a specific shape covered on its own page.",
    "You need first-in, first-out order: that's a queue, usually for BFS.",
  ],
  complexity: { time: "O(n)", space: "O(n)" },
  template: {
    title: "Push on open, pop and check on close",
    explanation:
      "A Map from closer to opener keeps the check short. The string is valid only if every close matched and nothing is left open at the end.",
    code: `function isValid(s: string): boolean {
  const opener = new Map([[")", "("], ["]", "["], ["}", "{"]]);
  const open: string[] = [];
  for (const ch of s) {
    const expected = opener.get(ch);
    if (expected === undefined) open.push(ch);
    else if (open.pop() !== expected) return false;
  }
  return open.length === 0;
}`,
    cases: [
      { call: "isValid('()[]{}')", expected: true },
      { call: "isValid('(]')", expected: false },
      { call: "isValid('([)]')", expected: false },
      { call: "isValid('(')", expected: false },
    ],
  },
  variants: [
    {
      title: "Evaluate postfix",
      explanation: "Numbers go on the stack; an operator pops two, applies, and pushes the result. Note the order: the first pop is the right operand.",
      code: `function evalRPN(tokens: string[]): number {
  const values: number[] = [];
  for (const token of tokens) {
    if (!["+", "-", "*", "/"].includes(token)) {
      values.push(Number(token));
      continue;
    }
    const right = values.pop() as number;
    const left = values.pop() as number;
    if (token === "+") values.push(left + right);
    else if (token === "-") values.push(left - right);
    else if (token === "*") values.push(left * right);
    else values.push(Math.trunc(left / right));
  }
  return values[0];
}`,
      cases: [
        { call: "evalRPN(['2', '1', '+', '3', '*'])", expected: 9 },
        { call: "evalRPN(['4', '13', '5', '/', '+'])", expected: 6 },
        { call: "evalRPN(['10', '6', '9', '3', '+', '-11', '*', '/', '*', '17', '+', '5', '+'])", expected: 22 },
      ],
    },
    {
      title: "Save context on open, restore on close",
      explanation:
        "Decode String: on [ push the string built so far and the repeat count, then start fresh. On ] pop them and wrap the inner string. Any nested-grammar question has this shape.",
      code: `function decodeString(s: string): string {
  const saved: [string, number][] = [];
  let current = "";
  let count = 0;
  for (const ch of s) {
    if (ch >= "0" && ch <= "9") count = count * 10 + Number(ch);
    else if (ch === "[") {
      saved.push([current, count]);
      current = "";
      count = 0;
    } else if (ch === "]") {
      const [before, times] = saved.pop() as [string, number];
      current = before + current.repeat(times);
    } else current += ch;
  }
  return current;
}`,
      cases: [
        { call: "decodeString('3[a]2[bc]')", expected: "aaabcbc" },
        { call: "decodeString('3[a2[c]]')", expected: "accaccacc" },
      ],
    },
  ],
  pitfalls: [
    "Popping an empty stack. In JavaScript pop() returns undefined rather than throwing, so the bug hides. Here that's handled by comparing to the expected opener.",
    "Forgetting the final check that the stack is empty: '((' has no bad close but isn't valid.",
    "Getting operand order backwards for - and /.",
  ],
  jsNotes: [
    "An array is the stack: push, pop, and arr[arr.length - 1] (or arr.at(-1)) to peek. All O(1).",
    "Division in RPN truncates toward zero: Math.trunc, not Math.floor, which is wrong for negative results.",
  ],
  deepDive: "/learn/stacks-queues",
  prerequisites: [],
  problems: [
    {
      slug: "valid-parentheses",
      title: "Valid Parentheses",
      difficulty: "Easy",
      prompt: "Given a string of brackets ()[]{}, decide whether every bracket is closed by the same type in the correct order.",
      tell: "\"Brackets\" closed \"in the correct order\" means the most recent open must close first. Stack.",
    },
    {
      slug: "implement-queue-using-stacks",
      title: "Implement Queue using Stacks",
      difficulty: "Easy",
      prompt: "Implement a first-in first-out queue using only two stacks, with push, pop, peek and empty.",
      tell: "\"Using only two stacks\": push onto an input stack, and only when the output stack is empty pour everything across. Amortised O(1).",
    },
    {
      slug: "min-stack",
      title: "Min Stack",
      difficulty: "Medium",
      prompt: "Design a stack that supports push, pop, top, and retrieving the minimum element in constant time.",
      tell: "\"Minimum element in constant time\": store the running minimum with each pushed value, so popping restores the previous minimum.",
    },
    {
      slug: "evaluate-reverse-polish-notation",
      title: "Evaluate Reverse Polish Notation",
      difficulty: "Medium",
      prompt: "Evaluate an arithmetic expression given in reverse polish notation. Division truncates toward zero.",
      tell: "\"Reverse polish\" is postfix: push numbers, pop two per operator.",
    },
    {
      slug: "decode-string",
      title: "Decode String",
      difficulty: "Medium",
      prompt: "Decode a string like 3[a2[c]] where k[encoded] means repeat encoded k times. Brackets may be nested.",
      tell: "\"Nested\" brackets with a repeat count: save the outer string and count on a stack at [, restore at ].",
    },
    {
      slug: "asteroid-collision",
      title: "Asteroid Collision",
      difficulty: "Medium",
      prompt: "Asteroids move right if positive and left if negative. When two meet they collide and the smaller explodes. Return the state after all collisions.",
      tell: "A new left-mover can only \"collide\" with the most recent right-mover still alive: the top of the stack.",
    },
    {
      slug: "simplify-path",
      title: "Simplify Path",
      difficulty: "Medium",
      prompt: "Simplify an absolute Unix-style file path, resolving '.', '..' and repeated slashes, and return the canonical path.",
      tell: "Directories push and '..' pops the most recent one. \"Simplify\" a path is a stack of names joined with '/'.",
    },
    {
      slug: "basic-calculator",
      title: "Basic Calculator",
      difficulty: "Hard",
      prompt: "Evaluate a string expression with +, -, parentheses and spaces, without using eval.",
      tell: "A \"calculator\" with \"parentheses\": on ( push the running result and sign, on ) pop them and combine.",
    },
  ],
};
