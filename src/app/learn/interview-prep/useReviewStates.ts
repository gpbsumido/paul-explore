"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { scheduleReview, type ReviewRating, type ReviewState } from "@/lib/leetcode/review";
import {
  REVIEW_KINDS,
  fetchPracticeReviews,
  importPracticeReviews,
  savePracticeReview,
  type ReviewKind,
  type ReviewStatesByKind,
} from "@/lib/leetcode/practiceApi";

const REVIEW_STORAGE_KEYS: Record<ReviewKind, string> = {
  problem: "learn-leetcode-review-v1",
  drill: "learn-leetcode-drill-v1",
};

const CHANGE_EVENT = "learn-leetcode-review-change";

const isCount = (value: unknown): boolean => Number.isInteger(value) && Number(value) >= 0;

/**
 * Checks one stored entry by hand rather than with zod, which Turbopack
 * doesn't tree-shake here and which cost these routes about 50KB gzipped.
 */
function isReviewState(value: unknown): value is ReviewState {
  return (
    typeof value === "object" &&
    value !== null &&
    "step" in value &&
    isCount(value.step) &&
    "due" in value &&
    Number.isFinite(value.due) &&
    "lastReviewed" in value &&
    Number.isFinite(value.lastReviewed) &&
    "reviews" in value &&
    isCount(value.reviews)
  );
}

function isReviewStates(value: unknown): value is Record<string, ReviewState> {
  return (
    typeof value === "object" && value !== null && !Array.isArray(value) && Object.values(value).every(isReviewState)
  );
}

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
  const parsed: unknown = JSON.parse(raw);
  if (!isReviewStates(parsed)) throw new Error(`Stored review progress under "${key}" is not in the expected shape`);
  return parsed;
}

function readLocalStates(kind: ReviewKind): Readonly<Record<string, ReviewState>> {
  const key = REVIEW_STORAGE_KEYS[kind];
  return parseStoredStates(key, localStorage.getItem(key));
}

/**
 * Loads the account's progress. The first time a browser with local progress
 * signs in, that progress is merged into the account (the server keeps the
 * later attempt per item) and the local copy is cleared, so there is only ever
 * one schedule to trust.
 */
async function loadAccountReviews(): Promise<ReviewStatesByKind> {
  const local = { problem: readLocalStates("problem"), drill: readLocalStates("drill") };
  const hasLocal = REVIEW_KINDS.some((kind) => Object.keys(local[kind]).length > 0);
  if (!hasLocal) return fetchPracticeReviews();

  const merged = await importPracticeReviews(local);
  REVIEW_KINDS.forEach((kind) => localStorage.removeItem(REVIEW_STORAGE_KEYS[kind]));
  window.dispatchEvent(new Event(CHANGE_EVENT));
  return merged;
}

function withState(
  all: ReviewStatesByKind | undefined,
  kind: ReviewKind,
  itemId: string,
  state: ReviewState,
): ReviewStatesByKind | undefined {
  return all && { ...all, [kind]: { ...all[kind], [itemId]: state } };
}

/**
 * Review progress for one kind of item.
 *
 * Signed out, it lives in this browser, read through useSyncExternalStore so
 * every component on the page (and other tabs) sees the same states and the
 * server render sees none. Signed in, it lives on the account through
 * `/api/practice`, and a failed read or save comes back as `syncError` rather
 * than an empty or silently stale schedule.
 *
 * @param kind - Which schedule to read and write.
 * @returns The states keyed by item id, `rate` to record an attempt, `ready`
 *   (false until the session is known and, if signed in, the account's
 *   progress has loaded, so a rating never lands in the wrong store or gets
 *   scheduled from nothing), and `syncError` for the page to show.
 */
export function useReviewStates(kind: ReviewKind) {
  const key = REVIEW_STORAGE_KEYS[kind];
  const raw = useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(key),
    () => null,
  );
  const localStates = useMemo(() => parseStoredStates(key, raw), [key, raw]);

  const queryClient = useQueryClient();
  const me = useQuery({
    queryKey: queryKeys.me(),
    queryFn: (): Promise<{ sub: string | null }> =>
      fetch("/api/me").then((r) => (r.ok ? r.json() : { sub: null })),
    staleTime: 5 * 60_000,
  });
  const signedIn = Boolean(me.data?.sub);

  const account = useQuery({
    queryKey: queryKeys.practiceReviews(),
    queryFn: loadAccountReviews,
    enabled: signedIn,
    staleTime: 60_000,
  });

  const save = useMutation({
    mutationFn: ({ itemId, state }: { itemId: string; state: ReviewState }) =>
      savePracticeReview(kind, itemId, state),
    onSuccess: (kept, { itemId }) =>
      queryClient.setQueryData<ReviewStatesByKind>(queryKeys.practiceReviews(), (all) =>
        withState(all, kind, itemId, kept),
      ),
    onError: () => queryClient.invalidateQueries({ queryKey: queryKeys.practiceReviews() }),
  });
  const { mutate } = save;

  const rate = useCallback(
    (itemId: string, rating: ReviewRating): ReviewState => {
      if (!signedIn) {
        const current = parseStoredStates(key, localStorage.getItem(key));
        const next = scheduleReview({ previous: current[itemId], rating, now: Date.now() });
        localStorage.setItem(key, JSON.stringify({ ...current, [itemId]: next }));
        window.dispatchEvent(new Event(CHANGE_EVENT));
        return next;
      }

      const current = queryClient.getQueryData<ReviewStatesByKind>(queryKeys.practiceReviews());
      const next = scheduleReview({ previous: current?.[kind][itemId], rating, now: Date.now() });
      queryClient.setQueryData<ReviewStatesByKind>(queryKeys.practiceReviews(), (all) =>
        withState(all, kind, itemId, next),
      );
      mutate({ itemId, state: next });
      return next;
    },
    [key, kind, signedIn, queryClient, mutate],
  );

  const syncError = account.isError
    ? `Couldn't load your progress: ${account.error.message}`
    : save.isError
      ? `Couldn't save your progress: ${save.error.message}`
      : null;

  return {
    states: signedIn ? (account.data?.[kind] ?? EMPTY) : localStates,
    rate,
    ready: !me.isPending && (!signedIn || account.isSuccess),
    syncError,
  };
}
