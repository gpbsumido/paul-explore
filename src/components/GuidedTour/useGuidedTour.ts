"use client";

import { useState, useSyncExternalStore } from "react";
import { usePersistentState } from "@/hooks/usePersistentState";

const noSubscription = () => () => {};

/**
 * False while the server renders and while the browser hydrates that HTML,
 * true on every render after. React hands useSyncExternalStore the server
 * snapshot during hydration, so both sides agree, then re-renders with the
 * client one straight away.
 */
function useHydrated(): boolean {
  return useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  );
}

/**
 * Owns whether a guided tour is showing. It auto-opens once per visitor — the
 * first time they land, before the persisted flag is set — and the returned
 * `start` reopens it any time.
 *
 * The auto-open waits for hydration. The server can't know this is a first
 * visit, so it renders the tour closed; deciding "open" in the initial state
 * (the old `typeof window !== "undefined" && !seen`) made a new visitor's first
 * client render disagree with that HTML, a hydration error on every page with
 * a tour. Until someone clicks, the open state is derived rather than stored,
 * which also keeps it out of an effect.
 */
export function useGuidedTour(storageKey: string) {
  const [seen, setSeen] = usePersistentState(storageKey, false);
  const hydrated = useHydrated();
  // null until the visitor starts or closes it; after that, their choice wins
  const [choice, setChoice] = useState<boolean | null>(null);
  const open = choice ?? (hydrated && !seen);

  const start = () => setChoice(true);
  const close = () => {
    setChoice(false);
    setSeen(true);
  };

  return { open, start, close };
}
