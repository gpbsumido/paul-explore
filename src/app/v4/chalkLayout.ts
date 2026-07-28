/**
 * Placement for one chalk word.
 *
 * Randomness is injected rather than reached for, so the caller decides when it
 * happens and the maths stays testable against a seeded source. The backdrop
 * calls this from a timer after mount, never during render -- a position drawn
 * from `Math.random()` while rendering would disagree between the server and the
 * first client pass.
 */

export type ChalkPlacement = {
  /** Percentage across the viewport. */
  left: number;
  /** Percentage down the viewport. */
  top: number;
  /** Slight tilt, in degrees, so nothing sits straight. */
  rotate: number;
  /** Font size in rem. */
  size: number;
  /** How long this word takes to write, hold, and dissolve, in ms. */
  duration: number;
};

/**
 * Place a word somewhere clear of the machine.
 *
 * The reels own the middle of the screen, so words sit in a band above or below
 * it, picked at random. Column, tilt, size and lifetime are random too, so the
 * same app never writes itself into the same spot twice.
 */
export function placeChalkWord(rand: () => number = Math.random): ChalkPlacement {
  const above = rand() < 0.5;
  return {
    left: 5 + rand() * 90,
    // Two bands, well clear of the reels across the middle of the viewport.
    top: above ? 4 + rand() * 26 : 68 + rand() * 26,
    rotate: (rand() - 0.5) * 14,
    size: 1.05 + rand() * 1.1,
    duration: 6500 + rand() * 3500,
  };
}

/**
 * Pick a name that isn't already on screen, so the same one never shows twice at
 * once. Falls back to any name when everything is already showing.
 */
export function pickUnused<T extends { id: string }>(
  pool: readonly T[],
  inUse: readonly string[],
  rand: () => number = Math.random,
): T | undefined {
  if (pool.length === 0) return undefined;
  const free = pool.filter((p) => !inUse.includes(p.id));
  const from = free.length > 0 ? free : pool;
  return from[Math.floor(rand() * from.length) % from.length];
}
