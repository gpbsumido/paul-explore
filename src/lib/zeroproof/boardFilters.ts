// ---------------------------------------------------------------------------
// Client-side filters for the ZeroProof board.
//
// The board is served whole from the DB and filtered in the browser, so these
// are pure functions over the already-fetched events: no request touches the
// server, and there's nothing to authorize (every board event is public). They
// only decide what a viewer sees.
// ---------------------------------------------------------------------------

import type { ZeroproofEvent } from "./schemas";

/** In or out of ESPN fantasy: everything, real sports only, or fantasy only. */
export type BoardTypeFilter = "all" | "sports" | "fantasy";

/**
 * Odds lens over an event's outcomes. A big favourite or a longshot is "does
 * any outcome reach that price"; even is "do all of them stay inside the band".
 */
export type BoardOddsFilter = "all" | "favorites" | "underdogs" | "even";

export interface BoardFilters {
  type: BoardTypeFilter;
  /** A sport key like "basketball_nba", or "all". */
  sport: string;
  /** A local day key from localDayKey(), or "all". */
  day: string;
  odds: BoardOddsFilter;
}

export const DEFAULT_BOARD_FILTERS: BoardFilters = {
  type: "all",
  sport: "all",
  day: "all",
  odds: "all",
};

/** Prices at or beyond these American lines read as a real favourite / longshot. */
const FAVORITE_AT = -200;
const UNDERDOG_AT = 200;

/** Whether a sport key is one of the ESPN fantasy matchups. */
export function isFantasySport(sport: string): boolean {
  return sport.startsWith("fantasy_");
}

const FANTASY_GAME_NAMES: Record<string, string> = {
  ffl: "Fantasy Football",
  fba: "Fantasy Basketball",
};

/** A label for a fantasy sport, or null when it isn't one. */
export function fantasyLabel(sport: string): string | null {
  if (!isFantasySport(sport)) return null;
  const game = sport.slice("fantasy_".length);
  return FANTASY_GAME_NAMES[game] ?? "Fantasy";
}

const REAL_SPORT_LABELS: Record<string, string> = {
  basketball_nba: "NBA",
  basketball_wnba: "WNBA",
  basketball_ncaab: "NCAA Basketball",
  americanfootball_nfl: "NFL",
  americanfootball_ncaaf: "NCAA Football",
  baseball_mlb: "MLB",
  icehockey_nhl: "NHL",
  soccer_epl: "Premier League",
};

/**
 * A human label for any sport key. Fantasy and the common real sports have
 * explicit names; anything else is prettified from its key so an unknown sport
 * still reads sensibly instead of showing the raw "sport_league" string.
 */
export function sportLabel(sport: string): string {
  const fantasy = fantasyLabel(sport);
  if (fantasy) return fantasy;
  if (REAL_SPORT_LABELS[sport]) return REAL_SPORT_LABELS[sport];
  const parts = sport.split("_");
  const suffix = parts.slice(1).join(" ") || sport;
  return suffix
    .split(" ")
    .filter(Boolean)
    .map((word) => (word.length <= 4 ? word.toUpperCase() : word[0].toUpperCase() + word.slice(1)))
    .join(" ");
}

/** A stable local-day key (YYYY-MM-DD) for grouping, or null if the date won't parse. */
export function localDayKey(iso: string): string | null {
  const date = new Date(iso);
  const time = date.getTime();
  if (Number.isNaN(time)) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Every outcome price across every market on the event. */
function eventPrices(event: ZeroproofEvent): number[] {
  return event.markets.flatMap((market) => market.outcomes.map((outcome) => outcome.priceAmerican));
}

/** Whether an event offers a bet matching the odds lens. */
export function matchesOdds(event: ZeroproofEvent, odds: BoardOddsFilter): boolean {
  if (odds === "all") return true;
  const prices = eventPrices(event);
  if (odds === "favorites") return prices.some((price) => price <= FAVORITE_AT);
  if (odds === "underdogs") return prices.some((price) => price >= UNDERDOG_AT);
  // even: at least one price, and none of them a big favourite or a longshot.
  return prices.length > 0 && prices.every((price) => price > FAVORITE_AT && price < UNDERDOG_AT);
}

/** Whether an event passes the type, sport, and odds facets (the temporal filter is separate). */
export function matchesFacets(event: ZeroproofEvent, filters: BoardFilters): boolean {
  const fantasy = isFantasySport(event.sport);
  if (filters.type === "sports" && fantasy) return false;
  if (filters.type === "fantasy" && !fantasy) return false;
  if (filters.sport !== "all" && event.sport !== filters.sport) return false;
  if (!matchesOdds(event, filters.odds)) return false;
  return true;
}

/** The distinct sports present, labeled, real sports before fantasy, each alpha by label. */
export function availableSports(events: ZeroproofEvent[]): { sport: string; label: string }[] {
  const seen = new Map<string, { sport: string; label: string }>();
  for (const event of events) {
    if (!seen.has(event.sport)) {
      seen.set(event.sport, { sport: event.sport, label: sportLabel(event.sport) });
    }
  }
  return [...seen.values()].sort((a, b) => {
    const aFantasy = isFantasySport(a.sport);
    const bFantasy = isFantasySport(b.sport);
    if (aFantasy !== bFantasy) return aFantasy ? 1 : -1;
    return a.label.localeCompare(b.label);
  });
}

/** A whole-day label for a kickoff time in the local zone, e.g. "Sunday, Sep 7". */
export function dayLabel(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

/**
 * The distinct valid days present, ascending by key. The label is built from the
 * event's real instant (not the key) so it stays correct across time zones;
 * events with unparseable dates are dropped.
 */
export function availableDays(events: ZeroproofEvent[]): { key: string; label: string }[] {
  const byKey = new Map<string, string>();
  for (const event of events) {
    const key = localDayKey(event.commenceTime);
    if (key && !byKey.has(key)) byKey.set(key, dayLabel(event.commenceTime));
  }
  return [...byKey.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, label]) => ({ key, label }));
}

/** The horizon/bet context the temporal filter needs, kept explicit so the filter stays pure. */
export interface HorizonContext {
  now: number;
  daysAhead: number;
  dayMs: number;
  betEventIds: Set<string>;
}

/**
 * The events a viewer should see: facets first, then either a specific day (which
 * overrides the horizon and its bet-on bypass) or the rolling horizon (where an
 * event you've bet on is always shown, even past the cutoff). An unparseable date
 * can never land in a day bucket or slip past the horizon.
 */
export function filterBoardEvents(
  events: ZeroproofEvent[],
  filters: BoardFilters,
  ctx: HorizonContext,
): ZeroproofEvent[] {
  return events.filter((event) => {
    if (!matchesFacets(event, filters)) return false;

    if (filters.day !== "all") {
      return localDayKey(event.commenceTime) === filters.day;
    }

    const time = new Date(event.commenceTime).getTime();
    const withinHorizon = !Number.isNaN(time) && time <= ctx.now + ctx.daysAhead * ctx.dayMs;
    return withinHorizon || ctx.betEventIds.has(event.id);
  });
}

/**
 * Whether more facet-matching events sit beyond the current horizon, so a "load
 * more" is worth showing. False in specific-day mode (the horizon doesn't apply).
 */
export function hasMoreBeyondHorizon(
  events: ZeroproofEvent[],
  filters: BoardFilters,
  ctx: HorizonContext,
): boolean {
  if (filters.day !== "all") return false;
  const cutoff = ctx.now + ctx.daysAhead * ctx.dayMs;
  return events.some((event) => {
    if (!matchesFacets(event, filters)) return false;
    if (ctx.betEventIds.has(event.id)) return false;
    const time = new Date(event.commenceTime).getTime();
    return !Number.isNaN(time) && time > cutoff;
  });
}

/** Whether any non-default filter is active — for showing a "clear filters" affordance. */
export function hasActiveFilters(filters: BoardFilters): boolean {
  return (
    filters.type !== "all" ||
    filters.sport !== "all" ||
    filters.day !== "all" ||
    filters.odds !== "all"
  );
}
