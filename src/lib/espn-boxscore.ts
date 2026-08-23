/**
 * Parses ESPN public box scores into nightly performances the card engine can
 * use. Pure and defensive: a malformed payload yields an empty list, never a
 * throw. Points live at different columns per sport (NBA 13, WNBA 1), so the
 * column is always resolved by name, never hardcoded.
 */
import { z } from "zod";
import type { PlayerPerformance, Sport } from "./fantasy-cards";

/** The index of the points column in a box-score stat block, or -1. */
export function pointsIndex(keys: readonly string[]): number {
  return keys.indexOf("points");
}

const scoreboardSchema = z.object({
  events: z.array(
    z.object({
      id: z.string(),
      date: z.string().optional(),
      status: z.object({ type: z.object({ state: z.string() }) }),
    }),
  ),
});

/** Ids of the games on a scoreboard that have finished (state === "post"). */
export function completedEventIds(scoreboard: unknown): string[] {
  const parsed = scoreboardSchema.safeParse(scoreboard);
  if (!parsed.success) return [];
  return parsed.data.events
    .filter((e) => e.status.type.state === "post")
    .map((e) => e.id);
}

/**
 * The most recent date on a scoreboard (which may span a range) that has any
 * completed games, plus that date's event ids. This is how the nightly view
 * reaches back into previous seasons: query a wide date range, take the latest
 * finished slate. Returns null when nothing has finished.
 */
export function latestCompletedSlate(
  scoreboard: unknown,
): { date: string; eventIds: string[] } | null {
  const parsed = scoreboardSchema.safeParse(scoreboard);
  if (!parsed.success) return null;

  const byDate = new Map<string, string[]>();
  for (const e of parsed.data.events) {
    if (e.status.type.state !== "post" || !e.date) continue;
    const day = e.date.slice(0, 10);
    byDate.set(day, [...(byDate.get(day) ?? []), e.id]);
  }
  if (byDate.size === 0) return null;

  const date = [...byDate.keys()].sort().at(-1) as string;
  return { date, eventIds: byDate.get(date) ?? [] };
}

const competitorSchema = z.object({
  id: z.string(),
  homeAway: z.string(),
  winner: z.boolean().optional(),
  team: z.object({ abbreviation: z.string() }),
});

const athleteSchema = z.object({
  athlete: z.object({ id: z.string(), displayName: z.string() }),
  didNotPlay: z.boolean().optional(),
  stats: z.array(z.string()),
});

const teamPlayersSchema = z.object({
  team: z.object({ id: z.string() }),
  statistics: z.array(
    z.object({ keys: z.array(z.string()), athletes: z.array(athleteSchema) }),
  ),
});

const summarySchema = z.object({
  header: z.object({
    season: z.object({ type: z.number().optional() }).optional(),
    competitions: z.array(z.object({ competitors: z.array(competitorSchema) })),
  }),
  boxscore: z.object({ players: z.array(teamPlayersSchema) }),
});

/** ESPN season types that count as postseason (3 = playoffs, 5 = play-in). */
const PLAYOFF_SEASON_TYPES = new Set([3, 5]);

/**
 * Every player's line from one game's box score, as performances for `date`,
 * with the boost signals the card engine reads: whether the team won, whether
 * it was a playoff game, and (from `roster`) which fantasy team owns the player.
 * Pass `roster` (playerId → fantasy team name) to keep only rostered players
 * (NBA); omit it to keep everyone (WNBA, the whole slate).
 */
export function performancesFromBoxscore(
  summary: unknown,
  { sport, date, roster }: { sport: Sport; date: string; roster?: ReadonlyMap<number, string> },
): PlayerPerformance[] {
  const parsed = summarySchema.safeParse(summary);
  if (!parsed.success) return [];

  const competition = parsed.data.header.competitions[0];
  const competitors = competition?.competitors ?? [];
  const playoff = PLAYOFF_SEASON_TYPES.has(parsed.data.header.season?.type ?? 0);
  const byTeamId = new Map(
    competitors.map((c) => [
      c.id,
      { home: c.homeAway === "home", abbrev: c.team.abbreviation, won: c.winner === true },
    ]),
  );

  const performances: PlayerPerformance[] = [];
  for (const teamBlock of parsed.data.boxscore.players) {
    const mine = byTeamId.get(teamBlock.team.id);
    const opponent = competitors.find((c) => c.id !== teamBlock.team.id)?.team.abbreviation;
    if (!mine || !opponent) continue;

    const block = teamBlock.statistics[0];
    if (!block) continue;
    const idx = pointsIndex(block.keys);
    if (idx < 0) continue;

    for (const line of block.athletes) {
      if (line.didNotPlay) continue;
      const playerId = Number(line.athlete.id);
      if (roster && !roster.has(playerId)) continue;
      const points = Number(line.stats[idx]);
      if (!Number.isFinite(points)) continue;
      performances.push({
        playerId,
        playerName: line.athlete.displayName,
        points,
        periodId: date,
        sport,
        opponent,
        home: mine.home,
        wonGame: mine.won,
        playoff,
        rosteredBy: roster?.get(playerId) || undefined,
      });
    }
  }
  return performances;
}
