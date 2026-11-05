import { PATTERNS } from "./patterns";

export type PatternMatch = {
  patternId: string;
  score: number;
  matchedPhrases: string[];
};

export type TextSpan = { start: number; end: number };

/** Escapes regex metacharacters so a phrase matches literally. */
function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Matches a phrase at the start of a word and lets it run on, so "subarray"
 * catches "subarrays" but "stack" does not catch "haystack".
 */
function phrasePattern(phrase: string, flags: string): RegExp {
  return new RegExp(`\\b${escapeRegExp(phrase)}`, flags);
}

/**
 * Ranks patterns by how many of their signal phrases appear in a problem
 * statement.
 *
 * Deliberately dumb: a weighted count of phrase hits, no NLP. That is the
 * point of the finder. It should do exactly what I want to do in my head when
 * I read a problem, which is spot the handful of phrases that give it away,
 * and the matched phrases are returned so the page can show which ones did.
 *
 * @param text - A problem statement, pasted or typed.
 * @returns Patterns with at least one hit, best first; ties keep roadmap order.
 */
export function rankPatternsForText(text: string): PatternMatch[] {
  return PATTERNS
    .map((pattern, order) => {
      const hits = pattern.signals.filter((s) => phrasePattern(s.phrase, "i").test(text));
      return {
        order,
        patternId: pattern.id,
        score: hits.reduce((sum, s) => sum + (s.weight ?? 1), 0),
        matchedPhrases: hits.map((s) => s.phrase),
      };
    })
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .map(({ patternId, score, matchedPhrases }) => ({ patternId, score, matchedPhrases }));
}

/**
 * Where the given phrases occur in a text, for highlighting.
 *
 * When two matches overlap the earlier one wins, and on the same start the
 * longer one, so "longest substring" is highlighted whole rather than as
 * "longest" plus a separate "substring".
 *
 * @param text - The text to search.
 * @param phrases - Lowercase phrases to look for.
 * @returns Non-overlapping spans in reading order.
 */
export function findSignalSpans(text: string, phrases: readonly string[]): TextSpan[] {
  const all = phrases.flatMap((phrase) =>
    [...text.matchAll(phrasePattern(phrase, "gi"))].map((m) => ({
      start: m.index,
      end: m.index + phrase.length,
    })),
  );
  const ordered = [...all].sort((a, b) => a.start - b.start || b.end - a.end);
  return ordered.reduce<TextSpan[]>((kept, span) => {
    const last = kept.at(-1);
    return last && span.start < last.end ? kept : [...kept, span];
  }, []);
}

export type ComplexityBudget = {
  maxInputSize: number;
  budget: string;
  reachFor: string;
};

/**
 * The input-size table, using the usual rule of thumb that a judge gets
 * through about 10^8 simple operations in the time limit. Each row's
 * maxInputSize is inclusive, matching how constraints are written
 * ("1 <= n <= 10^5").
 */
export const COMPLEXITY_BUDGETS: readonly ComplexityBudget[] = [
  { maxInputSize: 12, budget: "O(n!)", reachFor: "Permutations, brute-force backtracking over every ordering" },
  { maxInputSize: 25, budget: "O(2^n)", reachFor: "Subsets, backtracking with pruning, bitmask DP" },
  { maxInputSize: 500, budget: "O(n^3)", reachFor: "Interval DP, triple loops, Floyd–Warshall" },
  { maxInputSize: 10_000, budget: "O(n^2)", reachFor: "2D DP over pairs, nested loops, all pairs of elements" },
  { maxInputSize: 1_000_000, budget: "O(n log n)", reachFor: "Sorting, heaps, binary search inside a loop, divide and conquer" },
  { maxInputSize: 100_000_000, budget: "O(n)", reachFor: "One pass: hash map, two pointers, sliding window, prefix sums, monotonic stack" },
  { maxInputSize: Number.POSITIVE_INFINITY, budget: "O(log n)", reachFor: "Binary search on the answer, or a closed-form maths result" },
];

/**
 * Reads a constraint the way I want to read every constraint: as a hint about
 * which complexity, and so which patterns, are even on the table.
 *
 * @param n - The largest input size from the problem's constraints.
 * @returns The first row of COMPLEXITY_BUDGETS that covers n.
 * @throws When n is not a positive finite number.
 */
export function complexityBudgetForInputSize(n: number): ComplexityBudget {
  if (!Number.isFinite(n) || n < 1) {
    throw new RangeError(`Input size must be a positive number, got ${n}`);
  }
  const row = COMPLEXITY_BUDGETS.find((b) => n <= b.maxInputSize);
  if (!row) throw new RangeError(`No budget covers ${n}`);
  return row;
}
