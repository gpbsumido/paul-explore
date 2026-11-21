import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import {
  performancesFromWeek,
  latestScoringPeriod,
  loadNflWeek,
  loadNflSeason,
} from "../espn-nfl";

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
  // The entry factory also carries a projection (99) and a season total (200),
  // so reading either one instead of the week's actual line fails this.
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
    expect(rb?.playerName).toBe("RB One");
    expect(rb?.proTeamId).toBe(21);
  });

  it("ignores a stat line recorded for a different week", () => {
    const perfs = performancesFromWeek(league(7, [entry(1, "RB One", 4, 28.4)]), {
      season: "2025",
      week: 5,
    });
    expect(perfs).toEqual([]);
  });

  it("stamps the fantasy team that rosters the player", () => {
    const perfs = performancesFromWeek(
      {
        status: { latestScoringPeriod: 7 },
        teams: [
          { id: 1, name: "Team One", roster: { entries: [entry(1, "RB One", 5, 28.4)] } },
          { id: 2, name: "", roster: { entries: [entry(2, "WR Two", 5, 12.1)] } },
        ],
      },
      { season: "2025", week: 5 },
    );
    expect(perfs.find((p) => p.playerId === 1)?.rosteredBy).toBe("Team One");
    expect(perfs.find((p) => p.playerId === 2)?.rosteredBy).toBeUndefined();
  });

  it("skips a roster entry that isn't a player, keeping the rest", () => {
    const perfs = performancesFromWeek(
      league(7, [{ playerPoolEntry: { player: { id: "x" } } }, entry(1, "RB One", 5, 28.4)]),
      { season: "2025", week: 5 },
    );
    expect(perfs.map((p) => p.playerId)).toEqual([1]);
  });

  it("finds a week's line even when an earlier stat entry for it has no total", () => {
    const player = {
      playerPoolEntry: {
        player: {
          id: 1,
          fullName: "RB One",
          stats: [
            { scoringPeriodId: 5, statSourceId: 0, statSplitTypeId: 1 },
            { scoringPeriodId: 5, statSourceId: 0, statSplitTypeId: 1, appliedTotal: 28.4 },
          ],
        },
      },
    };
    const perfs = performancesFromWeek(league(7, [player]), { season: "2025", week: 5 });
    expect(perfs.map((p) => p.points)).toEqual([28.4]);
  });

  it("keeps a zero-point week, which is a real line rather than a bye", () => {
    const perfs = performancesFromWeek(league(7, [entry(1, "RB One", 5, 0)]), {
      season: "2025",
      week: 5,
    });
    expect(perfs.map((p) => p.points)).toEqual([0]);
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

describe("performancesFromWeek fantasy results", () => {
  // Two fantasy teams (1, 2) each rostering one player; team 1 wins the matchup.
  const payload = (playoffTierType: string | null) => ({
    status: { latestScoringPeriod: 15 },
    teams: [
      { id: 1, name: "Team One", roster: { entries: [entry(10, "Winner Guy", 5, 20)] } },
      { id: 2, name: "Team Two", roster: { entries: [entry(20, "Loser Guy", 5, 18)] } },
    ],
    schedule: [
      {
        matchupPeriodId: 5,
        winner: "HOME",
        playoffTierType,
        home: { teamId: 1, totalPoints: 120 },
        away: { teamId: 2, totalPoints: 100 },
      },
    ],
  });

  it("marks the winning fantasy team's players with a fantasy win", () => {
    const perfs = performancesFromWeek(payload(null), { season: "2025", week: 5 });
    expect(perfs.find((p) => p.playerId === 10)?.fantasyResult).toBe("win");
    expect(perfs.find((p) => p.playerId === 20)?.fantasyResult).toBeUndefined();
  });

  it("marks the away team's players when the away side wins", () => {
    const awayWins = payload(null);
    awayWins.schedule[0].winner = "AWAY";
    const perfs = performancesFromWeek(awayWins, { season: "2025", week: 5 });
    expect(perfs.find((p) => p.playerId === 20)?.fantasyResult).toBe("win");
    expect(perfs.find((p) => p.playerId === 10)?.fantasyResult).toBeUndefined();
  });

  it("gives neither side a win for a tie", () => {
    const tied = payload(null);
    tied.schedule[0].winner = "TIE";
    const perfs = performancesFromWeek(tied, { season: "2025", week: 5 });
    expect(perfs.map((p) => p.fantasyResult)).toEqual([undefined, undefined]);
  });

  it("treats a playoff tier of NONE as an ordinary week", () => {
    const perfs = performancesFromWeek(payload("NONE"), { season: "2025", week: 5 });
    expect(perfs.find((p) => p.playerId === 10)?.fantasyResult).toBe("win");
  });

  it("only counts the matchup for the week asked about", () => {
    // Players have their lines in week 5; the bracket matchup is week 6's.
    const moved = payload("WINNERS_BRACKET");
    moved.schedule[0].matchupPeriodId = 6;
    const week5 = performancesFromWeek(moved, { season: "2025", week: 5 });
    expect(week5.map((p) => p.fantasyResult)).toEqual([undefined, undefined]);
  });

  it("marks a playoff matchup as a fantasy playoff for both sides", () => {
    const perfs = performancesFromWeek(payload("WINNERS_BRACKET"), { season: "2025", week: 5 });
    expect(perfs.find((p) => p.playerId === 10)?.fantasyResult).toBe("playoff");
    expect(perfs.find((p) => p.playerId === 20)?.fantasyResult).toBe("playoff");
  });

  it("marks the championship matchup as fantasy finals", () => {
    const perfs = performancesFromWeek(payload("WINNERS_CHAMPIONSHIP_TIER"), { season: "2025", week: 5 });
    expect(perfs.find((p) => p.playerId === 10)?.fantasyResult).toBe("finals");
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

// ---------------------------------------------------------------------------
// Loaders
// ---------------------------------------------------------------------------

const LEAGUE_URL =
  "https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/:season/segments/0/leagues/836777691";

/**
 * Serves each week's league payload, keyed by the scoringPeriodId the client
 * asks for. Weeks left out answer 500. Returns the weeks that were requested,
 * in order.
 */
function serveWeeks(byWeek: Record<number, object>, viewsAsked: string[][] = []) {
  const asked: number[] = [];
  server.use(
    http.get(LEAGUE_URL, ({ request }) => {
      const params = new URL(request.url).searchParams;
      const week = Number(params.get("scoringPeriodId"));
      asked.push(week);
      viewsAsked.push(params.getAll("view"));
      return week in byWeek
        ? HttpResponse.json(byWeek[week])
        : HttpResponse.json({}, { status: 500 });
    }),
  );
  return asked;
}

/** A league payload for `week`, with the given players already scored. */
const weekPayload = (week: number, latest: number, players: [number, string, number][]) => ({
  status: { latestScoringPeriod: latest },
  teams: [{ id: 1, name: "Team One", roster: { entries: players.map(([id, name, pts]) => entry(id, name, week, pts)) } }],
});

describe("loadNflWeek", () => {
  it("asks ESPN for the rosters and the matchups, which the cards are built from", async () => {
    const viewsAsked: string[][] = [];
    serveWeeks({ 3: weekPayload(3, 9, []) }, viewsAsked);

    await loadNflWeek({ season: "2025", week: 3 });

    expect(viewsAsked[0]).toEqual(expect.arrayContaining(["mRoster", "mMatchup"]));
  });

  it("reads the week it is asked for and reports the league's latest week", async () => {
    serveWeeks({ 3: weekPayload(3, 9, [[1, "RB One", 20], [2, "WR Two", 10]]) });

    const slate = await loadNflWeek({ season: "2025", week: 3 });

    expect(slate.error).toBe(false);
    expect(slate.week).toBe(3);
    expect(slate.latestWeek).toBe(9);
    expect(slate.cards.map((c) => c.playerName).sort()).toEqual(["RB One", "WR Two"]);
    expect(slate.cards.every((c) => c.periodId === "2025-wk3")).toBe(true);
  });

  it("shows a requested week as asked even when nobody scored", async () => {
    serveWeeks({ 3: weekPayload(3, 9, []) });

    const slate = await loadNflWeek({ season: "2025", week: 3 });

    expect(slate).toMatchObject({ cards: [], week: 3, latestWeek: 9, error: false });
  });

  it("flags an error when the requested week can't be read", async () => {
    serveWeeks({});

    const slate = await loadNflWeek({ season: "2025", week: 3 });

    expect(slate).toEqual({ cards: [], week: 3, latestWeek: 3, error: true });
  });

  it("starts at the latest week and steps back to the most recent one with results", async () => {
    const asked = serveWeeks({
      1: weekPayload(1, 4, [[1, "RB One", 20]]),
      2: weekPayload(2, 4, [[1, "RB One", 25]]),
      3: weekPayload(3, 4, []),
      4: weekPayload(4, 4, []),
    });

    const slate = await loadNflWeek({ season: "2025" });

    expect(slate.week).toBe(2);
    expect(slate.latestWeek).toBe(4);
    expect(slate.cards.map((c) => c.points)).toEqual([25]);
    // The probe for week 1, then 4 (empty), 3 (empty), 2 (found).
    expect(asked).toEqual([1, 4, 3, 2]);
  });

  it("can step all the way back to week 1", async () => {
    serveWeeks({
      1: weekPayload(1, 2, [[1, "RB One", 20]]),
      2: weekPayload(2, 2, []),
    });

    const slate = await loadNflWeek({ season: "2025" });

    expect(slate.week).toBe(1);
    expect(slate.cards).toHaveLength(1);
  });

  it("skips a week the league fails to answer and keeps stepping back", async () => {
    serveWeeks({
      1: weekPayload(1, 3, [[1, "RB One", 20]]),
      2: weekPayload(2, 3, [[1, "RB One", 25]]),
    });

    const slate = await loadNflWeek({ season: "2025" });

    expect(slate.week).toBe(2);
  });

  it("gives up after six weeks of nothing rather than walking the whole season", async () => {
    const asked = serveWeeks(
      Object.fromEntries(
        Array.from({ length: 10 }, (_, i) => [i + 1, weekPayload(i + 1, 10, [])]),
      ),
    );

    const slate = await loadNflWeek({ season: "2025" });

    expect(slate).toEqual({ cards: [], week: null, latestWeek: 10, error: false });
    // One probe for week 1, then weeks 10 down to 5.
    expect(asked).toEqual([1, 10, 9, 8, 7, 6, 5]);
  });
});

describe("loadNflSeason", () => {
  it("combines every week's cards, rarest first", async () => {
    serveWeeks({
      1: weekPayload(1, 2, [[1, "RB One", 10], [2, "WR Two", 30], [3, "TE Three", 20], [4, "QB Four", 5]]),
      2: weekPayload(2, 2, [[1, "RB One", 8], [2, "WR Two", 40], [3, "TE Three", 2], [4, "QB Four", 1]]),
    });

    const slate = await loadNflSeason({ season: "2025" });

    expect(slate.error).toBe(false);
    expect(slate.week).toBeNull();
    expect(slate.latestWeek).toBe(2);
    expect(slate.cards).toHaveLength(8);
    expect(slate.cards.map((c) => c.periodId)).toContain("2025-wk1");
    expect(slate.cards.map((c) => c.periodId)).toContain("2025-wk2");
    const rank = { sir: 3, rare: 2, uncommon: 1, common: 0 };
    const ranks = slate.cards.map((c) => rank[c.rarity]);
    expect(ranks).toEqual([...ranks].sort((a, b) => b - a));
    expect(slate.cards[0].points).toBe(40);
  });

  it("doesn't fetch week 1 twice", async () => {
    const asked = serveWeeks({
      1: weekPayload(1, 2, [[1, "RB One", 10]]),
      2: weekPayload(2, 2, [[1, "RB One", 12]]),
    });

    await loadNflSeason({ season: "2025" });

    expect([...asked].sort()).toEqual([1, 2]);
  });

  it("flags an error when no week yields a card", async () => {
    serveWeeks({});

    const slate = await loadNflSeason({ season: "2025" });

    expect(slate).toEqual({ cards: [], week: null, latestWeek: 1, error: true });
  });
});
