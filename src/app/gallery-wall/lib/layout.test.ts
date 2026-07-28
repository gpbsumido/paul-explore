import { describe, it, expect } from "vitest";
import { arrangeWall } from "./layout";

const frame = (id: string, width: number, height: number) => ({
  id,
  width,
  height,
});

describe("arrangeWall", () => {
  it("returns no placements for an empty wall", () => {
    const result = arrangeWall({
      wallWidth: 100,
      wallHeight: 50,
      gap: 2,
      frames: [],
    });
    expect(result.placements).toEqual([]);
    expect(result.contentHeight).toBe(0);
    expect(result.overflows).toBe(false);
  });

  it("lays a single row left to right when it fits the wall width", () => {
    const result = arrangeWall({
      wallWidth: 100,
      wallHeight: 50,
      gap: 2,
      frames: [frame("a", 20, 10), frame("b", 20, 10), frame("c", 20, 10)],
    });
    const ys = result.placements.map((p) => p.y);
    expect(new Set(ys).size).toBe(1);
    const xs = result.placements.map((p) => p.x);
    expect(xs[0]).toBeLessThan(xs[1]);
    expect(xs[1]).toBeLessThan(xs[2]);
  });

  it("keeps a fixed gap between frames in a row", () => {
    const result = arrangeWall({
      wallWidth: 100,
      wallHeight: 50,
      gap: 4,
      frames: [frame("a", 20, 10), frame("b", 20, 10)],
    });
    const [a, b] = result.placements;
    expect(b.x - (a.x + a.width)).toBe(4);
  });

  it("centers a row horizontally within the wall", () => {
    const result = arrangeWall({
      wallWidth: 100,
      wallHeight: 50,
      gap: 0,
      frames: [frame("a", 20, 10), frame("b", 20, 10)],
    });
    const [a, b] = result.placements;
    const rowWidth = b.x + b.width - a.x;
    const leftMargin = a.x;
    const rightMargin = 100 - (b.x + b.width);
    expect(rowWidth).toBe(40);
    expect(leftMargin).toBeCloseTo(rightMargin, 5);
  });

  it("wraps to a new row when the next frame exceeds the wall width", () => {
    const result = arrangeWall({
      wallWidth: 50,
      wallHeight: 100,
      gap: 2,
      frames: [frame("a", 30, 10), frame("b", 30, 10)],
    });
    const [a, b] = result.placements;
    expect(b.y).toBeGreaterThan(a.y);
    expect(b.x).toBeCloseTo(a.x, 5);
  });

  it("vertically centers frames of differing heights within their row", () => {
    const result = arrangeWall({
      wallWidth: 100,
      wallHeight: 50,
      gap: 2,
      frames: [frame("tall", 20, 30), frame("short", 20, 10)],
    });
    const tall = result.placements.find((p) => p.id === "tall")!;
    const short = result.placements.find((p) => p.id === "short")!;
    const tallCenter = tall.y + tall.height / 2;
    const shortCenter = short.y + short.height / 2;
    expect(tallCenter).toBeCloseTo(shortCenter, 5);
  });

  it("stacks rows with the gap and reports total content height", () => {
    const result = arrangeWall({
      wallWidth: 50,
      wallHeight: 100,
      gap: 5,
      frames: [frame("a", 40, 10), frame("b", 40, 20)],
    });
    // Two rows: heights 10 and 20, one gap of 5 between them.
    expect(result.contentHeight).toBe(35);
    const [a, b] = result.placements;
    expect(b.y - (a.y + a.height)).toBe(5);
  });

  it("flags overflow when the stacked rows are taller than the wall", () => {
    const result = arrangeWall({
      wallWidth: 50,
      wallHeight: 25,
      gap: 5,
      frames: [frame("a", 40, 10), frame("b", 40, 20)],
    });
    expect(result.contentHeight).toBe(35);
    expect(result.overflows).toBe(true);
  });

  it("flags overflow when a single frame is wider than the wall", () => {
    const result = arrangeWall({
      wallWidth: 20,
      wallHeight: 100,
      gap: 2,
      frames: [frame("wide", 40, 10)],
    });
    expect(result.overflows).toBe(true);
  });
});
