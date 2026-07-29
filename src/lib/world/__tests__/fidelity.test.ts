import { describe, it, expect } from "vitest";
import { defaultFidelity } from "../fidelity";

describe("defaultFidelity", () => {
  it("keeps phones and tablets low-poly", () => {
    expect(defaultFidelity({ cores: 8, coarsePointer: true })).toBeLessThanOrEqual(0.4);
  });

  it("gives beefy desktops the high end", () => {
    expect(defaultFidelity({ cores: 16, memory: 16, coarsePointer: false })).toBeGreaterThanOrEqual(
      0.8,
    );
  });

  it("lands mid-range hardware in the middle", () => {
    const mid = defaultFidelity({ cores: 8, coarsePointer: false });
    expect(mid).toBeGreaterThan(0.4);
    expect(mid).toBeLessThan(0.8);
  });

  it("plays it safe when the browser reveals nothing", () => {
    const unknown = defaultFidelity({ coarsePointer: false });
    expect(unknown).toBeGreaterThanOrEqual(0.35);
    expect(unknown).toBeLessThanOrEqual(0.6);
  });

  it("always returns a valid slider value", () => {
    for (const cores of [undefined, 2, 4, 8, 12, 32]) {
      const value = defaultFidelity({ cores, coarsePointer: false });
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
  });
});
