// Chase-camera occlusion: when a building stands between the camera and the
// player, the boom shortens until the sightline clears, instead of leaving
// the player hidden behind a tower.

export type Occluder = {
  readonly x: number;
  readonly z: number;
  readonly halfX: number;
  readonly halfZ: number;
  readonly height: number;
};

type Point3 = { readonly x: number; readonly y: number; readonly z: number };

export const MIN_CAMERA_FRACTION = 0.22;

const SAMPLES = 24;
// Pull in slightly ahead of the first blocked sample so the wall face itself
// doesn't clip the frustum.
const MARGIN = 0.06;

/**
 * How much of the camera boom (anchor → desired position) stays unobstructed:
 * 1 means the full distance is clear; anything less is the fraction to zoom
 * in to. A sample is blocked when it sits inside a footprint below that
 * building's roof.
 */
export function visibleFraction(
  anchor: Point3,
  desired: Point3,
  occluders: readonly Occluder[],
): number {
  for (let i = 1; i <= SAMPLES; i += 1) {
    const t = i / SAMPLES;
    const x = anchor.x + (desired.x - anchor.x) * t;
    const y = anchor.y + (desired.y - anchor.y) * t;
    const z = anchor.z + (desired.z - anchor.z) * t;
    const blocked = occluders.some(
      (o) =>
        Math.abs(x - o.x) < o.halfX &&
        Math.abs(z - o.z) < o.halfZ &&
        y < o.height,
    );
    if (blocked) return Math.max(t - MARGIN, MIN_CAMERA_FRACTION);
  }
  return 1;
}
