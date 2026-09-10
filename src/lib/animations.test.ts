import { describe, it, expect } from "vitest";
import { project } from "./animations";

describe("project (momentum)", () => {
  it("carries nowhere at rest", () => {
    expect(project(0)).toBe(0);
  });

  it("projects a downward flick to a positive distance", () => {
    expect(project(500)).toBeGreaterThan(0);
  });

  it("mirrors direction for an upward flick", () => {
    expect(project(-500)).toBeLessThan(0);
  });

  it("carries further the faster the flick", () => {
    expect(project(1000)).toBeGreaterThan(project(500));
  });

  it("carries less far with a snappier deceleration rate", () => {
    expect(project(500, 0.99)).toBeLessThan(project(500, 0.998));
  });
});
