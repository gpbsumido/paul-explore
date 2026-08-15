/**
 * The shapes the hero object cycles through, and the pure logic of the cycle.
 *
 * Each one is a wireframe stand-in for something real on this site, so the
 * rotation reads as a tour of the work rather than a screensaver. The canvas
 * file owns the geometry construction; this module owns the list and the
 * draw so both are testable where WebGL is not.
 */

/** One shape in the hero cycle. */
export type HeroShape = {
  /** Stable id, used as the React key and for tests. */
  id: string;
  /** The piece of work this shape stands for. */
  stands_for: string;
};

/** Seconds a shape holds before morphing to the next. */
export const MORPH_HOLD_S = 7;

/** Seconds the crossfade between two shapes takes. */
export const MORPH_FADE_S = 0.8;

export const HERO_SHAPES: HeroShape[] = [
  { id: "knot", stands_for: "the codebase, honestly" },
  { id: "globe", stands_for: "the walkable low-poly Toronto at /world" },
  { id: "ball", stands_for: "the fantasy NBA console" },
  { id: "card", stands_for: "the Pokemon TCG browser" },
  { id: "graph", stands_for: "the v3 landing that drew the site as a node graph" },
  { id: "reel", stands_for: "the v4 slot machine now living at /discover" },
];

/**
 * Picks the next shape index, never the one already showing.
 * @param current Index of the shape on screen.
 * @param random A function returning a number in [0, 1), injected for tests.
 */
export function pickNextShape(current: number, random: () => number): number {
  const others = HERO_SHAPES.length - 1;
  const step = 1 + (Math.floor(random() * others) % others);
  return (current + step) % HERO_SHAPES.length;
}
