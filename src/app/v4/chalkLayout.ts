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

/**
 * How much of the viewport a word covers either side of its anchor, in percent.
 * Words are centred on their position, so testing the anchor alone let long
 * ones hang across an obstacle while their midpoint sat safely clear.
 */
export type Extent = { halfW: number; halfH: number };

const ZERO_EXTENT: Extent = { halfW: 0, halfH: 0 };

const overlaps = (
  p: { left: number; top: number },
  r: Rect,
  e: Extent,
): boolean =>
  p.left + e.halfW > r.left - PAD &&
  p.left - e.halfW < r.right + PAD &&
  p.top + e.halfH > r.top - PAD &&
  p.top - e.halfH < r.bottom + PAD;

/** True when a word centred here, of this size, clears every obstacle. */
export function isClear(
  p: { left: number; top: number },
  keepOut: KeepOut,
  extent: Extent = ZERO_EXTENT,
): boolean {
  return !keepOut.some((r) => overlaps(p, r, extent));
}

/**
 * How long a word lives, scaled to its length.
 *
 * A fixed lifetime fades long words mid-stroke: "Work Portfolio" takes roughly
 * three times as long to write as "Craft", so a shared duration cut it off
 * before the pen finished. This gives every word time to be written, held, and
 * dissolved regardless of length.
 */
export function lifetimeFor(charCount: number, rand: () => number): number {
  return 2600 + charCount * 340 + rand() * 1200;
}

function candidate(rand: () => number, charCount: number): ChalkPlacement {
  return {
    left: 4 + rand() * 92,
    top: 3 + rand() * 94,
    rotate: (rand() - 0.5) * 14,
    size: 1.05 + rand() * 1.1,
    duration: lifetimeFor(charCount, rand),
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
  charCount = 8,
  extent: Extent = ZERO_EXTENT,
): ChalkPlacement | null {
  const gapTo = (p: ChalkPlacement) =>
    avoid.length === 0 ? Infinity : Math.min(...avoid.map((o) => spread(p, o)));

  let best: ChalkPlacement | null = null;
  let bestGap = -1;

  // Draw a handful of candidates and keep the best one that is clear of the
  // interface. Rejecting rather than clamping means a crowded window simply
  // writes fewer words instead of stacking them somewhere silly.
  for (let i = 0; i < 24; i += 1) {
    const next = candidate(rand, charCount);
    if (!isClear(next, keepOut, extent)) continue;
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
