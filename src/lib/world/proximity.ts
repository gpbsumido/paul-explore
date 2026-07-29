import type { Vec2 } from "@/types/world";

// How close (world units) the player has to stand to an exhibit before its
// placard opens. Roughly the width of a sidewalk plus a step.
export const INTERACT_RADIUS = 4;

/**
 * Finds the exhibit the player is standing at — the closest one within the
 * interaction radius, or null when out of reach of everything.
 */
export function nearestExhibit<T extends { readonly position: Vec2 }>(
  playerPos: Vec2,
  exhibits: readonly T[],
  radius: number = INTERACT_RADIUS,
): T | null {
  return exhibits.reduce<{ exhibit: T | null; distance: number }>(
    (best, exhibit) => {
      const distance = Math.hypot(
        exhibit.position.x - playerPos.x,
        exhibit.position.z - playerPos.z,
      );
      if (distance > radius || distance >= best.distance) return best;
      return { exhibit, distance };
    },
    { exhibit: null, distance: Infinity },
  ).exhibit;
}
