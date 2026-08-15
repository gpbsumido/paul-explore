import { describe, it, expect } from "vitest";
import { blobPath } from "./blobPath";

/**
 * blobPath is the deterministic half of BlobBackground. The component layers
 * whatever this returns, so every guarantee worth having lives here: same seed
 * gives the same shape, the shape closes, and nothing escapes the viewBox.
 */
describe("blobPath", () => {
  it("returns an identical path for the same seed", () => {
    const first = blobPath({ seed: 7, points: 8, variance: 0.4, size: 200 });
    const second = blobPath({ seed: 7, points: 8, variance: 0.4, size: 200 });
    expect(first).toBe(second);
  });

  it("returns a different path for a different seed", () => {
    const a = blobPath({ seed: 7, points: 8, variance: 0.4, size: 200 });
    const b = blobPath({ seed: 8, points: 8, variance: 0.4, size: 200 });
    expect(a).not.toBe(b);
  });

  it("closes the path so the fill never leaks", () => {
    const d = blobPath({ seed: 3, points: 6, variance: 0.5, size: 200 });
    expect(d.trim().endsWith("Z")).toBe(true);
  });

  it("starts with a single move command", () => {
    const d = blobPath({ seed: 3, points: 6, variance: 0.5, size: 200 });
    expect(d.trim().startsWith("M")).toBe(true);
    expect(d.match(/M/g)).toHaveLength(1);
  });

  it("keeps every coordinate inside the viewBox at maximum variance", () => {
    const size = 200;
    const d = blobPath({ seed: 11, points: 12, variance: 1, size });
    const numbers = d.match(/-?\d+(\.\d+)?/g) ?? [];
    expect(numbers.length).toBeGreaterThan(0);
    for (const raw of numbers) {
      const value = Number(raw);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(size);
    }
  });

  it("emits one curve segment per point", () => {
    const six = blobPath({ seed: 5, points: 6, variance: 0.3, size: 200 });
    const twelve = blobPath({ seed: 5, points: 12, variance: 0.3, size: 200 });
    expect(six.match(/C/g)).toHaveLength(6);
    expect(twelve.match(/C/g)).toHaveLength(12);
  });

  it("collapses to a circle when variance is zero", () => {
    const a = blobPath({ seed: 1, points: 8, variance: 0, size: 200 });
    const b = blobPath({ seed: 999, points: 8, variance: 0, size: 200 });
    expect(a).toBe(b);
  });
});
