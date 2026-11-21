import { describe, it, expect } from "vitest";
import { defaultFidelity } from "../fidelity";

describe("defaultFidelity", () => {
  it("keeps phones and tablets low-poly, however many cores they report", () => {
    expect(defaultFidelity({ cores: 8, coarsePointer: true })).toBe(0.35);
    expect(defaultFidelity({ cores: 16, memory: 16, coarsePointer: true })).toBe(0.35);
  });

  it("gives beefy desktops the high end, by cores or by memory", () => {
    expect(defaultFidelity({ cores: 16, memory: 16, coarsePointer: false })).toBe(0.85);
    expect(defaultFidelity({ cores: 12, coarsePointer: false })).toBe(0.85);
    expect(defaultFidelity({ cores: 4, memory: 16, coarsePointer: false })).toBe(0.85);
  });

  it("steps down through the middle tiers as cores drop", () => {
    expect(defaultFidelity({ cores: 8, coarsePointer: false })).toBe(0.7);
    expect(defaultFidelity({ cores: 11, coarsePointer: false })).toBe(0.7);
    expect(defaultFidelity({ cores: 4, coarsePointer: false })).toBe(0.5);
    expect(defaultFidelity({ cores: 7, coarsePointer: false })).toBe(0.5);
  });

  it("plays it safe when the browser reveals nothing", () => {
    expect(defaultFidelity({ coarsePointer: false })).toBe(0.4);
  });

  it("gives a two-core machine the floor", () => {
    expect(defaultFidelity({ cores: 2, memory: 4, coarsePointer: false })).toBe(0.4);
  });

  it("always returns a valid slider value", () => {
    for (const cores of [undefined, 2, 4, 8, 12, 32]) {
      const value = defaultFidelity({ cores, coarsePointer: false });
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
  });
});
