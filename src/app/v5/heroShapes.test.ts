import { describe, it, expect } from "vitest";
import { HERO_SHAPES, pickNextShape, MORPH_HOLD_S } from "./heroShapes";

/**
 * The hero object cycles through wireframe shapes, each one standing for a
 * piece of the work on this site. The cycle logic is pure so the canvas file
 * stays all rendering: jsdom cannot run WebGL, but it can prove the rotation
 * never stalls on one shape and never points outside the list.
 */
describe("hero shapes", () => {
  it("has enough shapes that the cycle reads as a sequence, not a toggle", () => {
    expect(HERO_SHAPES.length).toBeGreaterThanOrEqual(5);
  });

  it("gives every shape a unique id and a reason to be there", () => {
    const ids = HERO_SHAPES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const shape of HERO_SHAPES) {
      expect(shape.stands_for.length).toBeGreaterThan(3);
    }
  });

  it("holds each shape long enough to actually look at it", () => {
    expect(MORPH_HOLD_S).toBeGreaterThanOrEqual(5);
    expect(MORPH_HOLD_S).toBeLessThanOrEqual(9);
  });

  it("never repeats the current shape back to back", () => {
    for (let current = 0; current < HERO_SHAPES.length; current++) {
      for (const roll of [0, 0.25, 0.5, 0.75, 0.999]) {
        const next = pickNextShape(current, () => roll);
        expect(next).not.toBe(current);
        expect(next).toBeGreaterThanOrEqual(0);
        expect(next).toBeLessThan(HERO_SHAPES.length);
      }
    }
  });

  it("is deterministic for a fixed draw", () => {
    expect(pickNextShape(2, () => 0.6)).toBe(pickNextShape(2, () => 0.6));
  });
});
