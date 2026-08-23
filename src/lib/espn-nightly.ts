/**
 * Orchestrates a nightly slate: find a night's completed games, pull each box
 * score, and turn them into rarity-tiered cards. Thin IO over the tested pure
 * parsers in espn-boxscore.ts and the engine in fantasy-cards.ts.
 */
import { fetchUpstream } from "./upstream";
import { performancesFromLeague, nbaFantasyLeagueUrl } from "./espn-performances";
import { completedEventIds, performancesFromBoxscore } from "./espn-boxscore";
import { generateCards, type GeneratedCard, type Sport } from "./fantasy-cards";

const BASE = "https://site.web.api.espn.com/apis/site/v2/sports/basketball";

/** How many days to walk back looking for the most recent completed slate. */
const LOOKBACK_DAYS = 8;

export function scoreboardUrl(sport: Sport, yyyymmdd: string): string {
  return `${BASE}/${sport}/scoreboard?dates=${yyyymmdd}`;
}

export function summaryUrl(sport: Sport, eventId: string): string {
  return `${BASE}/${sport}/summary?event=${eventId}`;
}

async function fetchJson(url: string): Promise<unknown | null> {
  const result = await fetchUpstream(url, { next: { revalidate: 3600 } });
  if (!result.ok || !result.response.ok) return null;
  try {
    return await result.response.json();
  } catch {
    return null;
  }
}

/** Today and the previous days, as ISO dates, most recent first. */
function recentDates(count: number): string[] {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i),
    );
    return d.toISOString().slice(0, 10);
  });
}

/** The fantasy roster's ESPN player ids, or undefined if the league can't be read. */
async function nbaRosterIds(season: string): Promise<Set<number> | undefined> {
  const league = await fetchJson(nbaFantasyLeagueUrl(season));
  if (!league) return undefined;
  const ids = performancesFromLeague(league, { season }).map((p) => p.playerId);
  return ids.length > 0 ? new Set(ids) : undefined;
}

export interface NightlySlate {
  cards: GeneratedCard[];
  /** The night the cards came from, or null if none was found. */
  date: string | null;
  error: boolean;
}

/**
 * Build the cards for a night. NBA is scoped to the fantasy roster; WNBA (no
 * fantasy game) uses the whole slate. With no `date`, walks back from today to
 * the most recent night that actually produced cards.
 */
export async function loadNightlySlate({
  sport,
  season,
  date,
}: {
  sport: Sport;
  season: string;
  date?: string;
}): Promise<NightlySlate> {
  const rosterIds = sport === "nba" ? await nbaRosterIds(season) : undefined;
  const candidates = date ? [date] : recentDates(LOOKBACK_DAYS);

  for (const day of candidates) {
    const yyyymmdd = day.replace(/-/g, "");
    const eventIds = completedEventIds(await fetchJson(scoreboardUrl(sport, yyyymmdd)));
    if (eventIds.length === 0) continue;

    const summaries = await Promise.all(
      eventIds.map((id) => fetchJson(summaryUrl(sport, id))),
    );
    const performances = summaries.flatMap((s) =>
      s ? performancesFromBoxscore(s, { sport, date: day, rosterIds }) : [],
    );
    if (performances.length === 0) continue;

    return { cards: generateCards(performances), date: day, error: false };
  }

  return { cards: [], date: date ?? null, error: false };
}
