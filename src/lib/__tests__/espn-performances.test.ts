import { describe, it, expect } from "vitest";
import {
  performancesFromLeague,
  cardsFromLeaguePayload,
  fantasyLeagueUrl,
  nbaFantasyLeagueUrl,
  playoffTeamPlayerIds,
  rostersByPlayer,
  FANTASY_LEAGUES,
} from "../espn-performances";

/** One roster entry in ESPN's mRoster shape, with a projection to ignore and an actual to read. */
const entry = (id: number, name: string, actual: number) => ({
  lineupSlotId: 0,
  playerPoolEntry: {
    player: {
      id,
      fullName: name,
      proTeamId: 5,
      stats: [
        { statSourceId: 1, statSplitTypeId: 0, appliedTotal: 999 },
        { statSourceId: 0, statSplitTypeId: 0, appliedTotal: actual },
      ],
    },
  },
});

/** A league payload, one team per argument, each holding the given roster entries. */
const league = (...teams: unknown[][]) => ({
  settings: { name: "Test League" },
  teams: teams.map((entries, i) => ({ id: i + 1, roster: { entries } })),
});

const RANK = { common: 0, uncommon: 1, rare: 2, sir: 3 } as const;

describe("performancesFromLeague", () => {
  it("flattens rostered players and reads the actual season total", () => {
    const perfs = performancesFromLeague(
      league([entry(1, "A", 40)], [entry(2, "B", 20)]),
      { season: "2024" },
    );
    expect(perfs).toHaveLength(2);
    const a = perfs.find((p) => p.playerId === 1);
    expect(a?.playerName).toBe("A");
    expect(a?.points).toBe(40);
    expect(a?.periodId).toBe("2024-season");
    expect(a?.sport).toBe("nba");
  });

  it("carries the player's pro team through", () => {
    const [perf] = performancesFromLeague(league([entry(1, "A", 40)]), { season: "2024" });
    expect(perf.proTeamId).toBe(5);
  });

  describe("season total", () => {
    const withStats = (stats: unknown[] | undefined) =>
      league([
        { playerPoolEntry: { player: { id: 1, fullName: "A", stats } } },
      ]);
    const pointsOf = (stats: unknown[] | undefined) =>
      performancesFromLeague(withStats(stats), { season: "2024" })[0].points;

    it("prefers the actual season split over a split for a single game or week", () => {
      expect(
        pointsOf([
          { statSourceId: 0, statSplitTypeId: 1, appliedTotal: 7 },
          { statSourceId: 0, statSplitTypeId: 0, appliedTotal: 40 },
        ]),
      ).toBe(40);
    });

    it("falls back to any actual line when there is no season split", () => {
      expect(
        pointsOf([
          { statSourceId: 1, statSplitTypeId: 0, appliedTotal: 999 },
          { statSourceId: 0, statSplitTypeId: 1, appliedTotal: 7 },
        ]),
      ).toBe(7);
    });

    it("falls back to the first line when none is an actual", () => {
      expect(
        pointsOf([
          { statSourceId: 1, statSplitTypeId: 0, appliedTotal: 12 },
          { statSourceId: 1, statSplitTypeId: 1, appliedTotal: 99 },
        ]),
      ).toBe(12);
    });

    it("is zero for a player with no stats", () => {
      expect(pointsOf([])).toBe(0);
      expect(pointsOf(undefined)).toBe(0);
    });
  });

  it("skips entries that don't match the ESPN shape without throwing", () => {
    const perfs = performancesFromLeague(
      league([entry(1, "A", 40), { junk: true }, { playerPoolEntry: {} }]),
      { season: "2024" },
    );
    expect(perfs).toHaveLength(1);
    expect(perfs[0].playerId).toBe(1);
  });

  it("returns nothing for a payload that isn't a league", () => {
    expect(
      performancesFromLeague({ error: "not authorized" }, { season: "2024" }),
    ).toEqual([]);
  });
});

describe("fantasyLeagueUrl", () => {
  it("builds the NBA (fba) league url", () => {
    const url = fantasyLeagueUrl("nba", "2026");
    expect(url).toContain("/games/fba/seasons/2026/");
    expect(url).toContain(`/leagues/${FANTASY_LEAGUES.nba.leagueId}`);
  });

  it("builds the NFL (ffl) league url", () => {
    const url = fantasyLeagueUrl("nfl", "2025");
    expect(url).toContain("/games/ffl/seasons/2025/");
    expect(url).toContain(`/leagues/${FANTASY_LEAGUES.nfl.leagueId}`);
  });

  it("builds the WNBA (wfba) league url", () => {
    const url = fantasyLeagueUrl("wnba", "2026");
    expect(url).toContain("/games/wfba/seasons/2026/");
    expect(url).toContain("/leagues/886603882");
  });
});

describe("nbaFantasyLeagueUrl", () => {
  it("is the same url as the NBA league one, so the Card Lab and the nightly read one league", () => {
    expect(nbaFantasyLeagueUrl("2025")).toBe(fantasyLeagueUrl("nba", "2025"));
  });

  it("asks for the teams, rosters and settings the parsers read", () => {
    const views = new URL(fantasyLeagueUrl("nba", "2025")).searchParams.getAll("view");
    expect(views).toEqual(["mTeam", "mRoster", "mSettings"]);
  });
});

describe("rostersByPlayer", () => {
  it("maps each rostered player to the team that holds them", () => {
    const roster = rostersByPlayer({
      teams: [
        { name: "Team One", roster: { entries: [entry(1, "A", 10), entry(2, "B", 10)] } },
        { name: "Team Two", roster: { entries: [entry(3, "C", 10)] } },
      ],
    });
    expect(Object.fromEntries(roster)).toEqual({ 1: "Team One", 2: "Team One", 3: "Team Two" });
  });

  it("uses a blank name for a team ESPN didn't name", () => {
    const roster = rostersByPlayer({ teams: [{ roster: { entries: [entry(1, "A", 10)] } }] });
    expect(roster.get(1)).toBe("");
  });

  it("skips entries that aren't players and keeps the rest", () => {
    const roster = rostersByPlayer({
      teams: [{ name: "Team One", roster: { entries: [{ junk: true }, entry(1, "A", 10)] } }],
    });
    expect([...roster.keys()]).toEqual([1]);
  });

  it("is empty for a payload that isn't a league", () => {
    expect(rostersByPlayer({ error: "not authorized" }).size).toBe(0);
    expect(rostersByPlayer(null).size).toBe(0);
  });
});

describe("playoffTeamPlayerIds", () => {
  /** Two teams: seed 2 makes the top-2 playoffs, seed 4 misses. */
  const payload = {
    settings: { scheduleSettings: { playoffTeamCount: 2 } },
    teams: [
      { id: 1, playoffSeed: 2, roster: { entries: [entry(1, "In", 30)] } },
      { id: 2, playoffSeed: 4, roster: { entries: [entry(2, "Out", 30)] } },
    ],
  };

  it("collects players on teams seeded into the playoffs", () => {
    const ids = playoffTeamPlayerIds(payload);
    expect(ids.has(1)).toBe(true);
    expect(ids.has(2)).toBe(false);
  });

  it("includes the team seeded exactly on the cutoff and leaves out one seed past it", () => {
    const edge = {
      settings: { scheduleSettings: { playoffTeamCount: 2 } },
      teams: [
        { id: 1, playoffSeed: 2, roster: { entries: [entry(1, "Last in", 30)] } },
        { id: 2, playoffSeed: 3, roster: { entries: [entry(2, "First out", 30)] } },
      ],
    };
    expect([...playoffTeamPlayerIds(edge)]).toEqual([1]);
  });

  it("ignores a team with no seed or a seed of zero", () => {
    const unseeded = {
      settings: { scheduleSettings: { playoffTeamCount: 4 } },
      teams: [
        { id: 1, roster: { entries: [entry(1, "No seed", 30)] } },
        { id: 2, playoffSeed: 0, roster: { entries: [entry(2, "Zero seed", 30)] } },
      ],
    };
    expect(playoffTeamPlayerIds(unseeded).size).toBe(0);
  });

  it("is empty for a payload that isn't a league", () => {
    expect(playoffTeamPlayerIds("nope").size).toBe(0);
  });

  it("is empty when the league has no playoff cutoff", () => {
    expect(playoffTeamPlayerIds({ teams: payload.teams }).size).toBe(0);
  });
});

describe("cardsFromLeaguePayload", () => {
  it("turns a league payload straight into rarity-tiered cards", () => {
    const cards = cardsFromLeaguePayload(
      league(
        [entry(1, "Star", 60), entry(2, "Bench", 2)],
        [entry(3, "Mid", 25), entry(4, "Deep", 8)],
      ),
      { season: "2024" },
    );
    expect(cards).toHaveLength(4);
    const star = cards.find((c) => c.playerId === 1);
    const bench = cards.find((c) => c.playerId === 2);
    expect(star?.points).toBe(60);
    expect(RANK[star?.rarity ?? "common"]).toBeGreaterThan(RANK[bench?.rarity ?? "sir"]);
  });
});
