"use client";

import { useSyncExternalStore } from "react";
import type { LevelId } from "./levels";

/**
 * Personal bests for the EVAR practice, one number per level and case, kept in
 * localStorage. Practice is anonymous, so the device is the only place to keep
 * them.
 *
 * The snapshot is a plain number, which is already stable between reads, so
 * unlike `useSourcePrefs` there's no parsed object to cache.
 */

const listeners = new Set<() => void>();

const keyFor = (levelId: LevelId, caseId: string) => `evar-best-v2:${levelId}:${caseId}`;

// Once per page load: readers ask on every render, and there's a key per level and case.
let tidied = false;

/**
 * Bests set on the first phantom, before the necks got tapers, angles,
 * thrombus and calcium, aren't comparable with anything now, so they go.
 */
function forgetRetired() {
  if (tidied) return;
  tidied = true;
  const retired = Array.from({ length: window.localStorage.length }, (_, i) => window.localStorage.key(i)).filter(
    (key): key is string => key !== null && key.startsWith("evar-best:"),
  );
  retired.forEach((key) => window.localStorage.removeItem(key));
}

/** The best total so far, or null when there isn't one or storage holds garbage. */
export function readBest(levelId: LevelId, caseId: string): number | null {
  if (typeof window === "undefined") return null;
  try {
    forgetRetired();
    const raw = window.localStorage.getItem(keyFor(levelId, caseId));
    const value = raw === null ? Number.NaN : Number(raw);
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

/** Keeps `points` if it beats the stored best, and tells anyone reading. */
export function recordBest(levelId: LevelId, caseId: string, points: number): void {
  const best = readBest(levelId, caseId);
  if (best !== null && best >= points) return;
  try {
    window.localStorage.setItem(keyFor(levelId, caseId), String(points));
  } catch {
    // Full or blocked storage just means no best this time.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The live best for a level and case. Null on the server, so the first paint matches. */
export function usePersonalBest(levelId: LevelId, caseId: string): number | null {
  return useSyncExternalStore(
    subscribe,
    () => readBest(levelId, caseId),
    () => null,
  );
}
