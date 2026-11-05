/**
 * Days until the next review at each rung. The usual spaced-repetition shape
 * for problem practice: tomorrow, then a few days, then a week, and outward
 * from there. Six rungs is enough that a problem you keep nailing stops
 * coming back for two months.
 */
export const REVIEW_LADDER_DAYS = [1, 3, 7, 14, 30, 60] as const;

const DAY_MS = 24 * 60 * 60 * 1000;
const TOP_STEP = REVIEW_LADDER_DAYS.length - 1;

/**
 * How a re-solve went. Again: couldn't do it. Hard: got there, slowly or with
 * a peek. Good: solved it cleanly. Easy: solved it without thinking.
 */
export type ReviewRating = "again" | "hard" | "good" | "easy";

/** Where one problem (or drill card) sits on the ladder. */
export type ReviewState = {
  step: number;
  due: number;
  lastReviewed: number;
  reviews: number;
};

const STEP_CHANGE: Record<ReviewRating, number> = {
  again: Number.NEGATIVE_INFINITY,
  hard: 0,
  good: 1,
  easy: 2,
};

/**
 * Moves a problem along the review ladder after one attempt.
 *
 * A problem never seen before counts as sitting just below the bottom rung, so
 * a clean first solve comes back tomorrow and an easy one in three days.
 * Again always drops to the bottom; hard holds the current interval.
 *
 * @param previous - The state before this attempt, or undefined for a first attempt.
 * @param rating - How the attempt went.
 * @param now - Epoch milliseconds the attempt happened.
 * @returns The new state, due a whole number of ladder days from now.
 */
export function scheduleReview({
  previous,
  rating,
  now,
}: {
  previous: ReviewState | undefined;
  rating: ReviewRating;
  now: number;
}): ReviewState {
  const currentStep = previous?.step ?? -1;
  const step = Math.min(TOP_STEP, Math.max(0, currentStep + STEP_CHANGE[rating]));
  return {
    step,
    due: now + REVIEW_LADDER_DAYS[step] * DAY_MS,
    lastReviewed: now,
    reviews: (previous?.reviews ?? 0) + 1,
  };
}

/**
 * The ids whose review is due, most overdue first.
 *
 * @param states - Review state keyed by problem slug.
 * @param now - Epoch milliseconds to compare against.
 * @returns Slugs due at or before now.
 */
export function dueItems(states: Readonly<Record<string, ReviewState>>, now: number): string[] {
  return Object.entries(states)
    .filter(([, state]) => state.due <= now)
    .sort(([, a], [, b]) => a.due - b.due)
    .map(([id]) => id);
}
