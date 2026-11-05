import type { ReviewState } from "./review";

/**
 * Client for the practice BFF (`/api/practice/*`), which proxies to
 * portfolio_api's per-user review store. The server speaks ISO timestamps and
 * names the item; the page works in epoch ms keyed by item id, so this file is
 * where the two shapes meet.
 */

/** Problems re-solved on LeetCode, and recognition drill cards. Scheduled separately. */
export type ReviewKind = "problem" | "drill";

export const REVIEW_KINDS: readonly ReviewKind[] = ["problem", "drill"];

type PracticeReview = {
  kind: ReviewKind;
  itemId: string;
  step: number;
  dueAt: string;
  lastReviewedAt: string;
  reviews: number;
};

/** Every review on the account, split by kind and keyed by item id. */
export type ReviewStatesByKind = Readonly<Record<ReviewKind, Readonly<Record<string, ReviewState>>>>;

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/practice${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

function toReviewState(review: PracticeReview): ReviewState {
  return {
    step: review.step,
    due: Date.parse(review.dueAt),
    lastReviewed: Date.parse(review.lastReviewedAt),
    reviews: review.reviews,
  };
}

function toPracticeReview(kind: ReviewKind, itemId: string, state: ReviewState): PracticeReview {
  return {
    kind,
    itemId,
    step: state.step,
    dueAt: new Date(state.due).toISOString(),
    lastReviewedAt: new Date(state.lastReviewed).toISOString(),
    reviews: state.reviews,
  };
}

function groupByKind(reviews: readonly PracticeReview[]): ReviewStatesByKind {
  return reviews.reduce<ReviewStatesByKind>(
    (grouped, review) => ({
      ...grouped,
      [review.kind]: { ...grouped[review.kind], [review.itemId]: toReviewState(review) },
    }),
    { problem: {}, drill: {} },
  );
}

/** Reads every review on the signed-in account. */
export async function fetchPracticeReviews(): Promise<ReviewStatesByKind> {
  const { reviews } = await call<{ reviews: PracticeReview[] }>("/reviews");
  return groupByKind(reviews);
}

/**
 * Saves one review. The server keeps whichever attempt happened later, so the
 * state it returns is the one to show, which may not be the one sent.
 */
export async function savePracticeReview(kind: ReviewKind, itemId: string, state: ReviewState): Promise<ReviewState> {
  const { step, dueAt, lastReviewedAt, reviews } = toPracticeReview(kind, itemId, state);
  const { review } = await call<{ review: PracticeReview }>(
    `/reviews/${kind}/${encodeURIComponent(itemId)}`,
    { method: "PUT", body: JSON.stringify({ step, dueAt, lastReviewedAt, reviews }) },
  );
  return toReviewState(review);
}

/** Merges progress kept in a browser into the account and returns the full set. */
export async function importPracticeReviews(local: ReviewStatesByKind): Promise<ReviewStatesByKind> {
  const reviews = REVIEW_KINDS.flatMap((kind) =>
    Object.entries(local[kind]).map(([itemId, state]) => toPracticeReview(kind, itemId, state)),
  );
  const imported = await call<{ reviews: PracticeReview[] }>("/reviews/import", {
    method: "POST",
    body: JSON.stringify({ reviews }),
  });
  return groupByKind(imported.reviews);
}
