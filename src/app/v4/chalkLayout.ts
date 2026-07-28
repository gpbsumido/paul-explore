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
/** A rectangle of the viewport, in percent, that a word must not cover. */
export type Rect = { left: number; top: number; right: number; bottom: number };

/**
 * Keep-out zones, measured from the real interface.
 *
 * Bands were the wrong model. Avoiding two horizontal strips either banned the
 * whole screen (the machine's container is taller than a short window) or let
 * words land on the stats line and the header. What actually has to stay clear
 * is a handful of specific elements -- the header, the stats line, the loupe,
 * the spin button -- and the sparse space between the reel rows is fair game.
 */
export type KeepOut = readonly Rect[];

/** Breathing room around every obstacle, in viewport percent. */
const PAD = 2;

const overlaps = (p: { left: number; top: number }, r: Rect) =>
  p.left > r.left - PAD &&
  p.left < r.right + PAD &&
  p.top > r.top - PAD &&
  p.top < r.bottom + PAD;

/** True when a spot is clear of every obstacle. */
export function isClear(p: { left: number; top: number }, keepOut: KeepOut): boolean {
  return !keepOut.some((r) => overlaps(p, r));
}

function candidate(rand: () => number): ChalkPlacement {
  return {
    left: 4 + rand() * 92,
    top: 3 + rand() * 94,
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
  keepOut: KeepOut = [],
): ChalkPlacement | null {
  const gapTo = (p: ChalkPlacement) =>
    avoid.length === 0 ? Infinity : Math.min(...avoid.map((o) => spread(p, o)));

  let best: ChalkPlacement | null = null;
  let bestGap = -1;

  // Draw a handful of candidates and keep the best one that is clear of the
  // interface. Rejecting rather than clamping means a crowded window simply
  // writes fewer words instead of stacking them somewhere silly.
  for (let i = 0; i < 24; i += 1) {
    const next = candidate(rand);
    if (!isClear(next, keepOut)) continue;
    const gap = gapTo(next);
    if (gap > bestGap) {
      best = next;
      bestGap = gap;
    }
    if (bestGap >= MIN_GAP ** 2) break;
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
