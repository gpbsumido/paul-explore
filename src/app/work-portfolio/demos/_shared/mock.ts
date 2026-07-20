/**
 * Small seeded RNG so demo data looks organic but stays stable within a
 * render and can be re-rolled on demand. Not cryptographic, just enough to
 * scatter some numbers around.
 */
export function makeRng(seed: number): () => number {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

/** Round to a friendlier integer for display. */
export function roundish(n: number): number {
  return Math.round(n);
}
