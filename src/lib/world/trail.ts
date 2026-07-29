// A short glowing wake behind a mover: roughly the last five seconds of
// travel, fading with age. Pure ring-buffer math; the scene renders it as
// instanced ground discs.

export type TrailPoint = {
  readonly x: number;
  readonly z: number;
  // Seconds on the caller's clock (the R3F elapsed clock in practice).
  readonly t: number;
};

export const TRAIL_LIFETIME = 5;
export const TRAIL_MIN_SPACING = 0.6;
export const TRAIL_MAX_POINTS = 32;

/**
 * Advances a trail: expired points drop off (so a standing mover's wake
 * dissolves), and the candidate joins the front only if it has moved far
 * enough from the newest point. Newest first, capped.
 */
export function pushTrailPoint(
  points: readonly TrailPoint[],
  candidate: TrailPoint,
): readonly TrailPoint[] {
  const alive = points.filter((p) => candidate.t - p.t <= TRAIL_LIFETIME);
  const newest = alive[0];
  if (newest && Math.hypot(candidate.x - newest.x, candidate.z - newest.z) < TRAIL_MIN_SPACING) {
    return alive;
  }
  return [candidate, ...alive].slice(0, TRAIL_MAX_POINTS);
}

/** 1 for a fresh point, easing to 0 at end of life. */
export function trailStrength(point: TrailPoint, now: number): number {
  const age = now - point.t;
  const remaining = 1 - age / TRAIL_LIFETIME;
  if (remaining <= 0) return 0;
  return remaining * remaining;
}
