import { describe, it, expect } from "vitest";
import {
  COLLECTIBLES,
  findCollectible,
  markVisited,
  explorationPercent,
  cellAt,
  REACHABLE_CELLS,
  PICKUP_RADIUS,
} from "../collectibles";
import { COLLIDERS } from "../cityLayout";
import { WORLD_BOUNDS, PLAYER_RADIUS } from "../movement";
import { resolveColliders } from "../colliders";

describe("the token catalog", () => {
  it("hides twenty-five tokens", () => {
    expect(COLLECTIBLES).toHaveLength(25);
  });

  it("gives every token a unique id", () => {
    const ids = COLLECTIBLES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps every token inside the walkable bounds", () => {
    for (const token of COLLECTIBLES) {
      expect(token.x, token.id).toBeGreaterThan(WORLD_BOUNDS.minX);
      expect(token.x, token.id).toBeLessThan(WORLD_BOUNDS.maxX);
      expect(token.z, token.id).toBeGreaterThan(WORLD_BOUNDS.minZ);
      expect(token.z, token.id).toBeLessThan(WORLD_BOUNDS.maxZ);
    }
  });

  it("never buries a token inside a building", () => {
    for (const token of COLLECTIBLES) {
      const resolved = resolveColliders({ x: token.x, z: token.z }, PLAYER_RADIUS, COLLIDERS);
      expect(resolved, `${token.id} is unreachable`).toEqual({ x: token.x, z: token.z });
    }
  });

  it("spreads tokens out so no two crowd each other", () => {
    for (const a of COLLECTIBLES) {
      for (const b of COLLECTIBLES) {
        if (a === b) continue;
        expect(
          Math.hypot(a.x - b.x, a.z - b.z),
          `${a.id} and ${b.id} are too close`,
        ).toBeGreaterThanOrEqual(6);
      }
    }
  });

  it("hides a few tokens that need a jump", () => {
    expect(COLLECTIBLES.filter((c) => c.elevated).length).toBeGreaterThanOrEqual(3);
  });
});

describe("findCollectible", () => {
  const token = COLLECTIBLES.find((c) => !c.elevated)!;
  const highToken = COLLECTIBLES.find((c) => c.elevated)!;

  it("picks up a ground token when walking over it", () => {
    expect(findCollectible({ x: token.x, z: token.z }, 0, [])).toBe(token);
  });

  it("ignores tokens already collected", () => {
    expect(findCollectible({ x: token.x, z: token.z }, 0, [token.id])).toBeNull();
  });

  it("ignores tokens out of reach", () => {
    expect(
      findCollectible({ x: token.x + PICKUP_RADIUS * 2, z: token.z }, 0, []),
    ).toBeNull();
  });

  it("requires being airborne for an elevated token", () => {
    expect(findCollectible({ x: highToken.x, z: highToken.z }, 0, [])).toBeNull();
    expect(findCollectible({ x: highToken.x, z: highToken.z }, 1.2, [])).toBe(highToken);
  });
});

describe("exploration", () => {
  it("counts only reachable cells, so 100% is actually possible", () => {
    expect(REACHABLE_CELLS.size).toBeGreaterThan(40);
    // A cell fully inside the Rogers Centre footprint must not count.
    expect(REACHABLE_CELLS.size).toBeLessThan(200);
  });

  it("marks a visited cell once", () => {
    const first = markVisited([], { x: -16, z: -4 });
    expect(first).toHaveLength(1);
    expect(markVisited(first, { x: -16.4, z: -4.2 })).toBe(first);
  });

  it("ignores positions outside any reachable cell bookkeeping", () => {
    const spawn = cellAt({ x: -18, z: -6 });
    expect(REACHABLE_CELLS.has(spawn)).toBe(true);
  });

  it("grows the percentage monotonically to a real 100", () => {
    const some = markVisited([], { x: -18, z: -6 });
    expect(explorationPercent(some)).toBeGreaterThan(0);
    const everywhere = [...REACHABLE_CELLS];
    expect(explorationPercent(everywhere)).toBe(100);
  });
});
