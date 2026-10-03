import { describe, it, expect } from "vitest";
import {
  evaluateTrade,
  leagueScoring,
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
  recThisWeek?: number;
  recRos?: number;
  droppable?: boolean;
  tradeLocked?: boolean;
}) {
  return {
    id: opts.id,
    onTeamId: opts.onTeamId,
    tradeLocked: opts.tradeLocked ?? false,
    player: {
      droppable: opts.droppable ?? true,
      id: opts.id,
      fullName: opts.name,
      defaultPositionId: opts.position,
      proTeamId: opts.proTeamId,
      injuryStatus: opts.injuryStatus ?? "ACTIVE",
      eligibleSlots: opts.eligibleSlots,
      stats: [
        // Weekly projection for the current scoring period.
        { id: "1120264", scoringPeriodId: 4, seasonId: 2026, statSourceId: 1, statSplitTypeId: 1, appliedTotal: opts.thisWeek, stats: { "53": opts.recThisWeek ?? 0 } },
        // Thursday's actual for the same week, which must not be read as a projection.
        { id: "01401872964", scoringPeriodId: 4, seasonId: 2026, statSourceId: 0, statSplitTypeId: 1, appliedTotal: 99 },
        // Rest-of-season projection: ESPN's total from this week on.
        { id: "102026", scoringPeriodId: 0, seasonId: 2026, statSourceId: 1, statSplitTypeId: 0, appliedTotal: opts.rosTotal, appliedAverage: 1, stats: { "53": opts.recRos ?? 0 } },
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
      size: 6,
      rosterSettings: {
        lineupSlotCounts: { "0": 1, "2": 1, "4": 0, "7": 1, "20": 5, "21": 2, "23": 1 },
        positionLimits: { "0": 0, "1": 4, "2": 8, "3": 8, "4": 3, "5": 3, "6": -1, "16": 3 },
      },
      scoringSettings: {
        scoringItems: [
          { statId: 53, points: 1, pointsOverrides: {} },
          { statId: 4, points: 4, pointsOverrides: {} },
          { statId: 24, points: 0.1, pointsOverrides: {} },
          { statId: 99, points: 0, pointsOverrides: { "16": 1 } },
        ],
      },
    },
    members: [{ id: "{A}", firstName: "Paul", lastName: "S" }],
    teams: [
      { id: 1, name: "Paul's Perfect Team", owners: ["{A}"], roster: { entries: [{ playerId: 11, lineupSlotId: 0 }] } },
      { id: 2, name: "George's Great Team", owners: [], roster: { entries: [{ playerId: 10, lineupSlotId: 21 }] } },
    ],
    players: [
      rawPlayer({ id: 10, name: "Jahmyr Gibbs", position: 2, proTeamId: 8, onTeamId: 2, eligibleSlots: [2, 23, 20], thisWeek: 10, rosTotal: 30, recThisWeek: 3, recRos: 9, tradeLocked: true }),
      rawPlayer({ id: 11, name: "Brock Purdy", position: 1, proTeamId: 25, onTeamId: 1, eligibleSlots: [0, 20], thisWeek: 18, rosTotal: 54, droppable: false }),
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

function freeAgentsPayload() {
  return {
    players: [
      rawPlayer({ id: 30, name: "Jaylen Warren", position: 2, proTeamId: 25, onTeamId: 0, eligibleSlots: [2, 23, 20], thisWeek: 8, rosTotal: 24, recThisWeek: 2, recRos: 6 }),
    ],
  };
}

describe("parseTradePool", () => {
  const pool = parseTradePool(leaguePayload(), schedulesPayload(), 2026, freeAgentsPayload());

  it("reads the week bounds and the starting lineup slots", () => {
    expect(pool.currentWeek).toBe(4);
    expect(pool.finalWeek).toBe(6);
    // Bench, IR and zero-count slots aren't part of a lineup.
    expect(pool.slotCounts).toEqual({ "0": 1, "2": 1, "7": 1, "23": 1 });
  });

  it("reads the league's format: team count, PPR, TE premium, passing TD points, superflex", () => {
    expect(pool.format).toEqual({ teams: 6, ppr: 1, tePremium: 0, passTdPoints: 4, superflex: true });
  });

  it("counts a full roster as every slot but IR, and keeps the per-position limits that are set", () => {
    // QB 1 + RB 1 + OP 1 + FLEX 1 + bench 5 = 9 (IR's 2 don't count).
    expect(pool.rosterMax).toBe(9);
    expect(pool.positionLimits).toEqual({ "1": 4, "2": 8, "3": 8, "4": 3, "5": 3, "16": 3 });
  });

  it("reads receptions for this week and per game after it", () => {
    const gibbs = pool.players.find((p) => p.playerId === 10);
    expect(gibbs?.recThisWeek).toBe(3);
    // 9 ROS receptions, 3 this week, two games left.
    expect(gibbs?.recPerGame).toBe(3);
  });

  it("flags who's on IR, who can't be dropped and who can't be traded", () => {
    const gibbs = pool.players.find((p) => p.playerId === 10);
    const purdy = pool.players.find((p) => p.playerId === 11);
    expect(gibbs).toMatchObject({ onIr: true, tradeLocked: true, droppable: true });
    expect(purdy).toMatchObject({ onIr: false, tradeLocked: false, droppable: false });
  });

  it("parses the free-agent pool the same way, on no fantasy team", () => {
    expect(pool.freeAgents.map((p) => [p.name, p.fantasyTeamId, p.perGame])).toEqual([["Jaylen Warren", 0, 8]]);
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
    recThisWeek: 0,
    recPerGame: 0,
    onIr: false,
    droppable: true,
    tradeLocked: false,
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

function pool(players: TradePlayer[], overrides: Partial<TradePool> = {}): TradePool {
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
    format: { teams: 2, ppr: 1, tePremium: 0, passTdPoints: 4, superflex: false },
    // null: roster size unknown, so no drops or pickups are modelled.
    rosterMax: null,
    positionLimits: {},
    freeAgents: [],
    ...overrides,
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

describe("evaluateTrade — scoring formats", () => {
  const horizon = (r: ReturnType<typeof evaluateTrade>, key: string) =>
    r.horizons.find((h) => h.key === key);

  // A pass-catching WR for a between-the-tackles RB, equal in this league's full PPR.
  const wrForRb = pool(
    [
      player({ playerId: 1, fantasyTeamId: 1, positionId: 3, eligibleSlots: [23], thisWeek: 12, perGame: 10, recThisWeek: 5, recPerGame: 4 }),
      player({ playerId: 3, fantasyTeamId: 2, positionId: 2, eligibleSlots: [23], thisWeek: 12, perGame: 10, recThisWeek: 1, recPerGame: 1 }),
    ],
    { slotCounts: { "23": 1 } },
  );
  const trade = { teamA: 1, teamB: 2, fromA: [1], fromB: [3] };

  it("scores the league's own format by default", () => {
    expect(leagueScoring(wrForRb.format)).toEqual({ ppr: 1, tePremium: 0, superflex: false });
    expect(horizon(evaluateTrade(wrForRb, trade), "thisWeek")?.winner).toBe("even");
  });

  it("takes each projected reception's point back out under non-PPR", () => {
    const r = evaluateTrade(wrForRb, trade, { ppr: 0, tePremium: 0, superflex: false });
    // WR 12 - 5 = 7 for RB 12 - 1 = 11 this week; 6 for 9 a week after it.
    expect(horizon(r, "thisWeek")?.a).toEqual({ before: 7, after: 11, delta: 4 });
    expect(horizon(r, "restOfSeason")?.a.delta).toBe(6);
  });

  it("adds TE premium to tight ends' receptions only", () => {
    const teForWr = pool(
      [
        player({ playerId: 1, fantasyTeamId: 1, positionId: 4, eligibleSlots: [23], thisWeek: 10, perGame: 10, recThisWeek: 6, recPerGame: 6 }),
        player({ playerId: 3, fantasyTeamId: 2, positionId: 3, eligibleSlots: [23], thisWeek: 10, perGame: 10, recThisWeek: 6, recPerGame: 6 }),
      ],
      { slotCounts: { "23": 1 } },
    );
    const r = evaluateTrade(teForWr, trade, { ppr: 1, tePremium: 0.5, superflex: false });
    expect(horizon(r, "thisWeek")?.a).toEqual({ before: 13, after: 10, delta: -3 });
  });

  it("opens or closes the superflex slot", () => {
    const qbs = pool(
      [
        player({ playerId: 1, fantasyTeamId: 1, positionId: 1, eligibleSlots: [0, 7], thisWeek: 20, perGame: 20 }),
        player({ playerId: 2, fantasyTeamId: 1, positionId: 1, eligibleSlots: [0, 7], thisWeek: 15, perGame: 15 }),
        player({ playerId: 3, fantasyTeamId: 2, positionId: 1, eligibleSlots: [0, 7], thisWeek: 18, perGame: 18 }),
      ],
      { slotCounts: { "0": 1, "7": 1 }, format: { teams: 2, ppr: 1, tePremium: 0, passTdPoints: 4, superflex: true } },
    );
    const qbTrade = { teamA: 1, teamB: 2, fromA: [2], fromB: [3] };
    expect(horizon(evaluateTrade(qbs, qbTrade), "thisWeek")?.a.before).toBe(35);
    const off = evaluateTrade(qbs, qbTrade, { ppr: 1, tePremium: 0, superflex: false });
    expect(horizon(off, "thisWeek")?.a.before).toBe(20);
  });
});

describe("evaluateTrade — roster spots", () => {
  const horizon = (r: ReturnType<typeof evaluateTrade>, key: string) =>
    r.horizons.find((h) => h.key === key);
  const warren = player({ playerId: 30, name: "Jaylen Warren", fantasyTeamId: 0, thisWeek: 8, perGame: 8 });
  const hurt = player({ playerId: 31, name: "Hurt Back", fantasyTeamId: 0, thisWeek: 30, perGame: 30, injuryStatus: "OUT" });
  const full = (extra: TradePlayer[] = [], overrides: Partial<TradePool> = {}) =>
    pool(
      [
        player({ playerId: 1, name: "A One", fantasyTeamId: 1, thisWeek: 15, perGame: 15 }),
        player({ playerId: 2, name: "A Two", fantasyTeamId: 1, thisWeek: 14, perGame: 14 }),
        player({ playerId: 5, name: "A Bench", fantasyTeamId: 1, thisWeek: 2, perGame: 2 }),
        player({ playerId: 3, name: "B Star", fantasyTeamId: 2, thisWeek: 20, perGame: 20 }),
        player({ playerId: 4, name: "B Mid", fantasyTeamId: 2, thisWeek: 6, perGame: 6 }),
        ...extra,
      ],
      { slotCounts: { "2": 2 }, rosterMax: 3, freeAgents: [hurt, warren], ...overrides },
    );

  it("picks up the best healthy free agent for a spot the trade opens, and drops the cheapest player it overfills", () => {
    const pool3 = full([player({ playerId: 6, name: "B Low", fantasyTeamId: 2, thisWeek: 5, perGame: 5 })]);
    const r = evaluateTrade(pool3, { teamA: 1, teamB: 2, fromA: [1, 2], fromB: [3] });
    const week = horizon(r, "thisWeek");
    // A: B Star 20 + A Bench 2 = 22, then Warren replaces the bench at 8 -> 28.
    expect(week?.moves.a).toEqual([{ kind: "add", playerId: 30, name: "Jaylen Warren", positionId: 2, points: 6 }]);
    expect(week?.a).toEqual({ before: 29, after: 28, delta: -1 });
    // B ends on four players for three spots and cuts B Low, who wasn't starting.
    expect(week?.moves.b).toEqual([{ kind: "drop", playerId: 6, name: "B Low", positionId: 2, points: 0 }]);
  });

  it("leaves a 1-for-1 between full rosters alone", () => {
    const pool3 = full([player({ playerId: 6, fantasyTeamId: 2, thisWeek: 5, perGame: 5 })]);
    const r = evaluateTrade(pool3, { teamA: 1, teamB: 2, fromA: [1], fromB: [3] });
    expect(horizon(r, "thisWeek")?.moves).toEqual({ a: [], b: [] });
  });

  it("doesn't credit the trade with a spot that was already open", () => {
    // Team 2 starts with two players for three spots, so a 1-for-1 opens nothing new.
    const r = evaluateTrade(full(), { teamA: 1, teamB: 2, fromA: [1], fromB: [3] });
    expect(horizon(r, "thisWeek")?.moves.b).toEqual([]);
  });

  it("never drops a player who can't be dropped", () => {
    const pool3 = full([player({ playerId: 6, name: "B Low", fantasyTeamId: 2, thisWeek: 5, perGame: 5, droppable: false })]);
    const r = evaluateTrade(pool3, { teamA: 1, teamB: 2, fromA: [1, 2], fromB: [3] });
    expect(horizon(r, "thisWeek")?.moves.b.map((m) => m.name)).toEqual(["B Mid"]);
  });

  it("only picks up players the position limits allow", () => {
    const wr = player({ playerId: 32, name: "Waiver WR", fantasyTeamId: 0, positionId: 3, eligibleSlots: [23], thisWeek: 4, perGame: 4 });
    const limited = pool(
      [
        player({ playerId: 1, fantasyTeamId: 1, thisWeek: 10, perGame: 10, eligibleSlots: [2, 23] }),
        player({ playerId: 7, fantasyTeamId: 1, positionId: 3, thisWeek: 5, perGame: 5, eligibleSlots: [23] }),
        player({ playerId: 3, fantasyTeamId: 2, thisWeek: 12, perGame: 12, eligibleSlots: [2, 23] }),
        player({ playerId: 4, fantasyTeamId: 2, thisWeek: 1, perGame: 1, eligibleSlots: [2, 23] }),
      ],
      { slotCounts: { "2": 1, "23": 1 }, rosterMax: 2, positionLimits: { "2": 1 }, freeAgents: [warren, wr] },
    );
    const r = evaluateTrade(limited, { teamA: 1, teamB: 2, fromA: [1, 7], fromB: [3] });
    expect(horizon(r, "thisWeek")?.moves.a.map((m) => m.name)).toEqual(["Waiver WR"]);
  });
});

describe("evaluateTrade — value, even and warnings", () => {
  it("nets the points each side gets over the best free agent at the position", () => {
    const warren = player({ playerId: 30, fantasyTeamId: 0, thisWeek: 8, perGame: 8 });
    const p = pool(
      [
        player({ playerId: 1, fantasyTeamId: 1, thisWeek: 15, perGame: 15 }),
        player({ playerId: 3, fantasyTeamId: 2, thisWeek: 20, perGame: 20 }),
      ],
      { freeAgents: [warren] },
    );
    const r = evaluateTrade(p, { teamA: 1, teamB: 2, fromA: [1], fromB: [3] });
    // Weeks 5-6: 12 + 12 over waiver received, 7 + 7 given up.
    expect(r.value).toEqual({ a: 10, b: -10, winner: "A", margin: 20 });
  });

  it("calls it even within half a point a week", () => {
    const p = pool([
      player({ playerId: 1, fantasyTeamId: 1, thisWeek: 10, perGame: 10 }),
      player({ playerId: 3, fantasyTeamId: 2, thisWeek: 10.4, perGame: 10.2 }),
    ]);
    const r = evaluateTrade(p, { teamA: 1, teamB: 2, fromA: [1], fromB: [3] });
    // A 0.8 swing is a winner over one week, but even over two.
    expect(r.horizons.find((h) => h.key === "thisWeek")?.winner).toBe("A");
    expect(r.horizons.find((h) => h.key === "restOfSeason")?.winner).toBe("even");
  });

  it("warns about position limits, trade-locked players and drops nobody can make", () => {
    const p = pool(
      [
        player({ playerId: 1, name: "A QB", fantasyTeamId: 1, positionId: 1, eligibleSlots: [0], droppable: false }),
        player({ playerId: 2, name: "A RB", fantasyTeamId: 1, droppable: false }),
        player({ playerId: 3, name: "B QB", fantasyTeamId: 2, positionId: 1, eligibleSlots: [0], tradeLocked: true, droppable: false }),
        player({ playerId: 4, name: "B RB", fantasyTeamId: 2 }),
      ],
      { rosterMax: 2, positionLimits: { "1": 1 } },
    );
    const r = evaluateTrade(p, { teamA: 1, teamB: 2, fromA: [], fromB: [3] });
    expect(r.warnings).toEqual([
      "B QB is trade-locked.",
      "Paul's Perfect Team would have 2 QBs (limit 1).",
      "Paul's Perfect Team would need a drop, but nobody on the roster can be dropped.",
    ]);
  });
});

