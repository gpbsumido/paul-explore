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

  it("gives every shape a cloud of its own, no two alike", () => {
    const clouds = HERO_SHAPES.map((shape) =>
      Array.from(buildShapePoints(shape.id)).join(","),
    );
    expect(new Set(clouds).size).toBe(HERO_SHAPES.length);
  });

  it("keeps the card thin: it is a 1.6 by 2.2 slab, not a block", () => {
    const points = buildShapePoints("card");
    let deepest = 0;
    let widest = 0;
    let tallest = 0;
    for (let i = 0; i < points.length; i += 3) {
      widest = Math.max(widest, Math.abs(points[i]));
      tallest = Math.max(tallest, Math.abs(points[i + 1]));
      deepest = Math.max(deepest, Math.abs(points[i + 2]));
    }
    expect(widest).toBeCloseTo(0.8, 1);
    expect(tallest).toBeCloseTo(1.1, 1);
    expect(deepest).toBeLessThan(0.05);
  });

  it("spreads points by edge length, so a short edge is not as dense as a long one", () => {
    // The card's four thin edges (0.08 long) are under 3% of its wireframe. If
    // every edge drew the same share of particles they would hold a third.
    const points = buildShapePoints("card");
    let onThinEdges = 0;
    for (let i = 0; i < points.length; i += 3) {
      const atCornerColumn =
        Math.abs(Math.abs(points[i]) - 0.8) < 0.01 &&
        Math.abs(Math.abs(points[i + 1]) - 1.1) < 0.01;
      if (atCornerColumn) onThinEdges += 1;
    }
    expect(onThinEdges / PARTICLE_COUNT).toBeLessThan(0.08);
  });
});

describe("particle progress", () => {
  it("holds a late-offset particle still while an early one travels", () => {
    const early = particleProgress(0.3, 0);
    const late = particleProgress(0.3, 1);
    expect(early).toBeGreaterThan(0);
    expect(late).toBe(0);
  });

  it("eases in and out, so a particle never snaps off or onto its mark", () => {
    // Offset 0 travels over t in [0, 0.6]. A straight line would read 0.25 and
    // 0.75 at a quarter and three quarters of the way; the ease is gentler at
    // both ends.
    expect(particleProgress(0.15, 0)).toBeLessThan(0.25);
    expect(particleProgress(0.45, 0)).toBeGreaterThan(0.75);
    expect(particleProgress(0.3, 0)).toBeCloseTo(0.5, 5);
  });

  it("only ever moves forward as the morph advances", () => {
    for (const offset of [0, 0.4, 1]) {
      let previous = -1;
      for (let t = 0; t <= 1.0001; t += 0.05) {
        const progress = particleProgress(t, offset);
        expect(progress).toBeGreaterThanOrEqual(previous);
        previous = progress;
      }
    }
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
