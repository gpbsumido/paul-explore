import { describe, it, expect } from "vitest";
import type { ZeroproofEvent } from "./schemas";
import {
  availableSports,
  dateRangeActive,
  DEFAULT_BOARD_FILTERS,
  fantasyLabel,
  filterBoardEvents,
  hasActiveFilters,
  hasMoreBeyondHorizon,
  inDateRange,
  isEventBettable,
  isFantasySport,
  isPastFixture,
  localDayKey,
  matchesFacets,
  matchesOdds,
  revealEvent,
  withinFutureCap,
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

  it("names every sport a league can be added for", () => {
    expect(fantasyLabel("fantasy_flb")).toBe("Fantasy Baseball");
    expect(fantasyLabel("fantasy_fhl")).toBe("Fantasy Hockey");
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

  it("even keeps a price just inside the favourite and longshot lines, and drops one exactly on them", () => {
    expect(matchesOdds(ev({ prices: [-199, 199] }), "even")).toBe(true);
    expect(matchesOdds(ev({ prices: [-200, 150] }), "even")).toBe(false);
    expect(matchesOdds(ev({ prices: [-150, 200] }), "even")).toBe(false);
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
  it("keys a time by its local calendar day, zero-padded", () => {
    // Built from local parts so the answer does not depend on the machine's timezone.
    expect(localDayKey(new Date(2026, 9, 5, 0, 30).toISOString())).toBe("2026-10-05");
    expect(localDayKey(new Date(2026, 9, 5, 23, 30).toISOString())).toBe("2026-10-05");
    expect(localDayKey(new Date(2026, 11, 31, 12, 0).toISOString())).toBe("2026-12-31");
  });
  it("maps two times on one local day to one key and a later day to a different key", () => {
    const morning = new Date(2026, 9, 20, 9, 0).toISOString();
    const evening = new Date(2026, 9, 20, 21, 30).toISOString();
    const threeDaysLater = new Date(2026, 9, 23, 9, 0).toISOString();
    expect(localDayKey(morning)).toBe(localDayKey(evening));
    expect(localDayKey(morning)).not.toBe(localDayKey(threeDaysLater));
  });
});

describe("hasActiveFilters", () => {
  it("is false for the defaults", () => {
    expect(hasActiveFilters(DEFAULT_BOARD_FILTERS)).toBe(false);
  });

  it.each([
    ["type", filters({ type: "fantasy" })],
    ["sport", filters({ sport: "basketball_nba" })],
    ["a from date", filters({ from: "2026-10-20" })],
    ["a to date", filters({ to: "2026-10-25" })],
    ["odds", filters({ odds: "even" })],
  ])("is true when %s is set", (_label, active) => {
    expect(hasActiveFilters(active)).toBe(true);
  });
});

describe("availableSports", () => {
  it("lists each sport once and orders same-kind sports by label", () => {
    const sports = availableSports([
      ev({ sport: "americanfootball_nfl" }),
      ev({ sport: "basketball_nba" }),
      ev({ sport: "baseball_mlb" }),
      ev({ sport: "americanfootball_nfl" }),
    ]);
    expect(sports.map((s) => s.label)).toEqual(["MLB", "NBA", "NFL"]);
  });

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

  it("includes an event exactly on the edge of the horizon", () => {
    const onTheEdge = ev({ id: "edge", commenceTime: new Date(now + 3 * DAY_MS).toISOString() });
    expect(filterBoardEvents([onTheEdge], filters(), ctx()).map((e) => e.id)).toEqual(["edge"]);
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

  it("does not count an event the viewer already bet on as more to load", () => {
    const later = ev({ id: "bet", commenceTime: "2026-10-30T18:00:00Z" });
    expect(hasMoreBeyondHorizon([later], filters(), { ...base, betEventIds: new Set(["bet"]) })).toBe(false);
  });

  it("does not count an event with a date that will not parse", () => {
    expect(hasMoreBeyondHorizon([ev({ commenceTime: "nonsense" })], filters(), base)).toBe(false);
  });

  it("does not count an event inside the horizon", () => {
    expect(hasMoreBeyondHorizon([ev({ commenceTime: "2026-10-21T18:00:00Z" })], filters(), base)).toBe(false);
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

  it("is false for a kickoff exactly now, which has not passed yet", () => {
    expect(isPastFixture(ev({ commenceTime: new Date(NOW).toISOString() }), NOW)).toBe(false);
  });

  it("is false for an upcoming event with a date that will not parse", () => {
    expect(isPastFixture(ev({ commenceTime: "nonsense" }), NOW)).toBe(false);
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

  it("is false at the exact kickoff instant and for a date that will not parse", () => {
    expect(isEventBettable(ev({ commenceTime: new Date(NOW).toISOString() }), NOW)).toBe(false);
    expect(isEventBettable(ev({ commenceTime: "nonsense" }), NOW)).toBe(false);
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

describe("revealEvent", () => {
  const NOW = new Date("2026-10-20T00:00:00.000Z").getTime();
  const ctx = (daysAhead: number) => ({ now: NOW, daysAhead, dayMs: DAY_MS, betEventIds: new Set<string>() });
  const at = (days: number) => new Date(NOW + days * DAY_MS).toISOString();

  it("leaves the board alone when the event already shows", () => {
    const event = ev({ commenceTime: at(2) });
    expect(revealEvent(event, filters(), ctx(3), 3)).toEqual({ filters: filters(), daysAhead: 3 });
  });

  it("widens the horizon in whole steps until it reaches the event's kickoff", () => {
    // 7.5 days out: 6 days falls short, 9 covers it.
    const event = ev({ commenceTime: at(7.5) });
    expect(revealEvent(event, filters(), ctx(3), 3).daysAhead).toBe(9);
    // Exactly on a step boundary needs no extra step.
    expect(revealEvent(ev({ commenceTime: at(6) }), filters(), ctx(3), 3).daysAhead).toBe(6);
  });

  it("leaves the horizon alone for an event whose date will not parse", () => {
    const event = ev({ commenceTime: "nonsense" });
    expect(revealEvent(event, filters(), ctx(3), 3).daysAhead).toBe(3);
  });

  it("never narrows a horizon that's already wider", () => {
    const event = ev({ commenceTime: at(4) });
    expect(revealEvent(event, filters(), ctx(12), 3).daysAhead).toBe(12);
  });

  it("resets filters that would hide the event", () => {
    const event = ev({ sport: "americanfootball_nfl", commenceTime: at(1) });
    const hidden = revealEvent(event, filters({ sport: "basketball_nba", odds: "favorites" }), ctx(3), 3);
    expect(hidden.filters).toEqual(DEFAULT_BOARD_FILTERS);
  });

  it("resets a date range that leaves the event out", () => {
    const event = ev({ commenceTime: at(5) });
    const range = filters({ from: localDayKey(at(1)) ?? "", to: localDayKey(at(2)) ?? "" });
    const result = revealEvent(event, range, ctx(3), 3);
    expect(result.filters).toEqual(DEFAULT_BOARD_FILTERS);
    expect(result.daysAhead).toBe(6);
  });

  it("keeps filters that already let the event through", () => {
    const event = ev({ commenceTime: at(5), prices: [250, -300] });
    const kept = filters({ sport: "basketball_nba", odds: "underdogs" });
    expect(revealEvent(event, kept, ctx(3), 3)).toEqual({ filters: kept, daysAhead: 6 });
  });
});

describe("withinFutureCap", () => {
  const NOW = new Date("2026-10-20T00:00:00.000Z").getTime();
  const at = (days: number) => new Date(NOW + days * DAY_MS).toISOString();

  it("keeps fixtures up to the cap and drops anything further out", () => {
    const events = [
      ev({ id: "soon", commenceTime: at(2) }),
      ev({ id: "edge", commenceTime: at(30) }),
      ev({ id: "far", commenceTime: at(31) }),
    ];
    expect(withinFutureCap(events, { now: NOW, maxDays: 30, dayMs: DAY_MS }).map((e) => e.id)).toEqual([
      "soon",
      "edge",
    ]);
  });

  it("keeps an event whose date will not parse, rather than silently dropping it", () => {
    const unparseable = ev({ id: "odd", commenceTime: "nonsense" });
    expect(withinFutureCap([unparseable], { now: NOW, maxDays: 30, dayMs: DAY_MS })).toEqual([unparseable]);
  });

  it("leaves past fixtures alone", () => {
    const past = ev({ id: "past", commenceTime: at(-40), status: "final" });
    expect(withinFutureCap([past], { now: NOW, maxDays: 30, dayMs: DAY_MS })).toEqual([past]);
  });
});
