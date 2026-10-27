import { describe, expect, it } from "vitest";
import {
  ROUND_MS,
  drawRole,
  formatClock,
  initialState,
  reduce,
  remainingMs,
} from "./game";
import { ROLES } from "./roles.data";

const seeded = (values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length];
};

describe("drawRole", () => {
  it("does not repeat a role until the whole deck has been dealt", () => {
    let seen: string[] = [];
    const dealt = new Set<string>();
    for (let i = 0; i < ROLES.length; i++) {
      const draw = drawRole({ category: "all", seen, random: Math.random });
      expect(dealt.has(draw.role.id)).toBe(false);
      dealt.add(draw.role.id);
      seen = draw.seen;
    }
    expect(dealt.size).toBe(ROLES.length);
  });

  it("reshuffles once the deck is spent instead of running dry", () => {
    const all = ROLES.map((r) => r.id);
    const draw = drawRole({ category: "all", seen: all, random: Math.random });
    expect(draw.seen).toEqual([draw.role.id]);
  });

  it("only deals from the chosen category", () => {
    const draw = drawRole({ category: "threat", seen: [], random: seeded([0.5]) });
    expect(draw.role.category).toBe("threat");
  });
});

describe("a round", () => {
  const random = seeded([0.1, 0.9]);

  it("walks setup, secret, playing, reveal, then back to secret for the next round", () => {
    let s = initialState();
    expect(s.phase).toBe("setup");
    s = reduce(s, { type: "deal", random });
    expect(s.phase).toBe("secret");
    expect(s.role).not.toBeNull();
    s = reduce(s, { type: "start", now: 1000 });
    expect(s.phase).toBe("playing");
    s = reduce(s, { type: "guessed" });
    expect(s.phase).toBe("reveal");
    expect(s.guessed).toBe(1);
    expect(s.lastOutcome).toBe("guessed");
    s = reduce(s, { type: "next", random });
    expect(s.phase).toBe("secret");
    expect(s.round).toBe(2);
  });

  it("lets player A redraw before the clock starts, and never the same role twice in a row", () => {
    let s = reduce(initialState(), { type: "deal", random: seeded([0.3]) });
    const first = s.role;
    s = reduce(s, { type: "redraw", random: seeded([0.3]) });
    expect(s.role?.id).not.toBe(first?.id);
    expect(s.phase).toBe("secret");
  });

  it("counts a give up and a time up as stumped rounds", () => {
    let s = reduce(initialState(), { type: "deal", random });
    s = reduce(s, { type: "start", now: 0 });
    s = reduce(s, { type: "giveUp" });
    expect(s.stumped).toBe(1);
    expect(s.lastOutcome).toBe("stumped");
    s = reduce(s, { type: "next", random });
    s = reduce(s, { type: "start", now: 0 });
    s = reduce(s, { type: "timeUp" });
    expect(s.stumped).toBe(2);
    expect(s.phase).toBe("reveal");
  });

  it("only changes category from the setup or secret screens, never mid-round", () => {
    let s = reduce(initialState(), { type: "deal", random });
    s = reduce(s, { type: "start", now: 0 });
    const after = reduce(s, { type: "setCategory", category: "threat" });
    expect(after.category).toBe("all");
  });
});

describe("the clock", () => {
  it("counts down five minutes from the moment play starts", () => {
    let s = reduce(initialState(), { type: "deal", random: Math.random });
    s = reduce(s, { type: "start", now: 10_000 });
    expect(remainingMs(s, 10_000)).toBe(ROUND_MS);
    expect(remainingMs(s, 70_000)).toBe(ROUND_MS - 60_000);
  });

  it("clamps at zero", () => {
    let s = reduce(initialState(), { type: "deal", random: Math.random });
    s = reduce(s, { type: "start", now: 0 });
    expect(remainingMs(s, ROUND_MS + 5_000)).toBe(0);
  });

  it("freezes while paused and picks up where it left off", () => {
    let s = reduce(initialState(), { type: "deal", random: Math.random });
    s = reduce(s, { type: "start", now: 0 });
    s = reduce(s, { type: "pause", now: 100_000 });
    expect(remainingMs(s, 500_000)).toBe(ROUND_MS - 100_000);
    s = reduce(s, { type: "resume", now: 500_000 });
    expect(remainingMs(s, 530_000)).toBe(ROUND_MS - 130_000);
  });
});

describe("formatClock", () => {
  it("renders m:ss and rounds partial seconds up so 0:00 means time is truly up", () => {
    expect(formatClock(ROUND_MS)).toBe("5:00");
    expect(formatClock(61_000)).toBe("1:01");
    expect(formatClock(59_001)).toBe("1:00");
    expect(formatClock(0)).toBe("0:00");
  });
});
