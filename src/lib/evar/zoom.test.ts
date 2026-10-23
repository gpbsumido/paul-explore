import { describe, it, expect } from "vitest";
import { MAX_SCALE, fullView, zoomAt, panBy, toImage, toViewport, follow } from "./zoom";

const SIZE = 384;

describe("zoomAt", () => {
  it("keeps the point it zooms on under the same spot in the viewport", () => {
    const anchor = { x: 100, y: 300 };
    const before = toViewport(fullView(SIZE), anchor, SIZE);
    const zoomed = zoomAt(fullView(SIZE), 2, anchor, SIZE);
    expect(zoomed.scale).toBe(2);
    const after = toViewport(zoomed, anchor, SIZE);
    expect(after.x).toBeCloseTo(before.x);
    expect(after.y).toBeCloseTo(before.y);
  });

  it("never goes below 1× or above the maximum", () => {
    const centre = { x: SIZE / 2, y: SIZE / 2 };
    expect(zoomAt(fullView(SIZE), 0.5, centre, SIZE)).toEqual(fullView(SIZE));
    expect(zoomAt(fullView(SIZE), 100, centre, SIZE).scale).toBe(MAX_SCALE);
  });

  it("shows the whole image again when it zooms back out to 1×", () => {
    const zoomed = zoomAt(fullView(SIZE), 4, { x: 20, y: 20 }, SIZE);
    expect(zoomAt(zoomed, 1 / 4, { x: 300, y: 50 }, SIZE)).toEqual(fullView(SIZE));
  });
});

describe("panBy", () => {
  it("moves the image with the drag, by a fraction of the viewport", () => {
    const zoomed = zoomAt(fullView(SIZE), 2, { x: SIZE / 2, y: SIZE / 2 }, SIZE);
    const panned = panBy(zoomed, { x: 0.25, y: 0 }, SIZE);
    // A quarter of the viewport at 2× is an eighth of the image, and the
    // centre moves the opposite way to the content.
    expect(panned.x).toBeCloseTo(SIZE / 2 - SIZE / 8);
    expect(panned.y).toBe(SIZE / 2);
  });

  it("stops at the edge of the image", () => {
    const zoomed = zoomAt(fullView(SIZE), 2, { x: SIZE / 2, y: SIZE / 2 }, SIZE);
    const panned = panBy(zoomed, { x: 5, y: -5 }, SIZE);
    expect(toImage(panned, { x: 0, y: 0 }, SIZE).x).toBeCloseTo(0);
    expect(toImage(panned, { x: 1, y: 1 }, SIZE).y).toBeCloseTo(SIZE);
  });

  it("does nothing at 1×, where the whole image is already in view", () => {
    expect(panBy(fullView(SIZE), { x: 0.3, y: 0.3 }, SIZE)).toEqual(fullView(SIZE));
  });
});

describe("toImage", () => {
  it("maps the viewport straight onto the image at 1×", () => {
    expect(toImage(fullView(SIZE), { x: 0.25, y: 0.75 }, SIZE)).toEqual({ x: 96, y: 288 });
  });

  it("maps the viewport onto the visible part of the image when zoomed", () => {
    const zoomed = zoomAt(fullView(SIZE), 2, { x: SIZE / 2, y: SIZE / 2 }, SIZE);
    expect(toImage(zoomed, { x: 0, y: 0 }, SIZE)).toEqual({ x: 96, y: 96 });
    expect(toImage(zoomed, { x: 1, y: 1 }, SIZE)).toEqual({ x: 288, y: 288 });
  });
});

describe("follow", () => {
  it("leaves the view alone while the point is on screen", () => {
    const zoomed = zoomAt(fullView(SIZE), 2, { x: SIZE / 2, y: SIZE / 2 }, SIZE);
    expect(follow(zoomed, { x: 200, y: 200 }, SIZE)).toEqual(zoomed);
  });

  it("pans just far enough to bring an off-screen point back into view", () => {
    const zoomed = zoomAt(fullView(SIZE), 2, { x: SIZE / 2, y: SIZE / 2 }, SIZE);
    const followed = follow(zoomed, { x: 300, y: 200 }, SIZE);
    const seen = toViewport(followed, { x: 300, y: 200 }, SIZE);
    expect(seen.x).toBeGreaterThan(0.9);
    expect(seen.x).toBeLessThanOrEqual(1);
    expect(followed.y).toBe(zoomed.y);
  });
});
