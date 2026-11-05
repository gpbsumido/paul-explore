import type { Pattern, Problem } from "./types";
import type { ReviewState } from "./review";

/** One drill card: a problem, answered by the pattern that owns it. */
export type DrillCard = {
  problem: Problem;
  patternId: string;
};

/**
 * Every problem in the playbook as a drill card, in roadmap order, so new
 * cards arrive in the same order the patterns are taught.
 */
export function drillDeck(patterns: readonly Pattern[]): DrillCard[] {
  return patterns.flatMap((pattern) =>
    pattern.problems.map((problem) => ({ problem, patternId: pattern.id })),
  );
}

/**
 * Picks the next card to show.
 *
 * Due cards first, most overdue first, because those are the ones about to be
 * forgotten. Then unseen cards in roadmap order. With studyAhead, once both
 * run out it takes whichever scheduled card is due soonest rather than ending
 * the session.
 *
 * @returns The card to show, or null when nothing in scope is left.
 */
export function nextDrillCard({
  deck,
  states,
  now,
  patternIds,
  studyAhead = false,
}: {
  deck: readonly DrillCard[];
  states: Readonly<Record<string, ReviewState>>;
  now: number;
  patternIds?: readonly string[];
  studyAhead?: boolean;
}): DrillCard | null {
  const inScope = patternIds ? deck.filter((c) => patternIds.includes(c.patternId)) : deck;
  const seen = inScope.filter((c) => states[c.problem.slug] !== undefined);
  const bySoonest = [...seen].sort((a, b) => states[a.problem.slug].due - states[b.problem.slug].due);

  const overdue = bySoonest.find((c) => states[c.problem.slug].due <= now);
  if (overdue) return overdue;
  const unseen = inScope.find((c) => states[c.problem.slug] === undefined);
  if (unseen) return unseen;
  return studyAhead ? (bySoonest[0] ?? null) : null;
}

/**
 * The answer plus distractors, shuffled.
 *
 * Distractors never include a listed alternative, since offering a second
 * right answer and then marking it wrong teaches the wrong thing.
 *
 * @param random - A source of numbers in [0, 1), injected so tests can pin it.
 * @returns `count` distinct pattern ids, one of them the card's answer.
 */
export function buildDrillOptions({
  card,
  patterns,
  random,
  count = 4,
}: {
  card: DrillCard;
  patterns: readonly Pattern[];
  random: () => number;
  count?: number;
}): string[] {
  const excluded = new Set([card.patternId, ...(card.problem.alsoAccept ?? [])]);
  const pool = patterns.map((p) => p.id).filter((id) => !excluded.has(id));
  const distractors = shuffle(pool, random).slice(0, count - 1);
  return shuffle([card.patternId, ...distractors], random);
}

/** Whether a chosen pattern counts as right for this card. */
export function isAcceptedAnswer(card: DrillCard, patternId: string): boolean {
  return patternId === card.patternId || (card.problem.alsoAccept ?? []).includes(patternId);
}

/** Fisher–Yates on a copy; the input is left alone. */
function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
