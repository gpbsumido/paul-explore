import { describe, it, expect } from "vitest";
import { arrangeAesthetic } from "./arrange";

const frame = (id: string, width: number, height: number) => ({ id, width, height });

const input = (frames: ReturnType<typeof frame>[]) => ({
  wallWidth: 100,
  wallHeight: 80,
  gap: 2,
  frames,
});

type Rect = { x: number; y: number; width: number; height: number };

const bounds = (placements: Rect[]) => ({
  left: Math.min(...placements.map((p) => p.x)),
  right: Math.max(...placements.map((p) => p.x + p.width)),
  top: Math.min(...placements.map((p) => p.y)),
  bottom: Math.max(...placements.map((p) => p.y + p.height)),
});

const mixed = () => [
  frame("a", 20, 30),
  frame("b", 10, 14),
  frame("c", 16, 16),
  frame("d", 12, 22),
  frame("e", 18, 12),
  frame("f", 14, 18),
];

describe("arrangeAesthetic", () => {
  it("places nothing for an empty wall", () => {
    const result = arrangeAesthetic(input([]));
    expect(result.placements).toEqual([]);
    expect(result.overflows).toBe(false);
  });

  it("centres the whole cluster on the wall", () => {
    const b = bounds(arrangeAesthetic(input(mixed())).placements);
    expect(b.left).toBeCloseTo(100 - b.right, 5);
    expect(b.top).toBeCloseTo(80 - b.bottom, 5);
  });

  it("staggers the frames instead of lining them up on one baseline", () => {
    const ps = arrangeAesthetic(input(mixed())).placements;
    // A salon wall reads as a mosaic: tops vary, and so do the vertical centres.
    expect(new Set(ps.map((p) => p.y)).size).toBeGreaterThan(2);
    expect(new Set(ps.map((p) => p.y + p.height / 2)).size).toBeGreaterThan(2);
  });

  it("interlocks the frames tightly rather than leaving shelf gaps", () => {
    const ps = arrangeAesthetic(input(mixed())).placements;
    const b = bounds(ps);
    const clusterArea = (b.right - b.left) * (b.bottom - b.top);
    const framesArea = ps.reduce((sum, p) => sum + p.width * p.height, 0);
    // The frames should account for most of the cluster they sit in.
    expect(framesArea / clusterArea).toBeGreaterThan(0.6);
  });

  it("never overlaps frames", () => {
    const ps = arrangeAesthetic(input(mixed())).placements;
    for (let i = 0; i < ps.length; i++) {
      for (let j = i + 1; j < ps.length; j++) {
        const a = ps[i];
        const b = ps[j];
        const apart =
          a.x + a.width <= b.x ||
          b.x + b.width <= a.x ||
          a.y + a.height <= b.y ||
          b.y + b.height <= a.y;
        expect(apart).toBe(true);
      }
    }
  });

  it("keeps the cluster within the wall's width", () => {
    const b = bounds(arrangeAesthetic(input(mixed())).placements);
    expect(b.left).toBeGreaterThanOrEqual(0);
    expect(b.right).toBeLessThanOrEqual(100);
  });

  it("reports an overflow when the frames cannot fit the wall", () => {
    const huge = Array.from({ length: 12 }, (_, i) => frame(`f${i}`, 40, 40));
    expect(arrangeAesthetic(input(huge)).overflows).toBe(true);
  });

  it("keeps every frame, placing each exactly once", () => {
    const ids = arrangeAesthetic(input(mixed())).placements.map((p) => p.id);
    expect(ids.slice().sort()).toEqual(["a", "b", "c", "d", "e", "f"]);
  });

  it("is deterministic, so the same wall arranges the same way twice", () => {
    const once = arrangeAesthetic(input(mixed())).placements;
    const twice = arrangeAesthetic(input(mixed())).placements;
    expect(once).toEqual(twice);
  });
});

describe("arrangeAesthetic stagger", () => {
  const many = [
    frame("a", 20, 30),
    frame("b", 10, 14),
    frame("c", 16, 16),
    frame("d", 12, 22),
    frame("e", 18, 12),
    frame("f", 14, 18),
    frame("g", 11, 15),
    frame("h", 22, 17),
  ];

  it("does not line frames up into shared columns or rows", () => {
    const ps = arrangeAesthetic(input(many)).placements;
    // Every frame sits at its own x and y: no grid, no shared edges.
    expect(new Set(ps.map((p) => p.x.toFixed(4))).size).toBe(ps.length);
    expect(new Set(ps.map((p) => p.y.toFixed(4))).size).toBe(ps.length);
  });

  it("still never overlaps once staggered", () => {
    const ps = arrangeAesthetic(input(many)).placements;
    for (let i = 0; i < ps.length; i++) {
      for (let j = i + 1; j < ps.length; j++) {
        const a = ps[i];
        const b = ps[j];
        const apart =
          a.x + a.width <= b.x ||
          b.x + b.width <= a.x ||
          a.y + a.height <= b.y ||
          b.y + b.height <= a.y;
        expect(apart).toBe(true);
      }
    }
  });
});
