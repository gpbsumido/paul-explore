import { describe, it, expect } from "vitest";
import {
  performancesFromLeague,
  cardsFromLeaguePayload,
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
    expect(RANK[star!.rarity]).toBeGreaterThan(RANK[bench!.rarity]);
  });
});
