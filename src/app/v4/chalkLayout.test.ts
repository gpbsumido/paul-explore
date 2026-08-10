import { describe, it, expect } from "vitest";
import { placeChalkWord, pickUnused, isClear, type Rect } from "./chalkLayout";

/** A seeded source, so placement maths is testable without real randomness. */
const seeded = (values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length];
};

/** Roughly the real interface: header, stats line, loupe, spin button. */
const KEEP_OUT: Rect[] = [
  { left: 0, right: 100, top: 0, bottom: 19 },
  { left: 30, right: 70, top: 20, bottom: 24 },
  { left: 2, right: 98, top: 44, bottom: 55 },
  { left: 44, right: 56, top: 78, bottom: 91 },
];

const place = (
  rand = Math.random,
  avoid: { left: number; top: number }[] = [],
) => placeChalkWord(rand, avoid, KEEP_OUT);

describe("isClear", () => {
  it("rejects a spot inside an obstacle", () => {
    expect(isClear({ left: 50, top: 10 }, KEEP_OUT)).toBe(false);
  });

  it("rejects a spot that only just grazes one, thanks to the padding", () => {
    expect(isClear({ left: 50, top: 20 }, KEEP_OUT)).toBe(false);
  });

  it("accepts a spot well clear of everything", () => {
    expect(isClear({ left: 10, top: 33 }, KEEP_OUT)).toBe(true);
  });

  it("accepts anything when nothing is in the way", () => {
    expect(isClear({ left: 50, top: 50 }, [])).toBe(true);
  });
});

describe("placeChalkWord", () => {
  it("never places a word over the interface", () => {
    for (let i = 0; i < 300; i += 1) {
      const p = place();
      if (p) expect(isClear(p, KEEP_OUT)).toBe(true);
    }
  });

  it("keeps words inside the viewport", () => {
    for (let i = 0; i < 100; i += 1) {
      const p = place();
      if (!p) continue;
      expect(p.left).toBeGreaterThanOrEqual(0);
      expect(p.left).toBeLessThanOrEqual(100);
      expect(p.top).toBeGreaterThanOrEqual(0);
      expect(p.top).toBeLessThanOrEqual(100);
    }
  });

  it("finds somewhere on a normal window", () => {
    // Not every draw succeeds, but across a handful it should.
    const found = Array.from({ length: 20 }, () => place()).filter(Boolean);
    expect(found.length).toBeGreaterThan(10);
  });

  it("gives up rather than overlapping when everything is blocked", () => {
    const wall: Rect[] = [{ left: -50, right: 150, top: -50, bottom: 150 }];
    expect(placeChalkWord(Math.random, [], wall)).toBeNull();
  });

  it("steers away from words already on screen", () => {
    const crowd = [
      { left: 10, top: 30 },
      { left: 30, top: 30 },
      { left: 90, top: 65 },
    ];
    let tooClose = 0;
    for (let i = 0; i < 60; i += 1) {
      const p = place(Math.random, crowd);
      if (!p) continue;
      if (
        crowd.some(
          (c) => Math.abs(p.left - c.left) < 8 && Math.abs(p.top - c.top) < 5,
        )
      ) {
        tooClose += 1;
      }
    }
    expect(tooClose).toBeLessThan(12);
  });

  it("varies size and tilt, so nothing sits on a grid", () => {
    const a = placeChalkWord(seeded([0.1, 0.2, 0.3, 0.4, 0.5]), [], []);
    const b = placeChalkWord(seeded([0.9, 0.8, 0.7, 0.6, 0.5]), [], []);
    expect(a!.left).not.toBe(b!.left);
    expect(a!.duration).toBeGreaterThan(0);
  });
});

describe("extent-aware clearance", () => {
  const zone = [{ left: 40, right: 60, top: 40, bottom: 50 }];

  it("rejects a wide word whose centre is clear but whose end is not", () => {
    // The anchor sits outside the zone; the word reaches into it.
    expect(isClear({ left: 30, top: 45 }, zone)).toBe(true);
    expect(isClear({ left: 30, top: 45 }, zone, { halfW: 12, halfH: 2 })).toBe(
      false,
    );
  });

  it("accepts a narrow word in the same spot", () => {
    expect(isClear({ left: 20, top: 45 }, zone, { halfW: 3, halfH: 2 })).toBe(
      true,
    );
  });
});

describe("pickUnused", () => {
  const pool = [{ id: "a" }, { id: "b" }, { id: "c" }];

  it("never repeats a name that is already on screen", () => {
    expect(pickUnused(pool, ["a", "b"], () => 0)?.id).toBe("c");
  });

  it("falls back to the whole pool when everything is showing", () => {
    expect(pickUnused(pool, ["a", "b", "c"], () => 0)?.id).toBe("a");
  });

  it("copes with an empty pool", () => {
    expect(pickUnused([], [], () => 0)).toBeUndefined();
  });
});
