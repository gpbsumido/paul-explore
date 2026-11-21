import { describe, it, expect } from "vitest";
import { ROADS, BUILDINGS, COLLIDERS, SPAWN, LAKE_EDGE_Z } from "../cityLayout";
import { EXHIBITS } from "../exhibits";
import { WORLD_BOUNDS, PLAYER_RADIUS } from "../movement";
import { resolveColliders } from "../colliders";

const roadRect = (road: (typeof ROADS)[number]) =>
  road.orientation === "ns"
    ? {
        x: road.at,
        z: (road.from + road.to) / 2,
        halfX: road.width / 2,
        halfZ: (road.to - road.from) / 2,
      }
    : {
        x: (road.from + road.to) / 2,
        z: road.at,
        halfX: (road.to - road.from) / 2,
        halfZ: road.width / 2,
      };

const rectsOverlap = (
  a: { x: number; z: number; halfX: number; halfZ: number },
  b: { x: number; z: number; halfX: number; halfZ: number },
) => Math.abs(a.x - b.x) < a.halfX + b.halfX && Math.abs(a.z - b.z) < a.halfZ + b.halfZ;

describe("city layout", () => {
  it("names its streets after the real Toronto grid", () => {
    const names = ROADS.map((r) => r.name);
    for (const street of ["Yonge St", "Queen St W", "Front St W", "University Ave", "Spadina Ave"]) {
      expect(names).toContain(street);
    }
  });

  it("keeps every building off the streets", () => {
    const roadRects = ROADS.map(roadRect);
    for (const building of BUILDINGS) {
      const footprint = {
        x: building.x,
        z: building.z,
        halfX: building.width / 2,
        halfZ: building.depth / 2,
      };
      const collision = roadRects.find((road) => rectsOverlap(footprint, road));
      expect(
        collision,
        `building at (${building.x}, ${building.z}) overlaps ${collision?.halfX}`,
      ).toBeUndefined();
    }
  });

  it("keeps every building inside the world bounds and north of the lake", () => {
    for (const building of BUILDINGS) {
      expect(building.x - building.width / 2).toBeGreaterThanOrEqual(WORLD_BOUNDS.minX);
      expect(building.x + building.width / 2).toBeLessThanOrEqual(WORLD_BOUNDS.maxX);
      expect(building.z - building.depth / 2).toBeGreaterThanOrEqual(WORLD_BOUNDS.minZ);
      expect(building.z + building.depth / 2).toBeLessThanOrEqual(LAKE_EDGE_Z);
      expect(building.height).toBeGreaterThan(0);
    }
  });

  it("has a collider for every generated building", () => {
    for (const building of BUILDINGS) {
      const match = COLLIDERS.find(
        (c) => c.x === building.x && c.z === building.z && c.halfX === building.width / 2,
      );
      expect(match).toBeDefined();
    }
  });

  it("leaves a clearing around every exhibit and around the spawn point", () => {
    const clearings = [
      ...EXHIBITS.map((e) => ({ name: e.featureId, x: e.position.x, z: e.position.z })),
      { name: "spawn", x: SPAWN.x, z: SPAWN.z },
    ];
    for (const clearing of clearings) {
      const blocker = BUILDINGS.find(
        (b) =>
          Math.abs(b.x - clearing.x) < b.width / 2 + 3 &&
          Math.abs(b.z - clearing.z) < b.depth / 2 + 3,
      );
      expect(blocker, `a generated building crowds ${clearing.name}`).toBeUndefined();
    }
  });

  it("builds a dense enough downtown to feel like a city", () => {
    expect(BUILDINGS.length).toBeGreaterThan(40);
  });

  it("spawns the player on walkable ground inside the bounds", () => {
    expect(SPAWN.x).toBeGreaterThan(WORLD_BOUNDS.minX);
    expect(SPAWN.x).toBeLessThan(WORLD_BOUNDS.maxX);
    expect(SPAWN.z).toBeGreaterThan(WORLD_BOUNDS.minZ);
    expect(SPAWN.z).toBeLessThan(WORLD_BOUNDS.maxZ);
    expect(resolveColliders(SPAWN, PLAYER_RADIUS, COLLIDERS)).toEqual(SPAWN);
  });

  it("is deterministic — the same layout every load", () => {
    const signature = BUILDINGS.slice(0, 5).map((b) => `${b.x},${b.z},${b.height.toFixed(3)}`);
    expect(signature).toMatchSnapshot();
  });
});
