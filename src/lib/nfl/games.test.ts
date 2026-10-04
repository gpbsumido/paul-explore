import { describe, it, expect } from "vitest";
import { parseGameProgress } from "./games";

/** One game on ESPN's public NFL scoreboard, with the status fields we read. */
function game(opts: {
  away: string;
  home: string;
  state: "pre" | "in" | "post";
  period?: number;
  clock?: number;
}) {
  return {
    id: `${opts.away}-${opts.home}`,
    status: {
      clock: opts.clock ?? 0,
      period: opts.period ?? 0,
      type: { state: opts.state },
    },
    competitions: [
      {
        competitors: [
          { team: { abbreviation: opts.home } },
          { team: { abbreviation: opts.away } },
        ],
      },
    ],
  };
}

describe("parseGameProgress", () => {
  it("gives a game that hasn't kicked off its whole 60 minutes still to play", () => {
    const progress = parseGameProgress({
      events: [game({ away: "IND", home: "WSH", state: "pre" })],
    });
    expect(progress).toEqual({ IND: 1, WSH: 1 });
  });

  it("gives a finished game nothing left to play", () => {
    const progress = parseGameProgress({
      events: [game({ away: "PIT", home: "CLE", state: "post", period: 4 })],
    });
    expect(progress).toEqual({ PIT: 0, CLE: 0 });
  });

  it("reads a live game's share left from the quarter and the clock", () => {
    // Start of the 3rd with 15:00 on the clock: exactly half the game remains.
    const half = parseGameProgress({
      events: [game({ away: "NE", home: "BUF", state: "in", period: 3, clock: 900 })],
    });
    expect(half.NE).toBeCloseTo(0.5);

    // 4th quarter, 7:30 left: one eighth remains.
    const late = parseGameProgress({
      events: [game({ away: "NE", home: "BUF", state: "in", period: 4, clock: 450 })],
    });
    expect(late.BUF).toBeCloseTo(0.125);
  });

  it("treats overtime as effectively over", () => {
    const progress = parseGameProgress({
      events: [game({ away: "NE", home: "BUF", state: "in", period: 5, clock: 400 })],
    });
    expect(progress.NE).toBe(0);
  });

  it("degrades to an empty map on a payload that isn't a scoreboard", () => {
    expect(parseGameProgress({ nope: true })).toEqual({});
  });

  it("gives a postponed game nothing to play, even though its clock never ran", () => {
    // ESPN marks a postponed game "post" with period 0; read naively, an
    // untouched clock is a whole game still to come.
    const progress = parseGameProgress({
      events: [game({ away: "NE", home: "BUF", state: "post", period: 0, clock: 0 })],
    });
    expect(progress).toEqual({ NE: 0, BUF: 0 });
  });

  it("treats a 15-minute playoff overtime as over too", () => {
    const progress = parseGameProgress({
      events: [game({ away: "NE", home: "BUF", state: "in", period: 5, clock: 900 })],
    });
    expect(progress.NE).toBe(0);
  });

  it("skips a malformed event and keeps the rest of the board", () => {
    const progress = parseGameProgress({
      events: [{ status: "garbled" }, game({ away: "IND", home: "WSH", state: "pre" })],
    });
    expect(progress).toEqual({ IND: 1, WSH: 1 });
  });

  it("skips an event with no competitions instead of throwing", () => {
    const bare = { ...game({ away: "NE", home: "BUF", state: "pre" }), competitions: [] };
    expect(parseGameProgress({ events: [bare] })).toEqual({});
  });

  it("degrades to an empty map on a payload that isn't an object at all", () => {
    expect(parseGameProgress(null)).toEqual({});
    expect(parseGameProgress("<html>502</html>")).toEqual({});
  });
});

