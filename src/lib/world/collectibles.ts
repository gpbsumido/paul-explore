import type { Vec2 } from "@/types/world";
import { COLLIDERS } from "./cityLayout";
import { WORLD_BOUNDS, PLAYER_RADIUS } from "./movement";
import { resolveColliders } from "./colliders";

// The collectathon: twenty-five TTC tokens hidden around the city, and a
// fog-of-war exploration grid. Pure data and math; the scene renders tokens
// and the HUD renders progress.

export type Collectible = {
  readonly id: string;
  readonly x: number;
  readonly z: number;
  // Elevated tokens float overhead and need a jump to grab.
  readonly elevated?: boolean;
};

export const PICKUP_RADIUS = 1.4;
// How high off the ground you must be to grab an elevated token.
const ELEVATED_MIN_Y = 0.8;

export const COLLECTIBLES: readonly Collectible[] = [
  // parks and squares
  { id: "legislature-lawn", x: -30, z: -76 },
  { id: "campus-green", x: -46, z: -64 },
  { id: "kensington-lane", x: -70, z: -47 },
  { id: "grange-park", x: -50, z: -22.5 },
  { id: "nathan-phillips", x: -28, z: -20 },
  { id: "dundas-square", x: 30, z: -24 },
  // sidewalks and corners
  { id: "dundas-west", x: -66, z: -34 },
  { id: "queen-west", x: -44, z: -12 },
  { id: "bay-and-eaton", x: 0, z: -27 },
  { id: "yonge-north", x: 24, z: -60 },
  { id: "church-corner", x: 48, z: -7.5 },
  { id: "east-end", x: 66, z: -16 },
  { id: "esplanade", x: 50, z: 14 },
  { id: "market-lane", x: 62, z: 24 },
  { id: "spadina-king", x: -60, z: 8 },
  { id: "university-row", x: -30, z: 16 },
  { id: "wellington", x: -14, z: 16 },
  // waterfront
  { id: "harbour-east", x: 66, z: 38 },
  { id: "quay-center", x: 18, z: 49 },
  { id: "boardwalk", x: -2, z: 51 },
  { id: "quay-west", x: -24, z: 46 },
  { id: "rogers-shore", x: -52, z: 55 },
  // up in the air — bring your legs
  { id: "sky-spawn", x: -18, z: -6, elevated: true },
  { id: "sky-front", x: -36, z: 32, elevated: true },
  { id: "sky-queen", x: 8, z: -12, elevated: true },
];

/**
 * The token under the player, if any: within reach, not yet collected, and —
 * for elevated tokens — only while airborne.
 */
export function findCollectible(
  pos: Vec2,
  playerY: number,
  collected: readonly string[],
): Collectible | null {
  return (
    COLLECTIBLES.find((token) => {
      if (collected.includes(token.id)) return false;
      if (token.elevated && playerY < ELEVATED_MIN_Y) return false;
      return Math.hypot(token.x - pos.x, token.z - pos.z) <= PICKUP_RADIUS;
    }) ?? null
  );
}

// ---------------------------------------------------------------------------
// Exploration grid — fog of war over the walkable city.
// ---------------------------------------------------------------------------

export const CELL_SIZE = 12;

/** Grid cell id for a world position. */
export function cellAt(pos: Vec2): string {
  const cx = Math.floor((pos.x - WORLD_BOUNDS.minX) / CELL_SIZE);
  const cz = Math.floor((pos.z - WORLD_BOUNDS.minZ) / CELL_SIZE);
  return `${cx},${cz}`;
}

const cellReachable = (cx: number, cz: number): boolean => {
  const x0 = WORLD_BOUNDS.minX + cx * CELL_SIZE;
  const z0 = WORLD_BOUNDS.minZ + cz * CELL_SIZE;
  const samples: Vec2[] = [
    { x: x0 + CELL_SIZE / 2, z: z0 + CELL_SIZE / 2 },
    { x: x0 + CELL_SIZE / 4, z: z0 + CELL_SIZE / 4 },
    { x: x0 + (3 * CELL_SIZE) / 4, z: z0 + CELL_SIZE / 4 },
    { x: x0 + CELL_SIZE / 4, z: z0 + (3 * CELL_SIZE) / 4 },
    { x: x0 + (3 * CELL_SIZE) / 4, z: z0 + (3 * CELL_SIZE) / 4 },
  ];
  return samples.some((p) => {
    if (p.x <= WORLD_BOUNDS.minX || p.x >= WORLD_BOUNDS.maxX) return false;
    if (p.z <= WORLD_BOUNDS.minZ || p.z >= WORLD_BOUNDS.maxZ) return false;
    const resolved = resolveColliders(p, PLAYER_RADIUS, COLLIDERS);
    return resolved.x === p.x && resolved.z === p.z;
  });
};

const buildReachableCells = (): ReadonlySet<string> => {
  const cols = Math.ceil((WORLD_BOUNDS.maxX - WORLD_BOUNDS.minX) / CELL_SIZE);
  const rows = Math.ceil((WORLD_BOUNDS.maxZ - WORLD_BOUNDS.minZ) / CELL_SIZE);
  const cells = new Set<string>();
  for (let cx = 0; cx < cols; cx += 1) {
    for (let cz = 0; cz < rows; cz += 1) {
      if (cellReachable(cx, cz)) cells.add(`${cx},${cz}`);
    }
  }
  return cells;
};

/** Every cell a player can actually stand in — 100% explored is achievable. */
export const REACHABLE_CELLS: ReadonlySet<string> = buildReachableCells();

/**
 * Appends the current cell to the visited list when it's new and reachable.
 * Returns the same array reference when nothing changed.
 */
export function markVisited(visited: readonly string[], pos: Vec2): readonly string[] {
  const cell = cellAt(pos);
  if (!REACHABLE_CELLS.has(cell) || visited.includes(cell)) return visited;
  return [...visited, cell];
}

/** Percentage of reachable Toronto this visitor has walked. */
export function explorationPercent(visited: readonly string[]): number {
  const seen = visited.filter((cell) => REACHABLE_CELLS.has(cell)).length;
  return Math.round((100 * seen) / REACHABLE_CELLS.size);
}
