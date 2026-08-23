/**
 * Orchestrates a nightly slate: find a night's completed games, pull each box
 * score, and turn them into rarity-tiered cards. Thin IO over the tested pure
 * parsers in espn-boxscore.ts and the engine in fantasy-cards.ts.
 */
import { fetchUpstream } from "./upstream";
import { rostersByPlayer, fantasyLeagueUrl } from "./espn-performances";
import { latestCompletedSlate, performancesFromBoxscore } from "./espn-boxscore";
import { generateCards, type GeneratedCard, type Sport } from "./fantasy-cards";

const BASE = "https://site.web.api.espn.com/apis/site/v2/sports/basketball";

/**
 * Nightly discovery scans date-range windows back from today until it finds a
 * completed slate — so it reaches into previous seasons when the current one is
 * out of season, which is the whole point of "use prev history".
 */
const WINDOW_DAYS = 12;
const MAX_WINDOWS = 45;

export function scoreboardUrl(sport: Sport, yyyymmdd: string): string {
  return `${BASE}/${sport}/scoreboard?dates=${yyyymmdd}`;
}

export function summaryUrl(sport: Sport, eventId: string): string {
  return `${BASE}/${sport}/summary?event=${eventId}`;
}

async function fetchJson(
  url: string,
  headers?: Record<string, string>,
): Promise<unknown | null> {
  const result = await fetchUpstream(url, { next: { revalidate: 3600 }, headers });
  if (!result.ok || !result.response.ok) return null;
  try {
    return await result.response.json();
  } catch {
    return null;
  }
}

/**
 * The ESPN auth cookie for reading a private fantasy league, from env. Both
 * `ESPN_S2` and `ESPN_SWID` must be set; the values never leave the server.
 * Returns undefined when unset, so a private league simply degrades to the
 * public slate rather than erroring.
 */
function espnAuthHeaders(): Record<string, string> | undefined {
  const s2 = process.env.ESPN_S2;
  const swid = process.env.ESPN_SWID;
  if (!s2 || !swid) return undefined;
  return { Cookie: `espn_s2=${s2}; SWID=${swid}` };
}

/** A UTC date `n` days before today. */
function daysAgo(n: number): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - n));
}

/** "YYYYMMDD" for an ESPN scoreboard date param. */
function ymd(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

/** Date-range windows back from today, most recent first, for scoreboard scans. */
function rangeWindows(): string[] {
  return Array.from({ length: MAX_WINDOWS }, (_, i) => {
    const end = daysAgo(i * WINDOW_DAYS);
    const start = daysAgo((i + 1) * WINDOW_DAYS - 1);
    return `${ymd(start)}-${ymd(end)}`;
  });
}

/** Fetch a slate's box scores and turn them into cards. */
async function slateToCards(
  sport: Sport,
  date: string,
  eventIds: string[],
  roster: Map<number, string> | undefined,
): Promise<GeneratedCard[]> {
  const summaries = await Promise.all(
    eventIds.map((id) => fetchJson(summaryUrl(sport, id))),
  );
  const performances = summaries.flatMap((s) =>
    s ? performancesFromBoxscore(s, { sport, date, roster }) : [],
  );
  return generateCards(performances);
}

/** The season id to read a sport's league roster from. */
function rosterSeason(sport: Sport, fallback: string): string {
  // The WNBA season runs inside one calendar year; the NBA route already passes
  // a season, so keep using it.
  return sport === "wnba" ? String(new Date().getUTCFullYear()) : fallback;
}

/**
 * Map of the fantasy roster's ESPN player ids → owning team name, or undefined
 * if the league can't be read (public NBA league down, or private WNBA league
 * without cookies) — in which case the caller shows the whole slate instead.
 */
async function rosterMap(sport: Sport, season: string): Promise<Map<number, string> | undefined> {
  const league = await fetchJson(
    fantasyLeagueUrl(sport, rosterSeason(sport, season)),
    espnAuthHeaders(),
  );
  if (!league) return undefined;
  const map = rostersByPlayer(league);
  return map.size > 0 ? map : undefined;
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
  const roster = await rosterMap(sport, season);

  // An explicit date: read just that day.
  if (date) {
    const slate = latestCompletedSlate(await fetchJson(scoreboardUrl(sport, date.replace(/-/g, ""))));
    if (!slate) return { cards: [], date, error: false };
    return { cards: await slateToCards(sport, slate.date, slate.eventIds, roster), date: slate.date, error: false };
  }

  // Otherwise scan windows back through history for the most recent slate that
  // yields cards (in season that's last night; out of season, last season).
  for (const window of rangeWindows()) {
    const slate = latestCompletedSlate(await fetchJson(scoreboardUrl(sport, window)));
    if (!slate) continue;
    const cards = await slateToCards(sport, slate.date, slate.eventIds, roster);
    if (cards.length === 0) continue;
    return { cards, date: slate.date, error: false };
  }

  return { cards: [], date: null, error: false };
}
