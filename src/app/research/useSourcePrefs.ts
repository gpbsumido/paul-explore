"use client";

import { useCallback, useSyncExternalStore } from "react";
import { JOURNALS, type Journal } from "@/lib/research/data";
import { SOURCES, type SourceId } from "@/lib/research/sources";

const STORAGE_KEY = "research-source-prefs";

export type SourcePrefs = {
  /** Databases turned off. PubMed can't be, since it carries the counts. */
  ignoredSources: SourceId[];
  /** Curated journal ids hidden from the Journals tab. */
  ignoredJournals: string[];
  /** Journals added by hand, browsable alongside the curated ones. */
  customJournals: Journal[];
};

const EMPTY: SourcePrefs = {
  ignoredSources: [],
  ignoredJournals: [],
  customJournals: [],
};

/**
 * A tiny external store over localStorage.
 *
 * The snapshot has to be referentially stable between reads or
 * useSyncExternalStore re-renders forever, so the parsed value is cached and
 * only replaced when something actually writes. The server snapshot is the
 * empty default, which is what the first client paint matches too.
 */
let cache: SourcePrefs | null = null;
const listeners = new Set<() => void>();

function readStorage(): SourcePrefs {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return EMPTY;
    return { ...EMPTY, ...(parsed as Partial<SourcePrefs>) };
  } catch {
    return EMPTY;
  }
}

function getSnapshot(): SourcePrefs {
  cache ??= readStorage();
  return cache;
}

const getServerSnapshot = (): SourcePrefs => EMPTY;

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function write(next: SourcePrefs): void {
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // A full or blocked storage shouldn't break browsing.
  }
  listeners.forEach((l) => l());
}

/**
 * Which databases and journals to search, kept in localStorage.
 *
 * These are a reading preference, not data, so they live on the device rather
 * than needing a datastore this app doesn't have. Read after mount so the
 * server and client first paint agree.
 */
export function useSourcePrefs() {
  const prefs = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const update = useCallback((next: SourcePrefs) => write(next), []);

  const toggleSource = useCallback(
    (id: SourceId) =>
      update({
        ...prefs,
        ignoredSources: prefs.ignoredSources.includes(id)
          ? prefs.ignoredSources.filter((s) => s !== id)
          : [...prefs.ignoredSources, id],
      }),
    [prefs, update],
  );

  const toggleJournal = useCallback(
    (id: string) =>
      update({
        ...prefs,
        ignoredJournals: prefs.ignoredJournals.includes(id)
          ? prefs.ignoredJournals.filter((j) => j !== id)
          : [...prefs.ignoredJournals, id],
      }),
    [prefs, update],
  );

  const addJournal = useCallback(
    (journal: Journal) =>
      update({ ...prefs, customJournals: [...prefs.customJournals, journal] }),
    [prefs, update],
  );

  const removeJournal = useCallback(
    (id: string) =>
      update({
        ...prefs,
        customJournals: prefs.customJournals.filter((j) => j.id !== id),
      }),
    [prefs, update],
  );

  const activeSources = SOURCES.filter(
    (s) => !prefs.ignoredSources.includes(s.id),
  ).map((s) => s.id);

  const visibleJournals = [...JOURNALS, ...prefs.customJournals].filter(
    (j) => !prefs.ignoredJournals.includes(j.id),
  );

  return {
    prefs,
    activeSources,
    visibleJournals,
    toggleSource,
    toggleJournal,
    addJournal,
    removeJournal,
  };
}

/** Custom journals are identified by a slug of their name. */
export const customJournalId = (name: string): string =>
  `custom-${name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}`;
