import { describe, it, expect } from "vitest";
import { instantTransition, project, staggerContainer } from "./animations";

describe("project (momentum)", () => {
  it("carries nowhere at rest", () => {
    expect(project(0)).toBe(0);
  });

  it("projects a downward flick with the exponential-decay distance", () => {
    // 0.5 px/ms * 0.998 / (1 - 0.998) = 249.5px
    expect(project(500)).toBeCloseTo(249.5, 5);
  });

  it("mirrors direction for an upward flick", () => {
    expect(project(-500)).toBeCloseTo(-249.5, 5);
  });

  it("carries further the faster the flick", () => {
    expect(project(1000)).toBeGreaterThan(project(500));
  });

  it("carries less far with a snappier deceleration rate", () => {
    expect(project(500, 0.99)).toBeCloseTo(49.5, 5);
    expect(project(500, 0.99)).toBeLessThan(project(500, 0.998));
  });
});

describe("staggerContainer", () => {
  it("staggers children 0.06s apart with no delay by default", () => {
    expect(staggerContainer()).toEqual({
      hidden: {},
      visible: { transition: { staggerChildren: 0.06, delayChildren: 0 } },
    });
  });

  it("passes the stagger and the initial delay through in that order", () => {
    expect(staggerContainer(0.2, 0.5).visible).toEqual({
      transition: { staggerChildren: 0.2, delayChildren: 0.5 },
    });
  });
});

describe("instantTransition", () => {
  it("has no duration, so reduced-motion users skip the animation", () => {
    expect(instantTransition).toEqual({ duration: 0 });
  });
});
