import { describe, it, expect } from "vitest";
import { performancesFromWeek, latestScoringPeriod } from "../espn-nfl";

/** A roster entry with a projection, the actual week line, and a season total. */
const entry = (id: number, name: string, week: number, actual: number | null) => ({
  playerPoolEntry: {
    player: {
      id,
      fullName: name,
      proTeamId: 21,
      stats: [
        { scoringPeriodId: week, statSourceId: 1, statSplitTypeId: 1, appliedTotal: 99 },
        { scoringPeriodId: 0, statSourceId: 0, statSplitTypeId: 0, appliedTotal: 200 },
        ...(actual === null
          ? []
          : [{ scoringPeriodId: week, statSourceId: 0, statSplitTypeId: 1, appliedTotal: actual }]),
      ],
    },
  },
});

const league = (latest: number, ...teams: unknown[][]) => ({
  status: { latestScoringPeriod: latest },
  teams: teams.map((entries) => ({ roster: { entries } })),
});

describe("performancesFromWeek", () => {
  it("reads each player's actual fantasy points for the week", () => {
    const perfs = performancesFromWeek(
      league(7, [entry(1, "RB One", 5, 28.4)], [entry(2, "WR Two", 5, 12.1)]),
      { season: "2025", week: 5 },
    );
    expect(perfs).toHaveLength(2);
    const rb = perfs.find((p) => p.playerId === 1);
    expect(rb?.points).toBe(28.4);
    expect(rb?.periodId).toBe("2025-wk5");
    expect(rb?.sport).toBe("nfl");
  });

  it("ignores the projection and the season total", () => {
    const perfs = performancesFromWeek(league(7, [entry(1, "RB One", 5, 28.4)]), {
      season: "2025",
      week: 5,
    });
    expect(perfs[0].points).toBe(28.4);
  });

  it("skips players with no actual line for that week (bye/inactive)", () => {
    const perfs = performancesFromWeek(
      league(7, [entry(1, "RB One", 5, 28.4), entry(2, "Bye Guy", 5, null)]),
      { season: "2025", week: 5 },
    );
    expect(perfs.map((p) => p.playerId)).toEqual([1]);
  });

  it("returns [] for a payload that isn't a league", () => {
    expect(performancesFromWeek({ nope: true }, { season: "2025", week: 5 })).toEqual([]);
  });
});

describe("latestScoringPeriod", () => {
  it("reads the latest week from league status", () => {
    expect(latestScoringPeriod(league(7, []))).toBe(7);
  });
  it("returns null when absent", () => {
    expect(latestScoringPeriod({ teams: [] })).toBeNull();
  });
});
