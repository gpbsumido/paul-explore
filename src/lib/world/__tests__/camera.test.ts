import { describe, it, expect } from "vitest";
import { visibleFraction, MIN_CAMERA_FRACTION } from "../camera";
import { OCCLUDERS } from "../cityLayout";

const anchor = { x: 0, y: 1.6, z: 0 };
const desired = { x: 0, y: 10.5, z: 12.5 };

const tower = (z: number, height: number) => ({ x: 0, z, halfX: 2, halfZ: 2, height });

describe("visibleFraction", () => {
  it("keeps the full boom when nothing is in the way", () => {
    expect(visibleFraction(anchor, desired, [])).toBe(1);
  });

  it("zooms in past a tower standing between camera and player", () => {
    const fraction = visibleFraction(anchor, desired, [tower(6, 30)]);
    expect(fraction).toBeLessThan(0.7);
    expect(fraction).toBeGreaterThanOrEqual(MIN_CAMERA_FRACTION);
  });

  it("sails over low buildings", () => {
    expect(visibleFraction(anchor, desired, [tower(6, 2)])).toBe(1);
  });

  it("ignores buildings beyond the camera", () => {
    expect(visibleFraction(anchor, desired, [tower(20, 30)])).toBe(1);
  });

  it("never collapses the boom entirely", () => {
    const fraction = visibleFraction(anchor, desired, [tower(1, 40)]);
    expect(fraction).toBeGreaterThanOrEqual(MIN_CAMERA_FRACTION);
  });

  it("has real occluders to work against", () => {
    expect(OCCLUDERS.length).toBeGreaterThan(60);
    expect(OCCLUDERS.every((o) => o.height > 0)).toBe(true);
  });
});
