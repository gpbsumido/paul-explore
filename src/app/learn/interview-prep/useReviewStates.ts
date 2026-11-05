"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { z } from "zod";
import { scheduleReview, type ReviewRating, type ReviewState } from "@/lib/leetcode/review";

/** Problems re-solved on LeetCode, and recognition drill cards. Scheduled separately. */
export type ReviewKind = "problem" | "drill";

export const REVIEW_STORAGE_KEYS: Record<ReviewKind, string> = {
  problem: "learn-leetcode-review-v1",
  drill: "learn-leetcode-drill-v1",
};

const CHANGE_EVENT = "learn-leetcode-review-change";

const reviewStatesSchema = z.record(
  z.string(),
  z.object({
    step: z.number().int().min(0),
    due: z.number(),
    lastReviewed: z.number(),
    reviews: z.number().int().min(0),
  }),
);

const EMPTY: Readonly<Record<string, ReviewState>> = {};

function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

/**
 * Parses what's stored under a key. A missing key means nothing has been rated
 * yet; anything that isn't the shape this page writes is a bug worth seeing,
 * so it throws rather than quietly starting over.
 */
function parseStoredStates(key: string, raw: string | null): Readonly<Record<string, ReviewState>> {
  if (raw === null) return EMPTY;
  const parsed = reviewStatesSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) throw new Error(`Stored review progress under "${key}" is not in the expected shape`);
  return parsed.data;
}

/**
 * Review progress for one kind of item, kept in this browser.
 *
 * Reads through useSyncExternalStore so every component on the page (and
 * other tabs, through the storage event) sees the same states, and the server
 * render sees none, which keeps hydration clean.
 *
 * @param kind - Which schedule to read and write.
 * @returns The states keyed by item id, and `rate` to record an attempt.
 */
export function useReviewStates(kind: ReviewKind) {
  const key = REVIEW_STORAGE_KEYS[kind];
  const raw = useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(key),
    () => null,
  );
  const states = useMemo(() => parseStoredStates(key, raw), [key, raw]);

  const rate = useCallback(
    (itemId: string, rating: ReviewRating): ReviewState => {
      const current = parseStoredStates(key, localStorage.getItem(key));
      const next = scheduleReview({ previous: current[itemId], rating, now: Date.now() });
      localStorage.setItem(key, JSON.stringify({ ...current, [itemId]: next }));
      window.dispatchEvent(new Event(CHANGE_EVENT));
      return next;
    },
    [key],
  );

  return { states, rate };
}
