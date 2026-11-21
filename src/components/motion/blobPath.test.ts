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

  it("rounds coordinates to two decimals so the markup stays small", () => {
    const d = blobPath({ seed: 21, points: 8, variance: 0.6, size: 200 });
    expect(d).not.toMatch(/\.\d{3,}/);
  });

  it("traces a round outline when variance is zero, not a lumpy one", () => {
    const size = 200;
    const d = blobPath({ seed: 4, points: 8, variance: 0, size });
    const [startX, startY, ...rest] = (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);
    const radiusOf = (x: number, y: number) =>
      Math.hypot(x - size / 2, y - size / 2);
    const nominal = size * 0.44;
    expect(radiusOf(startX, startY)).toBeCloseTo(nominal, 0);

    // Walk each cubic segment and take its midpoint: on a circle they all sit
    // at the nominal radius, and a mis-scaled control point bows them off it.
    let from = [startX, startY];
    for (let i = 0; i + 5 < rest.length; i += 6) {
      const [c1x, c1y, c2x, c2y, x, y] = rest.slice(i, i + 6);
      const midX = (from[0] + 3 * c1x + 3 * c2x + x) / 8;
      const midY = (from[1] + 3 * c1y + 3 * c2y + y) / 8;
      expect(Math.abs(radiusOf(midX, midY) - nominal)).toBeLessThan(1.5);
      from = [x, y];
    }
  });
});
