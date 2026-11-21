import { describe, it, expect } from "vitest";
import { viewportRect, minimapPointToScroll } from "./arrange";

const wall = { width: 100, height: 80 };

// A window zoomed 2x: content is twice the client size in each axis.
const metrics = {
  scrollLeft: 0,
  scrollTop: 0,
  scrollWidth: 400,
  scrollHeight: 320,
  clientWidth: 200,
  clientHeight: 160,
};

describe("viewportRect", () => {
  it("covers the whole wall when nothing is scrollable", () => {
    const flat = { ...metrics, scrollWidth: 0, scrollHeight: 0 };
    expect(viewportRect(flat, wall)).toMatchObject({
      x: 0,
      y: 0,
      width: 100,
      height: 80,
    });
  });

  it("shows the visible share of the wall at the scrolled offset", () => {
    expect(
      viewportRect({ ...metrics, scrollLeft: 100, scrollTop: 80 }, wall),
    ).toMatchObject({ x: 25, y: 20, width: 50, height: 40 });
  });

  it("never claims more than the whole wall when the window is larger than the content", () => {
    const small = { ...metrics, scrollWidth: 100, scrollHeight: 80 };
    expect(viewportRect(small, wall)).toMatchObject({ width: 100, height: 80 });
  });
});

describe("minimapPointToScroll", () => {
  it("centres the window on the requested wall point", () => {
    const { scrollLeft, scrollTop } = minimapPointToScroll(
      { x: 50, y: 40 },
      metrics,
      wall,
    );
    // Feeding that scroll back through viewportRect should centre the box on the point.
    const box = viewportRect({ ...metrics, scrollLeft, scrollTop }, wall);
    expect(box.x + box.width / 2).toBeCloseTo(50, 5);
    expect(box.y + box.height / 2).toBeCloseTo(40, 5);
  });

  it("clamps to the top-left corner when the point is at the wall origin", () => {
    expect(minimapPointToScroll({ x: 0, y: 0 }, metrics, wall)).toEqual({
      scrollLeft: 0,
      scrollTop: 0,
    });
  });

  it("clamps to the bottom-right corner when the point is past the far edge", () => {
    expect(minimapPointToScroll({ x: 100, y: 80 }, metrics, wall)).toEqual({
      scrollLeft: 200, // scrollWidth - clientWidth
      scrollTop: 160, // scrollHeight - clientHeight
    });
  });

  it("returns the origin when nothing is scrollable", () => {
    const flat = { ...metrics, scrollWidth: 0, scrollHeight: 0 };
    expect(minimapPointToScroll({ x: 50, y: 40 }, flat, wall)).toEqual({
      scrollLeft: 0,
      scrollTop: 0,
    });
  });

  it("stays at the origin when the content is smaller than the window", () => {
    const small = { ...metrics, scrollWidth: 100, scrollHeight: 80 };
    expect(minimapPointToScroll({ x: 50, y: 40 }, small, wall)).toEqual({
      scrollLeft: 0,
      scrollTop: 0,
    });
  });
});
