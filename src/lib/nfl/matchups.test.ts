import { describe, it, expect } from "vitest";
import { applyGameProgress, parseNflScoreboard } from "./matchups";

/**
 * A roster entry shaped like ESPN's: a starter or bench player carrying an
 * actual (statSourceId 0) and a projected (statSourceId 1) line for the week.
 */
function entry(opts: {
  id: number;
  name: string;
  slot: number;
  position: number;
  actual: number;
  projected: number;
  week: number;
}) {
  return {
    lineupSlotId: opts.slot,
    playerId: opts.id,
    playerPoolEntry: {
      player: {
        id: opts.id,
        fullName: opts.name,
        proTeamId: 4,
        defaultPositionId: opts.position,
        stats: [
          {
            scoringPeriodId: opts.week,
            statSourceId: 1,
            statSplitTypeId: 1,
            appliedTotal: opts.projected,
          },
          {
            scoringPeriodId: opts.week,
            statSourceId: 0,
            statSplitTypeId: 1,
            appliedTotal: opts.actual,
          },
        ],
      },
    },
  };
}

function payload(week: number, currentWeek = week) {
  return {
    seasonId: 2026,
    status: { currentMatchupPeriod: currentWeek, latestScoringPeriod: currentWeek },
    settings: { scheduleSettings: { matchupPeriodCount: 13 } },
    members: [
      { id: "{OWNER-A}", firstName: "Paul", lastName: "S", displayName: "paul" },
      { id: "{OWNER-B}", firstName: "", lastName: "", displayName: "george" },
    ],
    teams: [
      { id: 1, name: "Paul's Perfect Team", abbrev: "PPT", owners: ["{OWNER-A}"] },
      { id: 2, name: "George's Great Team", abbrev: "GGT", owners: ["{OWNER-B}"] },
    ],
    schedule: [
      {
        id: 10,
        matchupPeriodId: week,
        winner: "UNDECIDED",
        away: {
          teamId: 1,
          totalPoints: 24.5,
          rosterForCurrentScoringPeriod: {
            entries: [
              entry({ id: 100, name: "Josh Allen", slot: 0, position: 1, actual: 24.5, projected: 21, week }),
              entry({ id: 101, name: "Bench WR", slot: 20, position: 3, actual: 8, projected: 10, week }),
            ],
          },
        },
        home: {
          teamId: 2,
          totalPoints: 30,
          rosterForCurrentScoringPeriod: {
            entries: [
              entry({ id: 200, name: "Bijan Robinson", slot: 2, position: 2, actual: 12, projected: 15, week }),
              entry({ id: 201, name: "CeeDee Lamb", slot: 4, position: 3, actual: 18, projected: 14, week }),
            ],
          },
        },
      },
      {
        id: 11,
        matchupPeriodId: week + 1,
        winner: "UNDECIDED",
        away: { teamId: 1, totalPoints: 0 },
        home: { teamId: 2, totalPoints: 0 },
      },
    ],
  };
}

describe("parseNflScoreboard", () => {
  it("returns only the requested week's matchups with team totals", () => {
    const board = parseNflScoreboard(payload(3), { season: 2026, week: 3 });
    expect(board.matchups).toHaveLength(1);
    const m = board.matchups[0];
    expect(m.away.totalPoints).toBe(24.5);
    expect(m.home.totalPoints).toBe(30);
    expect(m.away.name).toBe("Paul's Perfect Team");
    expect(m.home.abbrev).toBe("GGT");
  });

  it("reads each player's actual and projected points for the week", () => {
    const board = parseNflScoreboard(payload(3), { season: 2026, week: 3 });
    const allen = board.matchups[0].away.starters.find((p) => p.playerId === 100);
    expect(allen?.actual).toBe(24.5);
    expect(allen?.projected).toBe(21);
    expect(allen?.positionId).toBe(1);
  });

  it("splits starters from bench by lineup slot", () => {
    const board = parseNflScoreboard(payload(3), { season: 2026, week: 3 });
    const away = board.matchups[0].away;
    expect(away.starters.map((p) => p.playerId)).toEqual([100]);
    expect(away.bench.map((p) => p.playerId)).toEqual([101]);
  });

  it("resolves owner display names", () => {
    const board = parseNflScoreboard(payload(3), { season: 2026, week: 3 });
    expect(board.matchups[0].away.ownerName).toBe("Paul S");
    expect(board.matchups[0].home.ownerName).toBe("george");
  });

  it("derives the current and regular-season week bounds from the payload", () => {
    const board = parseNflScoreboard(payload(3), { season: 2026, week: 3 });
    expect(board.currentWeek).toBe(3);
    expect(board.regularSeasonWeeks).toBe(13);
  });

  it("falls back to the payload's current week when none is requested", () => {
    const board = parseNflScoreboard(payload(3), { season: 2026, week: null });
    expect(board.currentWeek).toBe(3);
    expect(board.matchups).toHaveLength(1);
    expect(board.matchups[0].home.totalPoints).toBe(30);
  });

  it("reads the week's own line, not the season total that sits beside it", () => {
    // ESPN can carry a season projection (period 0) next to the weekly one.
    // Picking it up would show a 300-point "projection" for one game.
    const base = payload(3);
    const away = base.schedule[0].away;
    const allen = away.rosterForCurrentScoringPeriod?.entries[0];
    const withSeason = {
      ...base,
      schedule: [
        {
          ...base.schedule[0],
          away: {
            ...away,
            rosterForCurrentScoringPeriod: {
              entries: [
                {
                  ...allen,
                  playerPoolEntry: {
                    player: {
                      ...allen?.playerPoolEntry.player,
                      stats: [
                        { scoringPeriodId: 0, statSourceId: 1, statSplitTypeId: 0, appliedTotal: 300 },
                        { scoringPeriodId: 0, statSourceId: 0, statSplitTypeId: 0, appliedTotal: 120 },
                        ...(allen?.playerPoolEntry.player.stats ?? []),
                      ],
                    },
                  },
                },
              ],
            },
          },
        },
      ],
    };
    const line = parseNflScoreboard(withSeason, { season: 2026, week: 3 }).matchups[0].away.starters[0];
    expect(line.projected).toBe(21);
    expect(line.actual).toBe(24.5);
  });

  it("scores a player with no stats, or none for this week, as zero", () => {
    const base = payload(3);
    const statless = (stats: unknown[] | undefined) => ({
      lineupSlotId: 0,
      playerPoolEntry: { player: { id: 300, fullName: "No Stats", proTeamId: 4, defaultPositionId: 1, stats } },
    });
    const board = parseNflScoreboard(
      {
        ...base,
        schedule: [
          {
            ...base.schedule[0],
            away: {
              teamId: 1,
              totalPoints: 0,
              rosterForCurrentScoringPeriod: {
                entries: [statless(undefined), { ...statless([{ scoringPeriodId: 2, statSourceId: 1, appliedTotal: 9 }]), lineupSlotId: 2 }],
              },
            },
          },
        ],
      },
      { season: 2026, week: 3 },
    );
    expect(board.matchups[0].away.starters.map((p) => [p.actual, p.projected])).toEqual([
      [0, 0],
      [0, 0],
    ]);
  });

  it("names a side whose team isn't in the payload by its id, with no owner", () => {
    const base = payload(3);
    const board = parseNflScoreboard(
      { ...base, schedule: [{ ...base.schedule[0], home: { teamId: 9, totalPoints: 0 } }] },
      { season: 2026, week: 3 },
    );
    expect(board.matchups[0].home).toMatchObject({ name: "Team 9", abbrev: "", ownerName: "Unknown" });
  });

  it("falls back to the owner's handle unless both names are set, then to Unknown", () => {
    const base = payload(3);
    const board = parseNflScoreboard(
      {
        ...base,
        members: [
          { id: "{OWNER-A}", firstName: "Paul", lastName: "", displayName: "paulie" },
          { id: "{OWNER-B}" },
        ],
      },
      { season: 2026, week: 3 },
    );
    expect(board.matchups[0].away.ownerName).toBe("paulie");
    expect(board.matchups[0].home.ownerName).toBe("Unknown");

    const noMember = parseNflScoreboard({ ...base, members: [] }, { season: 2026, week: 3 });
    expect(noMember.matchups[0].away.ownerName).toBe("Unknown");
  });

  it("carries the matchup's id and winner, and calls an unset winner undecided", () => {
    const base = payload(3);
    expect(parseNflScoreboard(base, { season: 2026, week: 3 }).matchups[0]).toMatchObject({ id: 10, winner: "UNDECIDED" });

    const decided = { ...base, schedule: [{ ...base.schedule[0], winner: "HOME" }] };
    expect(parseNflScoreboard(decided, { season: 2026, week: 3 }).matchups[0].winner).toBe("HOME");

    const { winner: _winner, id: _id, ...bare } = base.schedule[0];
    const unset = parseNflScoreboard({ ...base, schedule: [bare] }, { season: 2026, week: 3 }).matchups[0];
    expect(unset).toMatchObject({ id: 0, winner: "UNDECIDED" });
  });

  it("counts the season's weeks up to its last matchup period", () => {
    // The fixture schedules weeks 3 and 4.
    expect(parseNflScoreboard(payload(3), { season: 2026, week: 3 }).totalWeeks).toBe(4);
  });

  it("reads no regular season when the schedule settings are missing", () => {
    const board = parseNflScoreboard({ ...payload(3), settings: {} }, { season: 2026, week: 3 });
    expect(board.regularSeasonWeeks).toBe(0);
  });

  it("gives a side with no roster no starters, and skips a roster entry it can't read", () => {
    const base = payload(3);
    const board = parseNflScoreboard(
      {
        ...base,
        schedule: [
          {
            ...base.schedule[0],
            away: { teamId: 1, totalPoints: 0 },
            home: {
              ...base.schedule[0].home,
              rosterForCurrentScoringPeriod: {
                entries: [{ lineupSlotId: 2 }, ...(base.schedule[0].home.rosterForCurrentScoringPeriod?.entries ?? [])],
              },
            },
          },
        ],
      },
      { season: 2026, week: 3 },
    );
    expect(board.matchups[0].away.starters).toEqual([]);
    expect(board.matchups[0].home.starters.map((p) => p.playerId)).toEqual([200, 201]);
  });

  it("degrades to an empty board on a payload that isn't even an object", () => {
    expect(parseNflScoreboard(null, { season: 2026, week: null })).toMatchObject({
      currentWeek: 1,
      totalWeeks: 0,
      matchups: [],
    });
    expect(parseNflScoreboard("<html>502</html>", { season: 2026, week: 5 }).currentWeek).toBe(5);
  });

  it("degrades to an empty board on a payload that isn't a league", () => {
    const board = parseNflScoreboard({ nope: true }, { season: 2026, week: 3 });
    expect(board.matchups).toEqual([]);
  });

  it("projects nothing still to come for a week that's already over", () => {
    // Week 3 viewed from week 4: Bijan finished 3 under his projection, but his
    // game is done, so those 3 points are never coming.
    const board = parseNflScoreboard(payload(3, 4), { season: 2026, week: 3 });
    expect(board.matchups[0].away.remaining).toBe(0);
    expect(board.matchups[0].home.remaining).toBe(0);
  });

  it("until game clocks are known, counts each live-week starter's unmet projection", () => {
    const board = parseNflScoreboard(payload(3), { season: 2026, week: 3 });
    // Bijan 12 of 15, CeeDee already past his 14.
    expect(board.matchups[0].home.remaining).toBe(3);
  });
});

describe("applyGameProgress", () => {
  // A factory, not a describe-level constant: parsing at collection time means
  // a broken parser crashes the suite before any test runs, which Vitest reports
  // as "no tests" and Stryker reads as a surviving mutant.
  const board = () => parseNflScoreboard(payload(3), { season: 2026, week: 3 });

  it("scales each starter's projection by the share of their game left", () => {
    // Every fixture player is on CIN (proTeamId 4); half the game remains.
    const [m] = applyGameProgress(board().matchups, { CIN: 0.5 });
    expect(m.away.remaining).toBeCloseTo(10.5);
    expect(m.home.remaining).toBeCloseTo(14.5);
  });

  it("projects nothing more once the game is final", () => {
    const [m] = applyGameProgress(board().matchups, { CIN: 0 });
    expect(m.away.remaining).toBe(0);
    expect(m.home.remaining).toBe(0);
  });

  it("projects nothing for a starter whose team has no game this week", () => {
    const [m] = applyGameProgress(board().matchups, { BUF: 1 });
    expect(m.home.remaining).toBe(0);
  });

  it("leaves scores and rosters untouched", () => {
    const [m] = applyGameProgress(board().matchups, { CIN: 1 });
    expect(m.home.totalPoints).toBe(30);
    expect(m.home.starters).toEqual(board().matchups[0].home.starters);
  });
});
