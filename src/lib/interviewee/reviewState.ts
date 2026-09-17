/**
 * Pure helpers for review progress: how stale a review is (the spaced-repetition
 * nudge) and moving that progress between devices (export/import). The state
 * itself lives in localStorage via useAnswered; this module is the logic around
 * it, kept pure so it can be unit-tested without a browser.
 */

/** A topic counts as due to revisit once its review is at least this old. */
export const DUE_AFTER_DAYS = 3;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Review progress: an answered key (`interview/topic`) to when it was reviewed (epoch ms). */
export type ReviewState = Record<string, number>;

/** Whole days between a review and now, floored, never negative. */
export function daysSinceReview(reviewedAt: number, now: number): number {
  return Math.max(0, Math.floor((now - reviewedAt) / DAY_MS));
}

/** Whether a reviewed topic is stale enough to resurface for another pass. */
export function isDueForReview(
  reviewedAt: number,
  now: number,
  thresholdDays: number = DUE_AFTER_DAYS,
): boolean {
  return daysSinceReview(reviewedAt, now) >= thresholdDays;
}

const EXPORT_VERSION = 1;

/** Serialize review progress to a portable string, to carry it to another device. */
export function serializeReviewState(reviewed: ReviewState): string {
  return JSON.stringify({ version: EXPORT_VERSION, reviewed });
}

/**
 * Parse an exported review-progress string back into a map, or null if it isn't
 * one. Untrusted input (I paste it), so it's validated the same way the
 * localStorage read is: keep only string keys with finite-number values.
 */
export function parseReviewState(raw: string): ReviewState | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (
    parsed === null ||
    typeof parsed !== "object" ||
    !("reviewed" in parsed)
  ) {
    return null;
  }
  const reviewed = (parsed as { reviewed: unknown }).reviewed;
  if (reviewed === null || typeof reviewed !== "object") return null;

  const out: ReviewState = {};
  for (const [key, value] of Object.entries(reviewed as Record<string, unknown>)) {
    if (typeof value === "number" && Number.isFinite(value)) out[key] = value;
  }
  return out;
}
