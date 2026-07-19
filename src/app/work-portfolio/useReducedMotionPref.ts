"use client";

import { useEffect, useState } from "react";

/**
 * Tracks the prefers-reduced-motion media query. Defaults to false on the
 * server and before hydration so the marquee markup stays stable.
 */
export function useReducedMotionPref(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    // jsdom has no matchMedia, so guard for tests and odd embedders
    if (typeof window.matchMedia !== "function") return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
