"use client";

import { useState } from "react";
import { usePersistentState } from "@/hooks/usePersistentState";

/**
 * Owns whether a guided tour is showing. It auto-opens once per visitor — the
 * first time they land, before the persisted flag is set — and the returned
 * `start` reopens it any time. The initial open state is derived from the flag
 * rather than set in an effect, so there's no first-paint flash or lint fight.
 */
export function useGuidedTour(storageKey: string) {
  const [seen, setSeen] = usePersistentState(storageKey, false);
  // Never auto-open during SSR: the overlay portals to document.body, which
  // doesn't exist on the server. It opens on the client's first render instead,
  // where the portal (and the persisted flag) are real.
  const [open, setOpen] = useState(
    () => typeof window !== "undefined" && !seen,
  );

  const start = () => setOpen(true);
  const close = () => {
    setOpen(false);
    setSeen(true);
  };

  return { open, start, close };
}
