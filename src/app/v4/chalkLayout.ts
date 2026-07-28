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
/**
 * The machine owns more of the screen than just the reels: the CATEGORY and
 * APP LINK callouts with their arrows sit above the loupe, and the spin button
 * sits below it. A word landing in either reads as part of the controls, so the
 * usable bands are the strips beyond them.
 */
const TOP_BAND = { from: 2, to: 14 };
const BOTTOM_BAND = { from: 88, to: 97 };
/** The spin button is centred, so the lower strip keeps away from the middle. */
const SPIN_COLUMN = { from: 34, to: 66 };

function candidate(rand: () => number): ChalkPlacement {
  const above = rand() < 0.5;
  const band = above ? TOP_BAND : BOTTOM_BAND;
  let left = 4 + rand() * 92;
  if (!above && left > SPIN_COLUMN.from && left < SPIN_COLUMN.to) {
    // Push it out to whichever side it was already nearer.
    const mid = (SPIN_COLUMN.from + SPIN_COLUMN.to) / 2;
    left = left < mid ? SPIN_COLUMN.from - (mid - left) * 0.9 : SPIN_COLUMN.to + (left - mid) * 0.9;
    left = Math.min(96, Math.max(4, left));
  }
  return {
    left,
    top: band.from + rand() * (band.to - band.from),
    rotate: (rand() - 0.5) * 14,
    size: 1.05 + rand() * 1.1,
    duration: 6500 + rand() * 3500,
  };
}

/** Roughly how far apart two words have to be, in viewport percent. */
const MIN_GAP = 22;

/** Squared distance, weighting the vertical since words are wide and short. */
const spread = (a: { left: number; top: number }, b: { left: number; top: number }) =>
  (a.left - b.left) ** 2 + ((a.top - b.top) * 2.2) ** 2;

/**
 * Place a word somewhere clear of the machine, and clear of the words already
 * on screen.
 *
 * Purely random placement overlapped often enough to look like a bug -- with
 * six words up at a time, collisions are common. This draws several candidates
 * and keeps the one furthest from everything showing, settling early if it
 * finds one comfortably clear.
 */
export function placeChalkWord(
  rand: () => number = Math.random,
  avoid: readonly { left: number; top: number }[] = [],
): ChalkPlacement {
  let best = candidate(rand);
  if (avoid.length === 0) return best;

  let bestGap = Math.min(...avoid.map((o) => spread(best, o)));
  for (let i = 0; i < 8 && bestGap < MIN_GAP ** 2; i += 1) {
    const next = candidate(rand);
    const gap = Math.min(...avoid.map((o) => spread(next, o)));
    if (gap > bestGap) {
      best = next;
      bestGap = gap;
    }
  }
  return best;
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
