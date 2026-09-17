"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "interviewee-answered";

/** Which topics I've marked answered, kept on the device. */
type Answered = { ids: string[] };

const EMPTY: Answered = { ids: [] };

/**
 * A tiny external store over localStorage, same pattern as useSourcePrefs.
 *
 * The snapshot has to be referentially stable between reads or
 * useSyncExternalStore loops forever, so the parsed value is cached against the
 * raw string and only rebuilt when the stored string actually changes. Keying
 * on the raw string (rather than a private mutable flag) means clearing
 * localStorage — which a test does between cases — resets the store too.
 */
let cachedRaw: string | null | undefined;
let cachedValue: Answered = EMPTY;
const listeners = new Set<() => void>();

function parse(raw: string | null): Answered {
  if (!raw) return EMPTY;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed !== null &&
      typeof parsed === "object" &&
      Array.isArray((parsed as { ids?: unknown }).ids)
    ) {
      return {
        ids: (parsed as Answered).ids.filter(
          (id): id is string => typeof id === "string",
        ),
      };
    }
  } catch {
    // A corrupt value is treated as no answered topics rather than a crash.
  }
  return EMPTY;
}

function getSnapshot(): Answered {
  const raw =
    typeof window === "undefined" ? null : window.localStorage.getItem(STORAGE_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedValue = parse(raw);
  }
  return cachedValue;
}

const getServerSnapshot = (): Answered => EMPTY;

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function write(next: Answered): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // A full or blocked storage shouldn't break the deck.
  }
  cachedRaw =
    typeof window === "undefined" ? null : window.localStorage.getItem(STORAGE_KEY);
  cachedValue = next;
  listeners.forEach((listener) => listener());
}

/**
 * The set of answered topic ids and a toggle. Answered topics are a rehearsal
 * state, not data, so they live on the device — no datastore, and no reason to
 * follow me between machines.
 */
export function useAnswered() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const isAnswered = useCallback(
    (id: string): boolean => state.ids.includes(id),
    [state.ids],
  );

  const toggle = useCallback(
    (id: string): void =>
      write({
        ids: state.ids.includes(id)
          ? state.ids.filter((existing) => existing !== id)
          : [...state.ids, id],
      }),
    [state.ids],
  );

  return { answeredIds: state.ids, isAnswered, toggle };
}
