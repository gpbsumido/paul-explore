import type { MatchRange } from "./types";

/** Result of matching a query against a piece of text. */
export type FuzzyResult = {
  matched: boolean;
  score: number;
  ranges: MatchRange[];
};

const NO_MATCH: FuzzyResult = { matched: false, score: 0, ranges: [] };

/** Points awarded for each matched character. */
const BASE = 1;
/** Extra points when a match sits at the start of the text. */
const PREFIX_BONUS = 8;
/** Extra points when a match sits at the start of a word (after a separator). */
const WORD_BOUNDARY_BONUS = 5;
/** Extra points when a match directly follows the previous match. */
const CONSECUTIVE_BONUS = 4;

function isWordBoundary(text: string, index: number): boolean {
  if (index === 0) return true;
  const prev = text[index - 1];
  return prev === " " || prev === "-" || prev === "/" || prev === "_";
}

/**
 * Greedy subsequence fuzzy match. Walks the query left to right, consuming the
 * next matching character in the text, and scores each hit by where it lands
 * (prefix, word boundary, consecutive run). Returns the matched indices folded
 * into contiguous ranges so the UI can highlight them.
 *
 * An empty query matches everything with a neutral score so the palette can
 * show the full registry before the user types.
 */
export function fuzzyMatch(text: string, query: string): FuzzyResult {
  if (query.length === 0) return { matched: true, score: 0, ranges: [] };

  const haystack = text.toLowerCase();
  const needle = query.toLowerCase();

  const matchedIndices: number[] = [];
  let score = 0;
  let searchFrom = 0;
  let previousIndex = -1;

  for (const char of needle) {
    const found = haystack.indexOf(char, searchFrom);
    if (found === -1) return NO_MATCH;

    score += BASE;
    if (found === 0) score += PREFIX_BONUS;
    else if (isWordBoundary(text, found)) score += WORD_BOUNDARY_BONUS;
    if (previousIndex !== -1 && found === previousIndex + 1) {
      score += CONSECUTIVE_BONUS;
    }

    matchedIndices.push(found);
    previousIndex = found;
    searchFrom = found + 1;
  }

  return { matched: true, score, ranges: toRanges(matchedIndices) };
}

/** Folds a sorted list of matched indices into contiguous [start, end) ranges. */
function toRanges(indices: number[]): MatchRange[] {
  const ranges: MatchRange[] = [];
  for (const index of indices) {
    const last = ranges[ranges.length - 1];
    if (last && last.end === index) {
      last.end = index + 1;
    } else {
      ranges.push({ start: index, end: index + 1 });
    }
  }
  return ranges;
}
