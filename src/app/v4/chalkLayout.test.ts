import { describe, it, expect } from "vitest";
import {
  placeChalkWord,
  pickUnused,
  isClear,
  lifetimeFor,
  CHALK_SIZE_REM,
  type Rect,
} from "./chalkLayout";

/** A seeded source, so placement maths is testable without real randomness. */
const seeded = (values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length];
};

/** A small repeatable PRNG (mulberry32), so every draw is the same on every run. */
const seededRandom = (seed: number) => {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** Roughly the real interface: header, stats line, loupe, spin button. */
const KEEP_OUT: Rect[] = [
  { left: 0, right: 100, top: 0, bottom: 19 },
  { left: 30, right: 70, top: 20, bottom: 24 },
  { left: 2, right: 98, top: 44, bottom: 55 },
  { left: 44, right: 56, top: 78, bottom: 91 },
];

const place = (
  rand: () => number,
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
  /** Each seed is one repeatable "random" draw, so no run depends on luck. */
  const SEEDS = Array.from({ length: 200 }, (_, i) => i + 1);

  it("never places a word over the interface", () => {
    const placed = SEEDS.map((seed) => place(seededRandom(seed))).filter(
      (p) => p !== null,
    );
    // Guard against passing vacuously if every draw were rejected.
    expect(placed.length).toBeGreaterThan(SEEDS.length / 2);
    for (const p of placed) expect(isClear(p, KEEP_OUT)).toBe(true);
  });

  it("keeps words inside the viewport", () => {
    const placed = SEEDS.map((seed) => place(seededRandom(seed))).filter(
      (p) => p !== null,
    );
    expect(placed.length).toBeGreaterThan(SEEDS.length / 2);
    for (const p of placed) {
      expect(p.left).toBeGreaterThanOrEqual(0);
      expect(p.left).toBeLessThanOrEqual(100);
      expect(p.top).toBeGreaterThanOrEqual(0);
      expect(p.top).toBeLessThanOrEqual(100);
    }
  });

  it("finds somewhere on a normal window, every time", () => {
    for (const seed of SEEDS) {
      expect(place(seededRandom(seed))).not.toBeNull();
    }
  });

  it("gives up rather than overlapping when everything is blocked", () => {
    const wall: Rect[] = [{ left: -50, right: 150, top: -50, bottom: 150 }];
    expect(placeChalkWord(seededRandom(1), [], wall)).toBeNull();
  });

  it("steers away from words already on screen", () => {
    const crowd = [
      { left: 10, top: 30 },
      { left: 30, top: 30 },
      { left: 90, top: 65 },
    ];
    // Same distance maths the placer uses: vertical counts double, since words
    // are wide and short. Anything under 22 "units" apart reads as touching.
    const gapTo = (p: { left: number; top: number }) =>
      Math.min(
        ...crowd.map((c) =>
          Math.hypot(p.left - c.left, (p.top - c.top) * 2.2),
        ),
      );
    const gaps = SEEDS.map((seed) => place(seededRandom(seed), crowd)).map(
      (p) => (p ? gapTo(p) : NaN),
    );
    expect(gaps.every((gap) => gap >= 22)).toBe(true);
  });

  it("varies position and tilt with the draw, at one fixed size", () => {
    const a = placeChalkWord(seeded([0.1, 0.2, 0.3, 0.4, 0.5]), [], []);
    const b = placeChalkWord(seeded([0.9, 0.8, 0.7, 0.6, 0.5]), [], []);
    expect(a!.left).not.toBe(b!.left);
    expect(a!.rotate).not.toBe(b!.rotate);
    expect(a!.size).toBe(CHALK_SIZE_REM);
    expect(b!.size).toBe(CHALK_SIZE_REM);
    // Tilt is a slight lean, not a spin.
    expect(Math.abs(a!.rotate)).toBeLessThanOrEqual(7);
    expect(Math.abs(b!.rotate)).toBeLessThanOrEqual(7);
  });

  it("keeps a long word clear of the interface, not just its centre", () => {
    const extent = { halfW: 14, halfH: 2 };
    const placed = SEEDS.map((seed) =>
      placeChalkWord(seededRandom(seed), [], KEEP_OUT, 14, extent),
    ).filter((p) => p !== null);
    expect(placed.length).toBeGreaterThan(SEEDS.length / 2);
    for (const p of placed) expect(isClear(p, KEEP_OUT, extent)).toBe(true);
  });
});

describe("lifetimeFor", () => {
  it("gives a long word more time to be written than a short one", () => {
    const craft = lifetimeFor("Craft".length, () => 0);
    const workPortfolio = lifetimeFor("Work Portfolio".length, () => 0);
    expect(workPortfolio).toBeGreaterThan(craft);
    // 460ms a character on top of a 2.6s base keeps the pen ahead of the fade.
    expect(craft).toBe(2600 + 5 * 460);
  });

  it("adds up to 1.2s of jitter so words do not all vanish together", () => {
    expect(lifetimeFor(5, () => 1) - lifetimeFor(5, () => 0)).toBe(1200);
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

  it("rejects a tall word whose centre is clear above the zone but whose bottom is not", () => {
    expect(isClear({ left: 50, top: 33 }, zone)).toBe(true);
    expect(isClear({ left: 50, top: 33 }, zone, { halfW: 2, halfH: 8 })).toBe(
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

  it("picks across the free names using the random draw", () => {
    expect(pickUnused(pool, ["a"], () => 0)?.id).toBe("b");
    expect(pickUnused(pool, ["a"], () => 0.99)?.id).toBe("c");
  });

  it("falls back to the whole pool when everything is showing", () => {
    expect(pickUnused(pool, ["a", "b", "c"], () => 0)?.id).toBe("a");
  });

  it("copes with an empty pool", () => {
    expect(pickUnused([], [], () => 0)).toBeUndefined();
  });
});
