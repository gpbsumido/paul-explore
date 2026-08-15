import { describe, it, expect } from "vitest";
import { MOTION_PRIMITIVES } from "./motionPrimitives";

/**
 * These eight are app-local, so they cannot go in COMPONENTS: catalog.test.ts
 * asserts exact set equality between every documented importName and the
 * exports of @paul-portfolio/react, and an app component fails it both ways.
 * They get their own list, held to the same documentation bar.
 */
describe("MOTION_PRIMITIVES", () => {
  it("documents all eight primitives", () => {
    expect(MOTION_PRIMITIVES.map((p) => p.name).sort()).toEqual([
      "AnimatedNumber",
      "BlobBackground",
      "GradientMesh",
      "MagneticButton",
      "ScrollProgress",
      "SpotlightCard",
      "TextReveal",
      "TextScramble",
    ]);
  });

  it("gives every primitive a stable unique id", () => {
    const ids = MOTION_PRIMITIVES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("gives every primitive a tagline and a reduced-motion contract", () => {
    for (const primitive of MOTION_PRIMITIVES) {
      expect(primitive.tagline.length).toBeGreaterThan(0);
      expect(primitive.reducedMotion.length).toBeGreaterThan(0);
    }
  });

  it("points every primitive at its real import path", () => {
    for (const primitive of MOTION_PRIMITIVES) {
      expect(primitive.importPath).toBe(
        `@/components/motion/${primitive.name}`,
      );
    }
  });

  it("marks every primitive as planned for the landing page", () => {
    for (const primitive of MOTION_PRIMITIVES) {
      expect(primitive.plannedFor).toBe("/");
    }
  });
});
