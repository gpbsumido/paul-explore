import { describe, it, expect } from "vitest";
import { arrangeMasonry } from "./arrange";
import { findOverlaps } from "./arrange";

const frame = (id: string, width: number, height: number) => ({
  id,
  width,
  height,
});

describe("arrangeMasonry", () => {
  it("returns no placements for an empty wall", () => {
    const result = arrangeMasonry({
      wallWidth: 100,
      wallHeight: 100,
      gap: 2,
      frames: [],
    });
    expect(result.placements).toEqual([]);
  });

  it("spreads frames across columns instead of one flat row", () => {
    const result = arrangeMasonry({
      wallWidth: 100,
      wallHeight: 200,
      gap: 4,
      frames: [
        frame("a", 20, 40),
        frame("b", 20, 10),
        frame("c", 20, 30),
        frame("d", 20, 20),
      ],
    });
    // With four equal-width frames there should be more than one column.
    const xs = new Set(result.placements.map((p) => p.x));
    expect(xs.size).toBeGreaterThan(1);
  });

  it("never overlaps frames", () => {
    const result = arrangeMasonry({
      wallWidth: 90,
      wallHeight: 300,
      gap: 3,
      frames: [
        frame("a", 20, 40),
        frame("b", 25, 15),
        frame("c", 18, 33),
        frame("d", 22, 26),
        frame("e", 20, 50),
        frame("f", 24, 12),
      ],
    });
    expect(findOverlaps(result.placements)).toEqual([]);
  });

  it("staggers column heights by filling the shortest column next", () => {
    // Two columns. A tall frame lands in col 0, then a short frame should go to
    // col 1 (the shortest), not stack under the tall one.
    const result = arrangeMasonry({
      wallWidth: 46,
      wallHeight: 200,
      gap: 2,
      frames: [frame("tall", 20, 40), frame("short", 20, 10)],
    });
    const tall = result.placements.find((p) => p.id === "tall")!;
    const short = result.placements.find((p) => p.id === "short")!;
    expect(short.x).not.toBeCloseTo(tall.x, 5);
    expect(short.y).toBeCloseTo(tall.y, 5);
  });

  it("reports overflow when a column runs past the wall height", () => {
    const result = arrangeMasonry({
      wallWidth: 24,
      wallHeight: 30,
      gap: 2,
      frames: [frame("a", 20, 20), frame("b", 20, 20)],
    });
    // One column, two 20-tall frames + gap = 42 > 30.
    expect(result.overflows).toBe(true);
  });
});
