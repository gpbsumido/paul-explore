"use client";

import { useSyncExternalStore } from "react";
import { z } from "zod";
import type { LevelId } from "./levels";

/**
 * Every finished EVAR attempt on this device, newest last, so there's
 * something to look back on beyond a personal best. Practice is anonymous for
 * anyone outside the study, so like the bests it lives in localStorage.
 */

const KEY = "evar-history";
const LIMIT = 500;

const entrySchema = z.object({
  id: z.string(),
  levelId: z.enum(["easy", "medium", "hard"]),
  caseId: z.string(),
  finishedAt: z.number(),
  within: z.number(),
  stars: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  total: z.number(),
  timedOut: z.boolean(),
  deltas: z.partialRecord(z.enum(["neckDiameter", "neckLength", "maxSac", "rightCia", "leftCia"]), z.number()),
});

export type HistoryEntry = z.infer<typeof entrySchema>;

const historySchema = z.array(entrySchema);

const EMPTY: readonly HistoryEntry[] = [];

const listeners = new Set<() => void>();

const readRaw = (): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
};

const parse = (raw: string | null): readonly HistoryEntry[] => {
  if (raw === null) return EMPTY;
  try {
    const result = historySchema.safeParse(JSON.parse(raw));
    return result.success ? result.data : EMPTY;
  } catch {
    return EMPTY;
  }
};

/** Every attempt so far, oldest first. Garbage in storage reads as none. */
export function readHistory(): HistoryEntry[] {
  return [...parse(readRaw())];
}

/**
 * Adds an attempt, or replaces it if one with the same id is already there,
 * so recording a finish twice doesn't count it twice. Keeps the newest 500.
 */
export function recordAttempt(entry: HistoryEntry): void {
  const next = [...readHistory().filter((e) => e.id !== entry.id), entry].slice(-LIMIT);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Full or blocked storage just means this one isn't kept.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// useSyncExternalStore wants the same array back until storage changes, so
// the parse is cached against the raw string it came from.
let cached: { raw: string | null; entries: readonly HistoryEntry[] } = { raw: null, entries: EMPTY };

const snapshot = (): readonly HistoryEntry[] => {
  const raw = readRaw();
  if (raw !== cached.raw) cached = { raw, entries: parse(raw) };
  return cached.entries;
};

/** The live history. Empty on the server, so the first paint matches. */
export function useHistory(): readonly HistoryEntry[] {
  return useSyncExternalStore(subscribe, snapshot, () => EMPTY);
}

export type LevelSummary = {
  levelId: LevelId;
  attempts: number;
  /** Measurements within tolerance per attempt, out of five. */
  meanWithin: number;
  bestTotal: number;
};

/** One line per level that has any attempts, in the order they were first played. */
export function summarize(entries: readonly HistoryEntry[]): LevelSummary[] {
  const levels = [...new Set(entries.map((e) => e.levelId))];
  return levels.map((levelId) => {
    const mine = entries.filter((e) => e.levelId === levelId);
    return {
      levelId,
      attempts: mine.length,
      meanWithin: mine.reduce((sum, e) => sum + e.within, 0) / mine.length,
      bestTotal: Math.max(...mine.map((e) => e.total)),
    };
  });
}
