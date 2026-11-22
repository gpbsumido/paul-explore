"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { ReviewState } from "@/lib/interviewee/reviewState";
import { createLocalStorageStore } from "@/lib/localStorageStore";

const STORAGE_KEY = "interviewee-answered";

/** Which topics I've marked reviewed, and when, kept on the device. */
type Answered = { reviewed: ReviewState };

const EMPTY: Answered = { reviewed: {} };

/** Keep only string keys with finite-number values, from either storage shape. */
function toReviewState(source: Record<string, unknown>): ReviewState {
  const out: ReviewState = {};
  for (const [key, value] of Object.entries(source)) {
    if (typeof value === "number" && Number.isFinite(value)) out[key] = value;
  }
  return out;
}

function parse(raw: string | null): Answered {
  if (!raw) return EMPTY;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed !== null && typeof parsed === "object") {
      const obj = parsed as { reviewed?: unknown; ids?: unknown };
      if (obj.reviewed !== null && typeof obj.reviewed === "object") {
        return { reviewed: toReviewState(obj.reviewed as Record<string, unknown>) };
      }
      // Legacy shape: { ids: string[] } with no timestamps — carry them at 0.
      if (Array.isArray(obj.ids)) {
        const reviewed: ReviewState = {};
        for (const id of obj.ids) if (typeof id === "string") reviewed[id] = 0;
        return { reviewed };
      }
    }
  } catch {
    // A corrupt value is treated as no reviewed topics rather than a crash.
  }
  return EMPTY;
}

const store = createLocalStorageStore({ key: STORAGE_KEY, parse, empty: EMPTY });

/** Now, in epoch ms, or 0 on the server so a snapshot is never time-dependent. */
const nowMs = (): number => (typeof window === "undefined" ? 0 : Date.now());

/**
 * Which topics are marked reviewed, when each was, and the mutators. Reviewed
 * state is a rehearsal preference, not data, so it lives on the device — the
 * timestamps drive the spaced-repetition nudge, and export/import moves the
 * whole map to another machine without a server.
 */
export function useAnswered() {
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);

  const isAnswered = useCallback(
    (id: string): boolean => id in state.reviewed,
    [state.reviewed],
  );

  const reviewedAt = useCallback(
    (id: string): number | undefined => state.reviewed[id],
    [state.reviewed],
  );

  const toggle = useCallback(
    (id: string): void => {
      const next = { ...state.reviewed };
      if (id in next) {
        delete next[id];
      } else {
        next[id] = nowMs();
      }
      store.write({ reviewed: next });
    },
    [state.reviewed],
  );

  const importReviewed = useCallback(
    (incoming: ReviewState): void =>
      store.write({ reviewed: { ...state.reviewed, ...incoming } }),
    [state.reviewed],
  );

  return {
    reviewed: state.reviewed,
    answeredIds: Object.keys(state.reviewed),
    isAnswered,
    reviewedAt,
    toggle,
    importReviewed,
  };
}
