import { describe, it, expect } from "vitest";
import {
  evaluateTrade,
  optimalLineupPoints,
  parseTradePool,
  type TradePlayer,
  type TradePool,
} from "./trade";

// ---- ESPN-shaped payloads for the parser ----

function rawPlayer(opts: {
  id: number;
  name: string;
  position: number;
  proTeamId: number;
  onTeamId: number;
  eligibleSlots: number[];
  thisWeek: number;
  rosTotal: number;
  injuryStatus?: string;
}) {
  return {
    id: opts.id,
    onTeamId: opts.onTeamId,
    player: {
      id: opts.id,
      fullName: opts.name,
      defaultPositionId: opts.position,
      proTeamId: opts.proTeamId,
      injuryStatus: opts.injuryStatus ?? "ACTIVE",
      eligibleSlots: opts.eligibleSlots,
      stats: [
        // Weekly projection for the current scoring period.
        { id: "1120264", scoringPeriodId: 4, seasonId: 2026, statSourceId: 1, statSplitTypeId: 1, appliedTotal: opts.thisWeek },
        // Thursday's actual for the same week, which must not be read as a projection.
        { id: "01401872964", scoringPeriodId: 4, seasonId: 2026, statSourceId: 0, statSplitTypeId: 1, appliedTotal: 99 },
        // Rest-of-season projection: ESPN's total from this week on.
        { id: "102026", scoringPeriodId: 0, seasonId: 2026, statSourceId: 1, statSplitTypeId: 0, appliedTotal: opts.rosTotal, appliedAverage: 1 },
        // Last season's projection, which must be ignored.
        { id: "102025", scoringPeriodId: 0, seasonId: 2025, statSourceId: 1, statSplitTypeId: 0, appliedTotal: 999 },
      ],
    },
  };
}

function leaguePayload() {
  return {
    seasonId: 2026,
    scoringPeriodId: 4,
    status: { currentMatchupPeriod: 4, finalScoringPeriod: 6 },
    settings: {
      rosterSettings: { lineupSlotCounts: { "0": 1, "2": 1, "4": 0, "20": 5, "23": 1 } },
    },
    members: [{ id: "{A}", firstName: "Paul", lastName: "S" }],
    teams: [
      { id: 1, name: "Paul's Perfect Team", owners: ["{A}"] },
      { id: 2, name: "George's Great Team", owners: [] },
    ],
    players: [
      rawPlayer({ id: 10, name: "Jahmyr Gibbs", position: 2, proTeamId: 8, onTeamId: 2, eligibleSlots: [2, 23, 20], thisWeek: 10, rosTotal: 30 }),
      rawPlayer({ id: 11, name: "Brock Purdy", position: 1, proTeamId: 25, onTeamId: 1, eligibleSlots: [0, 20], thisWeek: 18, rosTotal: 54 }),
      // A free agent sneaking into the pool is dropped.
      rawPlayer({ id: 12, name: "Free Agent", position: 3, proTeamId: 8, onTeamId: 0, eligibleSlots: [4], thisWeek: 5, rosTotal: 5 }),
    ],
    positionAgainstOpponent: {
      positionalRatings: {
        "2": { ratingsByOpponent: { "22": { average: 30, rank: 30 }, "9": { average: 12, rank: 2 } } },
        "1": { ratingsByOpponent: { "14": { average: 14, rank: 4 }, "2": { average: 22, rank: 20 } } },
      },
    },
  };
}

function game(week: number, away: number, home: number) {
  return { scoringPeriodId: week, awayProTeamId: away, homeProTeamId: home };
}

function schedulesPayload() {
  return {
    settings: {
      proTeams: [
        {
          id: 8,
          abbrev: "DET",
          byeWeek: 6,
          // Weeks 4, 5 and 7 -- week 6 is the bye. Week 7 is past the fantasy
          // season but still an NFL game, so it counts toward games left.
          proGamesByScoringPeriod: {
            "4": [game(4, 8, 29)],
            "5": [game(5, 22, 8)],
            "7": [game(7, 8, 9)],
          },
        },
        {
          id: 25,
          abbrev: "SF",
          byeWeek: 9,
          proGamesByScoringPeriod: {
            "4": [game(4, 25, 1)],
            "5": [game(5, 14, 25)],
            "6": [game(6, 25, 2)],
          },
        },
      ],
    },
  };
}

describe("parseTradePool", () => {
  const pool = parseTradePool(leaguePayload(), schedulesPayload(), 2026);

  it("reads the week bounds and the starting lineup slots", () => {
    expect(pool.currentWeek).toBe(4);
    expect(pool.finalWeek).toBe(6);
    // Bench and zero-count slots aren't part of a lineup.
    expect(pool.slotCounts).toEqual({ "0": 1, "2": 1, "23": 1 });
  });

  it("lists each fantasy team with its owner", () => {
    expect(pool.teams).toEqual([
      { teamId: 1, name: "Paul's Perfect Team", ownerName: "Paul S" },
      { teamId: 2, name: "George's Great Team", ownerName: "Unknown" },
    ]);
  });

  it("keeps only rostered players", () => {
    expect(pool.players.map((p) => p.playerId).sort()).toEqual([10, 11]);
  });

  it("takes this week's projection, not Thursday's actual", () => {
    const gibbs = pool.players.find((p) => p.playerId === 10);
    expect(gibbs?.thisWeek).toBe(10);
  });

  it("spreads ESPN's rest-of-season total over the games left after this week", () => {
    // 30 total from week 4 on, 10 of it this week, two games left (5 and 7).
    const gibbs = pool.players.find((p) => p.playerId === 10);
    expect(gibbs?.perGame).toBe(10);
    // 54 total, 18 this week, games in 5 and 6.
    expect(pool.players.find((p) => p.playerId === 11)?.perGame).toBe(18);
  });

  it("maps each remaining fantasy week to the opponent, leaving byes out", () => {
    const gibbs = pool.players.find((p) => p.playerId === 10);
    expect(gibbs?.opponents).toEqual({ "5": 22 });
  });

  it("rates strength of schedule as the mean opponent rank against the position", () => {
    // Gibbs (RB) plays only #22 in weeks 5-6: rank 30 of 32, an easy draw.
    expect(pool.players.find((p) => p.playerId === 10)?.sosRank).toBe(30);
    // Purdy (QB) faces #14 (rank 4) and #2 (rank 20).
    expect(pool.players.find((p) => p.playerId === 11)?.sosRank).toBe(12);
  });

  it("degrades to an empty pool on payloads that aren't a league", () => {
    const empty = parseTradePool({ nope: true }, {}, 2026);
    expect(empty.players).toEqual([]);
    expect(empty.teams).toEqual([]);
  });
});

// ---- Lineup and trade math, on normalized players ----

function player(overrides: Partial<TradePlayer> & { playerId: number }): TradePlayer {
  return {
    name: `Player ${overrides.playerId}`,
    positionId: 2,
    proTeamId: 8,
    fantasyTeamId: 1,
    injuryStatus: "ACTIVE",
    eligibleSlots: [2],
    thisWeek: 0,
    perGame: 0,
    opponents: { "5": 1, "6": 1 },
    sosRank: null,
    ...overrides,
  };
}

describe("optimalLineupPoints", () => {
  it("fills the narrow slots before the wide ones", () => {
    // Filling OP first would spend the RB there and leave FLEX empty (30);
    // the best lineup puts the RB at FLEX and the backup QB at OP (39).
    const players = [
      { eligibleSlots: [0, 7], value: 20 },
      { eligibleSlots: [0, 7], value: 9 },
      { eligibleSlots: [2, 23, 7], value: 10 },
    ];
    expect(optimalLineupPoints(players, { "0": 1, "7": 1, "23": 1 })).toBe(39);
  });

  it("leaves a slot empty when nobody is eligible", () => {
    expect(optimalLineupPoints([{ eligibleSlots: [2], value: 12 }], { "0": 1, "2": 1 })).toBe(12);
  });
});

function pool(players: TradePlayer[]): TradePool {
  return {
    season: 2026,
    currentWeek: 4,
    finalWeek: 6,
    slotCounts: { "2": 1 },
    teams: [
      { teamId: 1, name: "Paul's Perfect Team", ownerName: "Paul S" },
      { teamId: 2, name: "George's Great Team", ownerName: "George" },
    ],
    players,
  };
}

describe("evaluateTrade", () => {
  // Team 1 sends two decent RBs for team 2's star; only one RB starts.
  const twoForOne = pool([
    player({ playerId: 1, fantasyTeamId: 1, thisWeek: 15, perGame: 15 }),
    player({ playerId: 2, fantasyTeamId: 1, thisWeek: 14, perGame: 14 }),
    player({ playerId: 3, fantasyTeamId: 2, thisWeek: 20, perGame: 20 }),
    player({ playerId: 4, fantasyTeamId: 2, thisWeek: 5, perGame: 5 }),
  ]);
  const result = evaluateTrade(twoForOne, { teamA: 1, teamB: 2, fromA: [1, 2], fromB: [3] });
  const horizon = (key: string) => result.horizons.find((h) => h.key === key);

  it("scores the trade by the lineup each side can start, not raw totals", () => {
    // Raw sums say team 1 gives 29 for 20. In the lineup it swaps a 15 for a 20.
    const week = horizon("thisWeek");
    expect(week?.a).toEqual({ before: 15, after: 20, delta: 5 });
    expect(week?.b).toEqual({ before: 20, after: 15, delta: -5 });
    expect(week?.winner).toBe("A");
    expect(week?.margin).toBe(10);
  });

  it("covers next week and the rest of the season after this week", () => {
    expect(horizon("nextWeek")?.weeks).toEqual([5, 5]);
    expect(horizon("restOfSeason")?.weeks).toEqual([5, 6]);
    expect(horizon("restOfSeason")?.a.delta).toBe(10);
  });

  it("counts nothing for a player on a bye", () => {
    const byeTrade = pool([
      player({ playerId: 1, fantasyTeamId: 1, perGame: 15, opponents: { "6": 1 } }),
      player({ playerId: 3, fantasyTeamId: 2, perGame: 20, opponents: { "5": 1, "6": 1 } }),
    ]);
    const r = evaluateTrade(byeTrade, { teamA: 1, teamB: 2, fromA: [1], fromB: [3] });
    // Week 5: player 1 is on a bye, so team 1 gains the full 20.
    expect(r.horizons.find((h) => h.key === "nextWeek")?.a.delta).toBe(20);
    // Weeks 5-6: team 1 had 0 + 15, now 20 + 20.
    expect(r.horizons.find((h) => h.key === "restOfSeason")?.a).toEqual({
      before: 15,
      after: 40,
      delta: 25,
    });
  });

  it("calls a dead-even trade even", () => {
    const even = pool([
      player({ playerId: 1, fantasyTeamId: 1, thisWeek: 10, perGame: 10 }),
      player({ playerId: 3, fantasyTeamId: 2, thisWeek: 10, perGame: 10 }),
    ]);
    const r = evaluateTrade(even, { teamA: 1, teamB: 2, fromA: [1], fromB: [3] });
    expect(r.horizons.every((h) => h.winner === "even")).toBe(true);
  });

  it("averages strength of schedule over what each side receives", () => {
    const sos = pool([
      player({ playerId: 1, fantasyTeamId: 1, sosRank: 10 }),
      player({ playerId: 2, fantasyTeamId: 1, sosRank: 20 }),
      player({ playerId: 3, fantasyTeamId: 2, sosRank: 28 }),
    ]);
    const r = evaluateTrade(sos, { teamA: 1, teamB: 2, fromA: [1, 2], fromB: [3] });
    expect(r.sos).toEqual({ aReceives: 28, bReceives: 15 });
  });
});
