import { describe, it, expect } from "vitest";
import type { PlayerStats } from "@/types/nba";
import { LEAGUE_AVERAGES, normalizeStats } from "./fantasyHelpers";

const statLine = (over: Partial<PlayerStats> = {}): PlayerStats => ({
  pts: 0,
  reb: 0,
  ast: 0,
  stl: 0,
  blk: 0,
  games_played: 60,
  min: "30:00",
  fgm: 0,
  fga: 0,
  fg_pct: 0,
  ft_pct: 0,
  fg3_pct: 0,
  turnover: 0,
  ...over,
});

describe("normalizeStats", () => {
  it("scores a league-average player at 50 in every category", () => {
    const average = statLine(LEAGUE_AVERAGES);
    expect(normalizeStats(average)).toEqual({ pts: 50, reb: 50, ast: 50, stl: 50, blk: 50, fg_pct: 50 });
  });

  it("scores double the league average as 100 and a zero as 0", () => {
    const doubled = statLine({ pts: LEAGUE_AVERAGES.pts * 2 });
    expect(normalizeStats(doubled).pts).toBe(100);
    expect(normalizeStats(statLine()).pts).toBe(0);
  });

  it("caps an outlier at 100 so one monster stat doesn't blow out the radar", () => {
    expect(normalizeStats(statLine({ pts: 60, blk: 9 }))).toMatchObject({ pts: 100, blk: 100 });
  });

  it("rounds to a whole number", () => {
    // 21 against a 14.0 average is 75 exactly; 7.5 against 5.4 is 69.44...
    const stats = normalizeStats(statLine({ pts: 21, reb: 7.5 }));
    expect(stats.pts).toBe(75);
    expect(stats.reb).toBe(69);
  });

  it("scales each category against its own average", () => {
    const stats = normalizeStats(statLine({ pts: 14, reb: 5.4, ast: 6.4, stl: 0.8, blk: 0.25, fg_pct: 0.92 }));
    expect(stats).toEqual({ pts: 50, reb: 50, ast: 100, stl: 50, blk: 25, fg_pct: 100 });
  });

  it("uses the averages it is given, such as a position's, in place of the league's", () => {
    const centres = { ...LEAGUE_AVERAGES, reb: 10 };
    expect(normalizeStats(statLine({ reb: 10 }), centres).reb).toBe(50);
    expect(normalizeStats(statLine({ reb: 10 })).reb).toBe(93);
  });

  it("falls back to an average of 1 for a category the averages don't list", () => {
    // 0.5 against a fallback of 1 is a quarter of the way to double.
    expect(normalizeStats(statLine({ pts: 0.5 }), {}).pts).toBe(25);
  });
});
