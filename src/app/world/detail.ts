"use client";

import { createContext, useContext } from "react";

// Fidelity level 0..1 from the HUD slider. Provided INSIDE the R3F canvas —
// context does not cross the renderer boundary on its own.
export const DetailContext = createContext(0.6);

/**
 * Scales a geometry's segment count by the current fidelity: chunky flat-shaded
 * solids at 0, very smooth at 1. Never drops below 4 so nothing degenerates.
 */
export function useSegments(base: number): number {
  const fidelity = useContext(DetailContext);
  return Math.max(4, Math.round(base * (0.35 + fidelity * 1.4)));
}

/** Raw fidelity for anything that isn't a segment count (particle budgets). */
export function useDetail(): number {
  return useContext(DetailContext);
}
