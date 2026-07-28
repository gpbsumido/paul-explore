import { describe, it, expect } from "vitest";
import {
  rectsOverlap,
  findOverlaps,
  findOutOfBounds,
  clientDeltaToWall,
  viewportRect,
  type Placement,
} from "./arrange";

const rect = (
  id: string,
  x: number,
  y: number,
  width = 10,
  height = 10,
): Placement => ({ id, x, y, width, height });

describe("rectsOverlap", () => {
  it("is true when two frames intersect", () => {
    expect(rectsOverlap(rect("a", 0, 0), rect("b", 5, 5))).toBe(true);
  });

  it("is false when frames are fully apart", () => {
    expect(rectsOverlap(rect("a", 0, 0), rect("b", 20, 20))).toBe(false);
  });

  it("treats frames that merely touch edges as not overlapping", () => {
    // a spans x 0..10, b starts exactly at x 10 -- flush, not overlapping.
    expect(rectsOverlap(rect("a", 0, 0), rect("b", 10, 0))).toBe(false);
  });
});

describe("findOverlaps", () => {
  it("returns no ids when nothing overlaps", () => {
    expect(findOverlaps([rect("a", 0, 0), rect("b", 20, 0)])).toEqual([]);
  });

  it("returns every id involved in an overlap", () => {
    const ids = findOverlaps([
      rect("a", 0, 0),
      rect("b", 5, 5),
      rect("c", 40, 40),
    ]);
    expect(new Set(ids)).toEqual(new Set(["a", "b"]));
    expect(ids).not.toContain("c");
  });

  it("reports each overlapping id once even in a pile-up", () => {
    const ids = findOverlaps([
      rect("a", 0, 0),
      rect("b", 2, 2),
      rect("c", 4, 4),
    ]);
    expect(ids.slice().sort()).toEqual(["a", "b", "c"]);
  });
});

describe("findOutOfBounds", () => {
  const wall = { width: 100, height: 60 };

  it("returns nothing when every frame is inside the wall", () => {
    expect(findOutOfBounds([rect("a", 0, 0), rect("b", 80, 40)], wall)).toEqual(
      [],
    );
  });

  it("flags a frame that runs off the right edge", () => {
    expect(findOutOfBounds([rect("a", 95, 0)], wall)).toEqual(["a"]);
  });

  it("flags a frame with a negative coordinate", () => {
    expect(findOutOfBounds([rect("a", -1, 0)], wall)).toEqual(["a"]);
  });

  it("flags a frame that runs off the bottom", () => {
    expect(findOutOfBounds([rect("a", 0, 55)], wall)).toEqual(["a"]);
  });
});

describe("clientDeltaToWall", () => {
  it("scales a pixel delta into wall units by the rendered size", () => {
    // The wall is 100 units wide rendered across 400px, so 1px = 0.25 units.
    const delta = clientDeltaToWall(40, 20, {
      pxWidth: 400,
      pxHeight: 240,
      wallWidth: 100,
      wallHeight: 60,
    });
    expect(delta.dx).toBeCloseTo(10, 5);
    expect(delta.dy).toBeCloseTo(5, 5);
  });

  it("uses a single uniform scale when the window is letterboxed", () => {
    // Window 400x400, wall 100x60 -> fits to width (scale 4), height letterboxed.
    const delta = clientDeltaToWall(40, 40, {
      pxWidth: 400,
      pxHeight: 400,
      wallWidth: 100,
      wallHeight: 60,
    });
    expect(delta.dx).toBeCloseTo(10, 5);
    expect(delta.dy).toBeCloseTo(10, 5);
  });

  it("returns a zero delta when the rendered size is zero", () => {
    const delta = clientDeltaToWall(40, 20, {
      pxWidth: 0,
      pxHeight: 0,
      wallWidth: 100,
      wallHeight: 60,
    });
    expect(delta).toEqual({ dx: 0, dy: 0 });
  });
});

describe("viewportRect", () => {
  const wall = { width: 100, height: 60 };

  it("covers the whole wall when nothing is scrollable", () => {
    const rect = viewportRect(
      {
        scrollLeft: 0,
        scrollTop: 0,
        scrollWidth: 400,
        scrollHeight: 240,
        clientWidth: 400,
        clientHeight: 240,
      },
      wall,
    );
    expect(rect).toMatchObject({ x: 0, y: 0, width: 100, height: 60 });
  });

  it("shrinks and offsets with scroll when zoomed in", () => {
    // Zoomed 2x and scrolled to the far corner.
    const rect = viewportRect(
      {
        scrollLeft: 400,
        scrollTop: 240,
        scrollWidth: 800,
        scrollHeight: 480,
        clientWidth: 400,
        clientHeight: 240,
      },
      wall,
    );
    expect(rect.width).toBeCloseTo(50, 5);
    expect(rect.height).toBeCloseTo(30, 5);
    expect(rect.x).toBeCloseTo(50, 5);
    expect(rect.y).toBeCloseTo(30, 5);
  });

  it("falls back to the full wall before layout", () => {
    const rect = viewportRect(
      {
        scrollLeft: 0,
        scrollTop: 0,
        scrollWidth: 0,
        scrollHeight: 0,
        clientWidth: 0,
        clientHeight: 0,
      },
      wall,
    );
    expect(rect).toMatchObject({ width: 100, height: 60 });
  });
});
