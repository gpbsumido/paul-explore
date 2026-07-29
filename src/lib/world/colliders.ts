import type { RectCollider, Vec2 } from "@/types/world";

/**
 * Pushes a circle out of one axis-aligned box if they overlap. When the center
 * is outside the box the push is along the closest-point normal (which gives
 * corner rounding for free); when the center is inside, it exits through the
 * nearest face.
 */
function pushOut(pos: Vec2, radius: number, rect: RectCollider): Vec2 {
  const minX = rect.x - rect.halfX;
  const maxX = rect.x + rect.halfX;
  const minZ = rect.z - rect.halfZ;
  const maxZ = rect.z + rect.halfZ;

  const closestX = Math.min(Math.max(pos.x, minX), maxX);
  const closestZ = Math.min(Math.max(pos.z, minZ), maxZ);
  const dx = pos.x - closestX;
  const dz = pos.z - closestZ;
  const distance = Math.hypot(dx, dz);

  const centerInside = distance === 0;
  if (!centerInside) {
    if (distance >= radius) return pos;
    const scale = radius / distance;
    return { x: closestX + dx * scale, z: closestZ + dz * scale };
  }

  const exits = [
    { x: maxX + radius, z: pos.z, cost: maxX - pos.x },
    { x: minX - radius, z: pos.z, cost: pos.x - minX },
    { x: pos.x, z: maxZ + radius, cost: maxZ - pos.z },
    { x: pos.x, z: minZ - radius, cost: pos.z - minZ },
  ];
  const nearest = exits.reduce((best, exit) => (exit.cost < best.cost ? exit : best));
  return { x: nearest.x, z: nearest.z };
}

/**
 * Resolves a circle against every collider in the list. One pass per collider
 * is plenty at walking speeds — buildings are far enough apart that a push out
 * of one never lands the player inside another.
 */
export function resolveColliders(
  pos: Vec2,
  radius: number,
  colliders: readonly RectCollider[],
): Vec2 {
  return colliders.reduce((current, rect) => pushOut(current, radius, rect), pos);
}
