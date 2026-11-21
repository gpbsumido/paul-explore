import { describe, expect, it } from "vitest";
import {
  ROUND_MS,
  clockAnnouncement,
  drawRole,
  formatClock,
  initialState,
  publicView,
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
    let seen: readonly string[] = [];
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

describe("drawRole after a category runs dry", () => {
  it("forgets only that category's roles, not the ones dealt from other categories", () => {
    const threat = ROLES.filter((r) => r.category === "threat").map((r) => r.id);
    const other = ROLES.find((r) => r.category !== "threat")!;
    const draw = drawRole({
      category: "threat",
      seen: [other.id, ...threat],
      random: () => 0,
    });
    expect(draw.seen).toEqual([other.id, draw.role.id]);
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

  it("ignores moves that make no sense in the current phase", () => {
    const random = seeded([0.1]);
    const setup = initialState();
    expect(reduce(setup, { type: "start", now: 0 })).toBe(setup);
    expect(reduce(setup, { type: "redraw", random })).toBe(setup);
    expect(reduce(setup, { type: "guessed" })).toBe(setup);
    expect(reduce(setup, { type: "next", random })).toBe(setup);

    const secret = reduce(setup, { type: "deal", random });
    expect(reduce(secret, { type: "deal", random })).toBe(secret);
    expect(reduce(secret, { type: "giveUp" })).toBe(secret);

    const playing = reduce(secret, { type: "start", now: 0 });
    expect(reduce(playing, { type: "next", random })).toBe(playing);
    expect(reduce(playing, { type: "resume", now: 5 })).toBe(playing);
    expect(reduce(playing, { type: "redraw", random })).toBe(playing);
  });

  it("scores a round once, however late a stray timeUp or guess arrives", () => {
    const random = seeded([0.1]);
    let s = reduce(initialState(), { type: "deal", random });
    s = reduce(s, { type: "start", now: 0 });
    s = reduce(s, { type: "guessed" });
    s = reduce(s, { type: "timeUp" });
    s = reduce(s, { type: "guessed" });
    expect(s).toMatchObject({ guessed: 1, stumped: 0, lastOutcome: "guessed" });
  });

  it("lets the category change on the secret screen too", () => {
    const s = reduce(initialState(), { type: "deal", random: seeded([0.1]) });
    expect(reduce(s, { type: "setCategory", category: "threat" }).category).toBe("threat");
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

  it("reads a full round on the clock before play starts", () => {
    const s = reduce(initialState(), { type: "deal", random: Math.random });
    expect(remainingMs(s, 123_456)).toBe(ROUND_MS);
  });

  it("pausing twice keeps the time left from the first pause", () => {
    let s = reduce(initialState(), { type: "deal", random: Math.random });
    s = reduce(s, { type: "start", now: 0 });
    s = reduce(s, { type: "pause", now: 100_000 });
    s = reduce(s, { type: "pause", now: 200_000 });
    expect(remainingMs(s, 300_000)).toBe(ROUND_MS - 100_000);
  });

  it("pausing after time has run out leaves nothing, never a negative", () => {
    let s = reduce(initialState(), { type: "deal", random: Math.random });
    s = reduce(s, { type: "start", now: 0 });
    s = reduce(s, { type: "pause", now: ROUND_MS + 9_000 });
    expect(remainingMs(s, ROUND_MS + 20_000)).toBe(0);
  });

  it("resuming a clock that is already running changes nothing", () => {
    let s = reduce(initialState(), { type: "deal", random: Math.random });
    s = reduce(s, { type: "start", now: 0 });
    expect(reduce(s, { type: "resume", now: 50_000 })).toBe(s);
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

describe("clockAnnouncement", () => {
  it("is silent until the last minute, and says nothing outside play", () => {
    expect(clockAnnouncement("playing", ROUND_MS)).toBe("");
    expect(clockAnnouncement("playing", 61_000)).toBe("");
    expect(clockAnnouncement("setup", 5_000)).toBe("");
    expect(clockAnnouncement("reveal", 5_000)).toBe("");
  });

  it("calls one minute at 60 seconds and ten seconds at 10", () => {
    expect(clockAnnouncement("playing", 60_000)).toBe("One minute left");
    expect(clockAnnouncement("playing", 11_000)).toBe("One minute left");
    expect(clockAnnouncement("playing", 10_000)).toBe("Ten seconds left");
    expect(clockAnnouncement("playing", 0)).toBe("Ten seconds left");
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

describe("publicView, what player B's device is sent", () => {
  const playThrough = () => {
    const secret = reduce(initialState(), { type: "deal", random: () => 0 });
    const playing = reduce(secret, { type: "start", now: 0 });
    const reveal = reduce(playing, { type: "guessed" });
    return { secret, playing, reveal };
  };

  it("never carries the role, or anything that names it, before the reveal", () => {
    const { secret, playing } = playThrough();
    for (const state of [initialState(), secret, playing]) {
      const sent = JSON.stringify(publicView(state, 0));
      expect(sent).not.toContain(ROLES[0].text);
      expect(sent).not.toContain(ROLES[0].id);
    }
  });

  it("hands over the role text once the round is over", () => {
    expect(publicView(playThrough().reveal, 0)).toMatchObject({
      phase: "reveal",
      role: ROLES[0].text,
      guessed: 1,
      lastOutcome: "guessed",
    });
  });

  it("sends time left rather than a deadline, so the two clocks can disagree", () => {
    const { playing } = playThrough();
    expect(publicView(playing, 60_000)).toMatchObject({
      phase: "playing",
      remainingMs: ROUND_MS - 60_000,
      paused: false,
    });
    const paused = reduce(playing, { type: "pause", now: 30_000 });
    expect(publicView(paused, 999_000)).toMatchObject({
      remainingMs: ROUND_MS - 30_000,
      paused: true,
    });
  });
});
