import { describe, it, expect } from "vitest";
import type { ZeroproofEvent } from "./schemas";
import {
  availableSports,
  dateRangeActive,
  DEFAULT_BOARD_FILTERS,
  fantasyLabel,
  filterBoardEvents,
  hasMoreBeyondHorizon,
  inDateRange,
  isEventBettable,
  isFantasySport,
  isPastFixture,
  localDayKey,
  matchesFacets,
  matchesOdds,
  sportLabel,
  type BoardFilters,
} from "./boardFilters";

const DAY_MS = 24 * 60 * 60 * 1000;

/** A board event, priced h2h by default. Times are ISO so they parse in any tz. */
function ev(overrides: Partial<ZeroproofEvent> & { prices?: number[] } = {}): ZeroproofEvent {
  const { prices, ...rest } = overrides;
  const outcomes =
    prices !== undefined
      ? prices.map((p, i) => ({ name: `Team ${i}`, priceAmerican: p }))
      : [
          { name: "Home", priceAmerican: -110 },
          { name: "Away", priceAmerican: -110 },
        ];
  return {
    id: overrides.id ?? "e1",
    sport: "basketball_nba",
    home: "Home",
    away: "Away",
    commenceTime: "2026-10-20T18:00:00.000Z",
    status: "upcoming",
    markets: overrides.markets ?? [{ market: "h2h", fetchedAt: "2026-10-19T00:00:00Z", outcomes }],
    ...rest,
  };
}

const filters = (o: Partial<BoardFilters> = {}): BoardFilters => ({
  ...DEFAULT_BOARD_FILTERS,
  ...o,
});

describe("isFantasySport / fantasyLabel", () => {
  it("recognizes fantasy sports by the sport prefix", () => {
    expect(isFantasySport("fantasy_ffl")).toBe(true);
    expect(isFantasySport("basketball_nba")).toBe(false);
  });

  it("labels known fantasy games and falls back to Fantasy", () => {
    expect(fantasyLabel("fantasy_ffl")).toBe("Fantasy Football");
    expect(fantasyLabel("fantasy_fba")).toBe("Fantasy Basketball");
    expect(fantasyLabel("fantasy_xyz")).toBe("Fantasy");
    expect(fantasyLabel("basketball_nba")).toBeNull();
  });
});

describe("sportLabel", () => {
  it("labels fantasy via the fantasy map", () => {
    expect(sportLabel("fantasy_ffl")).toBe("Fantasy Football");
  });
  it("labels known real sports", () => {
    expect(sportLabel("basketball_nba")).toBe("NBA");
    expect(sportLabel("americanfootball_nfl")).toBe("NFL");
    expect(sportLabel("baseball_mlb")).toBe("MLB");
  });
  it("prettifies an unknown sport key without crashing", () => {
    expect(sportLabel("cricket_ipl")).toBe("IPL");
    expect(sportLabel("tennis")).toBe("Tennis");
  });
});

describe("matchesOdds", () => {
  it("passes everything when set to all", () => {
    expect(matchesOdds(ev({ prices: [] }), "all")).toBe(true);
  });

  it("favorites needs an outcome at -200 or shorter (boundary inclusive)", () => {
    expect(matchesOdds(ev({ prices: [-200, 170] }), "favorites")).toBe(true);
    expect(matchesOdds(ev({ prices: [-199, 165] }), "favorites")).toBe(false);
  });

  it("underdogs needs an outcome at +200 or longer (boundary inclusive)", () => {
    expect(matchesOdds(ev({ prices: [-260, 200] }), "underdogs")).toBe(true);
    expect(matchesOdds(ev({ prices: [-240, 199] }), "underdogs")).toBe(false);
  });

  it("even requires every outcome strictly within +/-200 and at least one outcome", () => {
    expect(matchesOdds(ev({ prices: [-110, -110] }), "even")).toBe(true);
    expect(matchesOdds(ev({ prices: [-300, 240] }), "even")).toBe(false);
    expect(matchesOdds(ev({ prices: [] }), "even")).toBe(false);
  });

  it("considers outcomes across every market", () => {
    const event = ev({
      markets: [
        { market: "h2h", fetchedAt: "t", outcomes: [{ name: "H", priceAmerican: -300 }, { name: "A", priceAmerican: 240 }] },
        { market: "spread", fetchedAt: "t", outcomes: [{ name: "H -6.5", priceAmerican: -110, point: -6.5 }] },
      ],
    });
    expect(matchesOdds(event, "favorites")).toBe(true); // the -300 h2h
    expect(matchesOdds(event, "even")).toBe(false); // -300 breaks it despite the -110 spread
  });
});

describe("matchesFacets", () => {
  it("type=sports excludes fantasy, type=fantasy excludes real", () => {
    expect(matchesFacets(ev({ sport: "fantasy_ffl" }), filters({ type: "sports" }))).toBe(false);
    expect(matchesFacets(ev({ sport: "basketball_nba" }), filters({ type: "sports" }))).toBe(true);
    expect(matchesFacets(ev({ sport: "fantasy_ffl" }), filters({ type: "fantasy" }))).toBe(true);
    expect(matchesFacets(ev({ sport: "basketball_nba" }), filters({ type: "fantasy" }))).toBe(false);
  });

  it("a specific sport narrows to exactly that sport key", () => {
    expect(matchesFacets(ev({ sport: "basketball_nba" }), filters({ sport: "basketball_nba" }))).toBe(true);
    expect(matchesFacets(ev({ sport: "americanfootball_nfl" }), filters({ sport: "basketball_nba" }))).toBe(false);
  });

  it("a contradictory type+sport combination matches nothing", () => {
    expect(
      matchesFacets(ev({ sport: "americanfootball_nfl" }), filters({ type: "fantasy", sport: "americanfootball_nfl" })),
    ).toBe(false);
  });
});

describe("localDayKey", () => {
  it("returns null for an unparseable date", () => {
    expect(localDayKey("not-a-date")).toBeNull();
  });
  it("maps the same instant to the same key and distant days to different keys", () => {
    const a = ev({ commenceTime: "2026-10-20T18:00:00Z" });
    const b = ev({ commenceTime: "2026-10-20T20:30:00Z" });
    const c = ev({ commenceTime: "2026-10-23T18:00:00Z" });
    expect(localDayKey(a.commenceTime)).toBe(localDayKey(b.commenceTime));
    expect(localDayKey(a.commenceTime)).not.toBe(localDayKey(c.commenceTime));
  });
});

describe("availableSports", () => {
  it("lists distinct sports present, labeled, real before fantasy", () => {
    const events = [
      ev({ sport: "basketball_nba" }),
      ev({ sport: "fantasy_ffl" }),
      ev({ sport: "basketball_nba" }),
      ev({ sport: "americanfootball_nfl" }),
    ];
    const sports = availableSports(events);
    // Real sports first, alpha by label ("NBA" < "NFL"), then fantasy.
    expect(sports.map((s) => s.sport)).toEqual([
      "basketball_nba",
      "americanfootball_nfl",
      "fantasy_ffl",
    ]);
    expect(sports.find((s) => s.sport === "fantasy_ffl")?.label).toBe("Fantasy Football");
  });
});

describe("dateRangeActive / inDateRange", () => {
  it("is active when either bound is set", () => {
    expect(dateRangeActive(filters())).toBe(false);
    expect(dateRangeActive(filters({ from: "2026-10-20" }))).toBe(true);
    expect(dateRangeActive(filters({ to: "2026-10-25" }))).toBe(true);
  });

  it("treats empty bounds as open-ended", () => {
    expect(inDateRange("2026-10-22", "", "")).toBe(true);
    expect(inDateRange("2026-10-22", "2026-10-20", "")).toBe(true); // from onwards
    expect(inDateRange("2026-10-19", "2026-10-20", "")).toBe(false);
    expect(inDateRange("2026-10-22", "", "2026-10-25")).toBe(true); // up to
    expect(inDateRange("2026-10-26", "", "2026-10-25")).toBe(false);
  });

  it("is inclusive on both ends and normalizes an inverted range", () => {
    expect(inDateRange("2026-10-20", "2026-10-20", "2026-10-25")).toBe(true);
    expect(inDateRange("2026-10-25", "2026-10-20", "2026-10-25")).toBe(true);
    // from after to still works
    expect(inDateRange("2026-10-22", "2026-10-25", "2026-10-20")).toBe(true);
  });
});

describe("filterBoardEvents", () => {
  const now = Date.parse("2026-10-20T00:00:00Z");
  const ctx = (over: Partial<{ daysAhead: number; betEventIds: Set<string> }> = {}) => ({
    now,
    daysAhead: 3,
    dayMs: DAY_MS,
    betEventIds: over.betEventIds ?? new Set<string>(),
  });

  it("applies facets and the horizon together", () => {
    const soon = ev({ id: "soon", commenceTime: "2026-10-21T18:00:00Z", sport: "basketball_nba" });
    const later = ev({ id: "later", commenceTime: "2026-10-30T18:00:00Z", sport: "basketball_nba" });
    const nfl = ev({ id: "nfl", commenceTime: "2026-10-21T18:00:00Z", sport: "americanfootball_nfl" });
    const out = filterBoardEvents([soon, later, nfl], filters({ sport: "basketball_nba" }), ctx());
    expect(out.map((e) => e.id)).toEqual(["soon"]); // later is past horizon, nfl filtered out
  });

  it("still shows a bet-on event past the horizon in all-dates mode, but respects facets", () => {
    const betLater = ev({ id: "bet", commenceTime: "2026-10-30T18:00:00Z", sport: "basketball_nba" });
    const betLaterNfl = ev({ id: "betnfl", commenceTime: "2026-10-30T18:00:00Z", sport: "americanfootball_nfl" });
    const c = ctx({ betEventIds: new Set(["bet", "betnfl"]) });
    expect(filterBoardEvents([betLater], filters(), c).map((e) => e.id)).toEqual(["bet"]);
    // facet filter still applies to a bet-on event
    expect(filterBoardEvents([betLaterNfl], filters({ sport: "basketball_nba" }), c)).toEqual([]);
  });

  it("a date range overrides the horizon and drops the bet-on bypass", () => {
    const day = localDayKey("2026-10-30T18:00:00Z")!;
    const betLater = ev({ id: "bet", commenceTime: "2026-10-25T18:00:00Z" });
    const onDay = ev({ id: "onday", commenceTime: "2026-10-30T18:00:00Z" });
    const c = ctx({ betEventIds: new Set(["bet"]) });
    const out = filterBoardEvents([betLater, onDay], filters({ from: day, to: day }), c);
    expect(out.map((e) => e.id)).toEqual(["onday"]); // bet-on outside the range is NOT shown in date mode
  });

  it("a range spanning several days keeps every event inside it", () => {
    const a = ev({ id: "a", commenceTime: "2026-10-21T18:00:00Z" });
    const b = ev({ id: "b", commenceTime: "2026-10-30T18:00:00Z" });
    const out = filterBoardEvents([a, b], filters({ from: "2026-10-20", to: "2026-10-31" }), ctx());
    expect(out.map((e) => e.id)).toEqual(["a", "b"]);
  });

  it("never lets an unparseable date leak into a range or the horizon", () => {
    const bad = ev({ id: "bad", commenceTime: "nonsense" });
    expect(filterBoardEvents([bad], filters(), ctx())).toEqual([]);
    expect(filterBoardEvents([bad], filters({ from: "2026-10-20", to: "2026-10-25" }), ctx())).toEqual([]);
  });
});

describe("hasMoreBeyondHorizon", () => {
  const now = Date.parse("2026-10-20T00:00:00Z");
  const base = { now, daysAhead: 3, dayMs: DAY_MS, betEventIds: new Set<string>() };

  it("is true when a facet-matching event sits past the horizon", () => {
    const later = ev({ id: "later", commenceTime: "2026-10-30T18:00:00Z", sport: "basketball_nba" });
    expect(hasMoreBeyondHorizon([later], filters(), base)).toBe(true);
  });

  it("ignores events the facets exclude", () => {
    const laterNfl = ev({ id: "ln", commenceTime: "2026-10-30T18:00:00Z", sport: "americanfootball_nfl" });
    expect(hasMoreBeyondHorizon([laterNfl], filters({ sport: "basketball_nba" }), base)).toBe(false);
  });

  it("is false when a date range is active", () => {
    const later = ev({ id: "later", commenceTime: "2026-10-30T18:00:00Z" });
    expect(hasMoreBeyondHorizon([later], filters({ from: "2026-10-30", to: "" }), base)).toBe(false);
  });
});

describe("isPastFixture", () => {
  const NOW = new Date("2026-10-20T12:00:00.000Z").getTime();

  it("is true for a final event", () => {
    expect(
      isPastFixture(ev({ status: "final", commenceTime: "2026-10-25T00:00:00Z" }), NOW),
    ).toBe(true);
  });

  it("is true for an event whose kickoff has already passed", () => {
    expect(isPastFixture(ev({ commenceTime: "2026-10-19T00:00:00Z" }), NOW)).toBe(true);
  });

  it("is false for an upcoming event still ahead of now", () => {
    expect(isPastFixture(ev({ commenceTime: "2026-10-21T00:00:00Z" }), NOW)).toBe(false);
  });
})

describe("isEventBettable", () => {
  const NOW = new Date("2026-10-20T12:00:00.000Z").getTime();

  it("is true only for an upcoming event still ahead of now", () => {
    expect(
      isEventBettable(ev({ status: "upcoming", commenceTime: "2026-10-21T00:00:00Z" }), NOW),
    ).toBe(true);
  });

  it("is false once a matchup has started, even with a future synthetic commence time", () => {
    // A fantasy matchup keeps a commence time ~48h out, so the time check alone
    // never closes it — the 'started' status is what shuts betting off.
    expect(
      isEventBettable(ev({ status: "started", commenceTime: "2026-10-25T00:00:00Z" }), NOW),
    ).toBe(false);
  });

  it("is false for a final event and for a kickoff already in the past", () => {
    expect(
      isEventBettable(ev({ status: "final", commenceTime: "2026-10-25T00:00:00Z" }), NOW),
    ).toBe(false);
    expect(
      isEventBettable(ev({ status: "upcoming", commenceTime: "2026-10-19T00:00:00Z" }), NOW),
    ).toBe(false);
  });
})

describe("filterBoardEvents — past horizon", () => {
  const now = Date.parse("2026-10-20T00:00:00.000Z");
  const ctx = (daysBack: number) => ({
    now,
    daysAhead: 3,
    daysBack,
    dayMs: DAY_MS,
    betEventIds: new Set<string>(),
  });

  it("hides past fixtures by default (daysBack 0)", () => {
    const past = ev({ id: "p", commenceTime: "2026-10-18T18:00:00Z", status: "final" });
    expect(filterBoardEvents([past], filters(), ctx(0)).map((e) => e.id)).toEqual([]);
  });

  it("shows past fixtures within the daysBack window and hides older ones", () => {
    const recent = ev({ id: "recent", commenceTime: "2026-10-18T18:00:00Z", status: "final" });
    const old = ev({ id: "old", commenceTime: "2026-10-10T18:00:00Z", status: "final" });
    const out = filterBoardEvents([recent, old], filters(), ctx(3)).map((e) => e.id);
    expect(out).toContain("recent");
    expect(out).not.toContain("old");
  });
})
