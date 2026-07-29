import { describe, it, expect } from "vitest";
import { resolveColliders } from "../colliders";
import type { RectCollider } from "@/types/world";

const RADIUS = 0.5;
const box: RectCollider = { x: 0, z: 0, halfX: 2, halfZ: 2 };

describe("resolveColliders", () => {
  it("leaves a position that is clear of every collider untouched", () => {
    const pos = { x: 10, z: -10 };
    expect(resolveColliders(pos, RADIUS, [box])).toEqual(pos);
  });

  it("pushes an overlapping circle back out of a face", () => {
    // Approaching the east face (x = 2) with the circle center just inside reach.
    const resolved = resolveColliders({ x: 2.2, z: 0 }, RADIUS, [box]);
    expect(resolved.x).toBeCloseTo(2.5);
    expect(resolved.z).toBeCloseTo(0);
  });

  it("pushes a center that is inside the box out through the nearest face", () => {
    const resolved = resolveColliders({ x: 1.7, z: 0.1 }, RADIUS, [box]);
    expect(resolved.x).toBeCloseTo(2.5);
    expect(resolved.z).toBeCloseTo(0.1);
  });

  it("pushes out diagonally at a corner", () => {
    const resolved = resolveColliders({ x: 2.2, z: 2.2 }, RADIUS, [box]);
    const cornerDistance = Math.hypot(resolved.x - 2, resolved.z - 2);
    expect(cornerDistance).toBeCloseTo(RADIUS);
    expect(resolved.x).toBeGreaterThan(2.2);
    expect(resolved.z).toBeGreaterThan(2.2);
  });

  it("resolves against multiple colliders", () => {
    const other: RectCollider = { x: 6, z: 0, halfX: 1, halfZ: 1 };
    const clearOfFirst = resolveColliders({ x: 5.2, z: 0 }, RADIUS, [box, other]);
    expect(clearOfFirst.x).toBeCloseTo(4.5);
  });

  it("does not mutate the input position", () => {
    const pos = { x: 2.2, z: 0 };
    resolveColliders(pos, RADIUS, [box]);
    expect(pos).toEqual({ x: 2.2, z: 0 });
  });
});
