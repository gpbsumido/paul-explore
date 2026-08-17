import { describe, it, expect } from "vitest";
import { HERO_SHAPES } from "./heroShapes";
import {
  PARTICLE_COUNT,
  buildShapePoints,
  particleProgress,
} from "./heroParticles";

/**
 * The hero object is a cloud of particles sampled along each shape's wireframe
 * edges; a morph sends every particle to its slot on the next shape with a
 * per-particle stagger. three's geometry classes are plain maths, so all of
 * this runs in jsdom with no WebGL staged.
 */
describe("hero particle sampling", () => {
  it("samples the same fixed count for every shape, so morphs map 1:1", () => {
    for (const shape of HERO_SHAPES) {
      const points = buildShapePoints(shape.id);
      expect(points).toHaveLength(PARTICLE_COUNT * 3);
    }
  });

  it("is deterministic per shape", () => {
    expect(buildShapePoints("globe")).toEqual(buildShapePoints("globe"));
  });

  it("produces finite coordinates that actually occupy space", () => {
    for (const shape of HERO_SHAPES) {
      const points = buildShapePoints(shape.id);
      let min = Infinity;
      let max = -Infinity;
      for (const v of points) {
        expect(Number.isFinite(v)).toBe(true);
        min = Math.min(min, v);
        max = Math.max(max, v);
      }
      expect(max - min).toBeGreaterThan(1);
    }
  });

  it("gives different shapes different clouds", () => {
    expect(buildShapePoints("knot")).not.toEqual(buildShapePoints("card"));
  });
});

describe("particle progress", () => {
  it("holds a late-offset particle still while an early one travels", () => {
    const early = particleProgress(0.3, 0);
    const late = particleProgress(0.3, 1);
    expect(early).toBeGreaterThan(0);
    expect(late).toBe(0);
  });

  it("lands every particle exactly at the end, whatever its offset", () => {
    for (const offset of [0, 0.25, 0.5, 0.75, 1]) {
      expect(particleProgress(1, offset)).toBe(1);
      expect(particleProgress(0, offset)).toBe(0);
    }
  });

  it("stays inside [0, 1] for any input", () => {
    for (const t of [-1, 0, 0.4, 1, 2]) {
      for (const offset of [0, 0.5, 1]) {
        const p = particleProgress(t, offset);
        expect(p).toBeGreaterThanOrEqual(0);
        expect(p).toBeLessThanOrEqual(1);
      }
    }
  });
});
