import { describe, it, expect } from "vitest";
import { chalkLayout } from "./chalkLayout";

const LABELS = [
  "Work Portfolio",
  "Gallery Wall",
  "Ketsup",
  "Design System",
  "Feature Flags",
  "Vitals",
];

describe("chalkLayout", () => {
  it("is deterministic, so the server and first client pass agree", () => {
    expect(chalkLayout(LABELS)).toEqual(chalkLayout(LABELS));
  });

  it("writes one word per label, keeping the label intact", () => {
    const words = chalkLayout(LABELS);
    expect(words).toHaveLength(LABELS.length);
    expect(words.map((w) => w.label)).toEqual(LABELS);
  });

  it("keeps every word on screen", () => {
    for (const w of chalkLayout(LABELS)) {
      expect(w.left).toBeGreaterThanOrEqual(0);
      expect(w.left).toBeLessThanOrEqual(100);
      expect(w.top).toBeGreaterThanOrEqual(0);
      expect(w.top).toBeLessThanOrEqual(100);
    }
  });

  it("keeps the middle of the screen clear for the machine", () => {
    // Nothing sits over the reels, whatever column it is in.
    for (const w of chalkLayout(LABELS)) {
      expect(w.top < 34 || w.top > 66).toBe(true);
    }
  });

  it("puts words above and below the machine, not all on one side", () => {
    const words = chalkLayout(LABELS);
    const above = words.filter((w) => w.top < 50).length;
    const below = words.length - above;
    expect(above).toBeGreaterThan(0);
    expect(below).toBeGreaterThan(0);
    expect(Math.abs(above - below)).toBeLessThanOrEqual(1);
  });

  it("staggers the words so some are writing while others fade", () => {
    const delays = chalkLayout(LABELS).map((w) => w.delay);
    expect(new Set(delays).size).toBe(LABELS.length);
    expect(Math.max(...delays) - Math.min(...delays)).toBeGreaterThan(2000);
  });

  it("spreads the words across the width instead of clumping on one side", () => {
    const words = chalkLayout(LABELS);
    const left = words.filter((w) => w.left < 50).length;
    const right = words.length - left;
    // Hashing both axes used to pile them up on one side; spacing by index
    // guarantees both halves are used.
    expect(left).toBeGreaterThan(0);
    expect(right).toBeGreaterThan(0);
    expect(Math.abs(left - right)).toBeLessThanOrEqual(2);
  });

  it("varies size and tilt so nothing sits on a grid", () => {
    const words = chalkLayout(LABELS);
    expect(new Set(words.map((w) => w.size)).size).toBeGreaterThan(1);
    expect(words.some((w) => w.rotate < 0)).toBe(true);
    expect(words.some((w) => w.rotate > 0)).toBe(true);
  });

  it("copes with an empty list", () => {
    expect(chalkLayout([])).toEqual([]);
  });
});
