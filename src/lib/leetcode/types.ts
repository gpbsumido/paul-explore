/** How LeetCode labels a problem. */
export type Difficulty = "Easy" | "Medium" | "Hard";

/**
 * Roadmap phase. 1 is the array and string toolkit everything else leans on,
 * 4 is the optimisation material that assumes the rest.
 */
export type Phase = 1 | 2 | 3 | 4;

/**
 * A phrase that, when it shows up in a problem statement, points at a pattern.
 * `phrase` is lowercase and matched as a whole-word prefix, so "subarray" also
 * catches "subarrays". `weight` is for the phrases that very nearly decide it
 * on their own ("kth largest", "prerequisites"); everything else counts once.
 */
export type Signal = {
  phrase: string;
  why: string;
  weight?: number;
};

/**
 * One check on a snippet: an expression evaluated after the snippet's code,
 * and the value it should produce. Kept as source so the page can show it as
 * "input → expected" and the test can run it.
 */
export type SnippetCase = {
  call: string;
  expected: unknown;
};

/** A block of TypeScript on the page, with the cases that prove it works. */
export type CodeExample = {
  title: string;
  explanation: string;
  code: string;
  cases: SnippetCase[];
};

/**
 * A LeetCode problem in a pattern's ladder. `slug` is LeetCode's URL slug and
 * also the key progress is stored under, so it never changes once published.
 * `prompt` is my own paraphrase, used as the drill card; `tell` is the wording
 * that gives the pattern away and why.
 */
export type Problem = {
  slug: string;
  title: string;
  difficulty: Difficulty;
  prompt: string;
  tell: string;
  alsoAccept?: string[];
};

export type Pattern = {
  id: string;
  name: string;
  phase: Phase;
  tagline: string;
  summary: string;
  question: string;
  signals: Signal[];
  antiSignals: string[];
  complexity: { time: string; space: string };
  template: CodeExample;
  variants: CodeExample[];
  pitfalls: string[];
  jsNotes: string[];
  deepDive?: string;
  prerequisites: string[];
  problems: Problem[];
};
