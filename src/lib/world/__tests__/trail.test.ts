import { describe, it, expect } from "vitest";
import {
  pushTrailPoint,
  trailStrength,
  TRAIL_LIFETIME,
  TRAIL_MIN_SPACING,
  TRAIL_MAX_POINTS,
  type TrailPoint,
} from "../trail";

const at = (x: number, z: number, t: number): TrailPoint => ({ x, z, t });

describe("pushTrailPoint", () => {
  it("starts a trail from nothing", () => {
    expect(pushTrailPoint([], at(1, 2, 0))).toEqual([at(1, 2, 0)]);
  });

  it("keeps newest first", () => {
    const trail = pushTrailPoint([at(0, 0, 0)], at(5, 0, 1));
    expect(trail[0]).toEqual(at(5, 0, 1));
  });

  it("skips samples closer than the spacing", () => {
    const trail = pushTrailPoint([at(0, 0, 0)], at(TRAIL_MIN_SPACING / 2, 0, 1));
    expect(trail).toHaveLength(1);
  });

  it("drops points older than the lifetime as new ones arrive", () => {
    const trail = pushTrailPoint([at(0, 0, 0)], at(5, 0, TRAIL_LIFETIME + 1));
    expect(trail).toEqual([at(5, 0, TRAIL_LIFETIME + 1)]);
  });

  it("caps the number of points", () => {
    const long = Array.from({ length: TRAIL_MAX_POINTS }, (_, i) =>
      at(i * TRAIL_MIN_SPACING * 2, 0, 4 - i * 0.1),
    );
    const trail = pushTrailPoint(long, at(-5, 0, 4.1));
    expect(trail.length).toBeLessThanOrEqual(TRAIL_MAX_POINTS);
    expect(trail[0]).toEqual(at(-5, 0, 4.1));
  });
});

describe("trailStrength", () => {
  it("is full for a fresh point and gone at end of life", () => {
    expect(trailStrength(at(0, 0, 10), 10)).toBeCloseTo(1);
    expect(trailStrength(at(0, 0, 10), 10 + TRAIL_LIFETIME)).toBe(0);
  });

  it("fades monotonically with age", () => {
    const young = trailStrength(at(0, 0, 10), 11);
    const old = trailStrength(at(0, 0, 10), 13);
    expect(young).toBeGreaterThan(old);
    expect(old).toBeGreaterThan(0);
  });
});
