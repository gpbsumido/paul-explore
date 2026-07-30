import { describe, it, expect } from "vitest";
import { confettiPieces } from "./winPieces";

const COLORS = ["#f43f5e", "#fbbf24", "#34d399", "#38bdf8"];

describe("confettiPieces", () => {
  it("is deterministic, so the server and first client pass agree", () => {
    // Math.random here would hydrate differently and warn in the console.
    expect(confettiPieces(20, COLORS)).toEqual(confettiPieces(20, COLORS));
  });

  it("varies drift per piece, so one burst is not a block of identical paper", () => {
    // The fall *style* is per win; the variation inside a burst comes from here.
    const drifts = new Set(confettiPieces(60, COLORS).map((c) => Math.round(c.drift)));
    expect(drifts.size).toBeGreaterThan(20);
  });

  it("gives every piece its own timing, so it falls as a shower not a wall", () => {
    const pieces = confettiPieces(40, COLORS);
    expect(new Set(pieces.map((p) => p.delay)).size).toBeGreaterThan(20);
    expect(new Set(pieces.map((p) => p.duration)).size).toBeGreaterThan(20);
  });

  it("makes foil rectangles, taller than they are wide", () => {
    for (const p of confettiPieces(30, COLORS)) {
      expect(p.height).toBeGreaterThan(p.width);
      expect(p.width).toBeGreaterThan(0);
    }
  });

  it("keeps pieces on screen and drifting both ways", () => {
    const pieces = confettiPieces(60, COLORS);
    expect(pieces.every((p) => p.left >= 0 && p.left <= 100)).toBe(true);
    expect(pieces.some((p) => p.drift < 0)).toBe(true);
    expect(pieces.some((p) => p.drift > 0)).toBe(true);
  });

  it("only uses colours from the palette it was given", () => {
    const used = new Set(confettiPieces(40, COLORS).map((p) => p.color));
    for (const c of used) expect(COLORS).toContain(c);
  });
});
