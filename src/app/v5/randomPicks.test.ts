import { describe, it, expect } from "vitest";
import { THOUGHTS } from "@/app/_shared/featureData.data";
import { HERO_TAGLINES, pickTaglineIndex } from "./taglines";
import { WRITING_POOL, WRITING_SHOWN, pickWriting } from "./featured";

/**
 * The landing randomizes two things per visit: which tagline opens the hero and
 * which write-ups make the shortlist. Both draws happen on the server, once per
 * request, with the randomness injected so every branch is testable. The pools
 * are curated and the draw only ever reorders or trims them, which is what
 * keeps "randomized" from meaning "sometimes the weak ones".
 */
describe("hero taglines", () => {
  it("keeps enough taglines that a return visit can read differently", () => {
    expect(HERO_TAGLINES.length).toBeGreaterThanOrEqual(4);
  });

  it("keeps every tagline a single sentence-or-two pitch, not a paragraph", () => {
    for (const line of HERO_TAGLINES) {
      expect(line.length).toBeGreaterThan(30);
      expect(line.length).toBeLessThan(180);
    }
  });

  it("maps any random draw to a valid index", () => {
    for (const roll of [0, 0.1, 0.5, 0.9999]) {
      const index = pickTaglineIndex(() => roll);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(HERO_TAGLINES.length);
    }
  });

  it("is deterministic for a fixed draw", () => {
    expect(pickTaglineIndex(() => 0.42)).toBe(pickTaglineIndex(() => 0.42));
  });
});

describe("the writing shortlist", () => {
  it("draws from a pool that is bigger than what is shown", () => {
    expect(WRITING_POOL.length).toBeGreaterThan(WRITING_SHOWN);
    expect(WRITING_SHOWN).toBeGreaterThanOrEqual(4);
  });

  it("only lists write-ups that exist in the registry", () => {
    for (const pick of WRITING_POOL) {
      expect(
        THOUGHTS.some((t) => t.href === pick.href),
        `${pick.href} is not a registered write-up`,
      ).toBe(true);
    }
  });

  it("returns the shown count with no duplicates, all from the pool", () => {
    let calls = 0;
    const random = () => {
      calls += 1;
      return (calls % 7) / 7;
    };
    const picks = pickWriting(random);
    expect(picks).toHaveLength(WRITING_SHOWN);
    expect(new Set(picks).size).toBe(picks.length);
    for (const href of picks) {
      expect(WRITING_POOL.some((p) => p.href === href)).toBe(true);
    }
  });

  it("is deterministic for a fixed sequence of draws", () => {
    const seq = [0.9, 0.1, 0.7, 0.3, 0.5, 0.2, 0.8, 0.4];
    const make = () => {
      let i = 0;
      return () => seq[i++ % seq.length];
    };
    expect(pickWriting(make())).toEqual(pickWriting(make()));
  });

  it("different draws produce different orderings, or the shuffle is dead", () => {
    const constant = (value: number) => () => value;
    const a = pickWriting(constant(0.01));
    const b = pickWriting(constant(0.99));
    expect(a).not.toEqual(b);
  });
});
