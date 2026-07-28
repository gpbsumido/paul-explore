import { describe, it, expect } from "vitest";
import { placeChalkWord, pickUnused } from "./chalkLayout";

/** A seeded source, so placement maths is testable without real randomness. */
const seeded = (values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length];
};

describe("placeChalkWord", () => {
  it("keeps the middle of the screen clear for the reels", () => {
    // Whatever the draw, a word never lands over the machine.
    for (let i = 0; i <= 10; i += 1) {
      const rand = seeded([i / 10, i / 10, 0.5, 0.5, 0.5]);
      const { top } = placeChalkWord(rand);
      expect(top < 34 || top > 66).toBe(true);
    }
  });

  it("uses both the upper and lower band", () => {
    expect(placeChalkWord(seeded([0.1, 0.5, 0.5, 0.5, 0.5])).top).toBeLessThan(34);
    expect(placeChalkWord(seeded([0.9, 0.5, 0.5, 0.5, 0.5])).top).toBeGreaterThan(66);
  });

  it("keeps words on screen horizontally", () => {
    for (const v of [0, 0.5, 1]) {
      const { left } = placeChalkWord(seeded([0.2, v, 0.5, 0.5, 0.5]));
      expect(left).toBeGreaterThanOrEqual(0);
      expect(left).toBeLessThanOrEqual(100);
    }
  });

  it("varies position, so the same name never writes in the same spot twice", () => {
    const a = placeChalkWord(seeded([0.2, 0.1, 0.3, 0.4, 0.5]));
    const b = placeChalkWord(seeded([0.2, 0.8, 0.3, 0.4, 0.5]));
    expect(a.left).not.toBe(b.left);
  });

  it("tilts either way and gives every word a finite lifetime", () => {
    const left = placeChalkWord(seeded([0.2, 0.5, 0.5, 0.1, 0.5]));
    const right = placeChalkWord(seeded([0.2, 0.5, 0.5, 0.9, 0.5]));
    expect(left.rotate).toBeLessThan(0);
    expect(right.rotate).toBeGreaterThan(0);
    expect(left.duration).toBeGreaterThan(0);
  });
});

describe("pickUnused", () => {
  const pool = [{ id: "a" }, { id: "b" }, { id: "c" }];

  it("never repeats a name that is already on screen", () => {
    const picked = pickUnused(pool, ["a", "b"], () => 0);
    expect(picked?.id).toBe("c");
  });

  it("falls back to the whole pool when everything is showing", () => {
    expect(pickUnused(pool, ["a", "b", "c"], () => 0)?.id).toBe("a");
  });

  it("copes with an empty pool", () => {
    expect(pickUnused([], [], () => 0)).toBeUndefined();
  });
});
