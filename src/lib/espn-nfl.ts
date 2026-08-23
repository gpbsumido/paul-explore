/**
 * NFL is weekly, and its meaningful metric is fantasy points, which the public
 * box score doesn't carry — so unlike basketball, NFL reads the fantasy league
 * itself at a given scoring period (week). Pure parsers plus a thin loader that
 * finds the most recent week with results, reaching back through the season.
 */
import { z } from "zod";
import { fetchUpstream } from "./upstream";
import { FANTASY_LEAGUES } from "./espn-performances";
import { generateCards, type GeneratedCard, type PlayerPerformance } from "./fantasy-cards";

const statSchema = z.object({
  scoringPeriodId: z.number().optional(),
  statSourceId: z.number().optional(),
  statSplitTypeId: z.number().optional(),
  appliedTotal: z.number().optional(),
});

const entrySchema = z.object({
  playerPoolEntry: z.object({
    player: z.object({
      id: z.number(),
      fullName: z.string().min(1),
      proTeamId: z.number().optional(),
      stats: z.array(statSchema).optional(),
    }),
  }),
});

const leagueSchema = z.object({
  status: z.object({ latestScoringPeriod: z.number().optional() }).optional(),
  teams: z
    .array(
      z.object({
        name: z.string().optional(),
        roster: z.object({ entries: z.array(z.unknown()) }).optional(),
      }),
    )
    .optional(),
});

/** The latest scoring period (week) the league reports, or null. */
export function latestScoringPeriod(payload: unknown): number | null {
  const parsed = leagueSchema.safeParse(payload);
  return parsed.success ? (parsed.data.status?.latestScoringPeriod ?? null) : null;
}

/**
 * Each rostered player's actual fantasy points for a given week. A player with
 * no actual line that week (bye/inactive) is skipped rather than shown as a zero.
 */
export function performancesFromWeek(
  payload: unknown,
  { season, week }: { season: string; week: number },
): PlayerPerformance[] {
  const league = leagueSchema.safeParse(payload);
  if (!league.success) return [];

  const performances: PlayerPerformance[] = [];
  for (const team of league.data.teams ?? []) {
    for (const raw of team.roster?.entries ?? []) {
      const parsed = entrySchema.safeParse(raw);
      if (!parsed.success) continue;
      const player = parsed.data.playerPoolEntry.player;
      const actual = player.stats?.find(
        (s) => s.statSourceId === 0 && s.scoringPeriodId === week && typeof s.appliedTotal === "number",
      );
      if (!actual || actual.appliedTotal === undefined) continue;
      performances.push({
        playerId: player.id,
        playerName: player.fullName,
        points: actual.appliedTotal,
        periodId: `${season}-wk${week}`,
        sport: "nfl",
        proTeamId: player.proTeamId,
        rosteredBy: team.name || undefined,
      });
    }
  }
  return performances;
}

/** How far back to step looking for a played week. */
const MAX_WEEK_STEPS = 6;

function weekUrl(season: string, week: number): string {
  const { game, leagueId } = FANTASY_LEAGUES.nfl;
  return `https://lm-api-reads.fantasy.espn.com/apis/v3/games/${game}/seasons/${season}/segments/0/leagues/${leagueId}?view=mRoster&view=mSettings&scoringPeriodId=${week}`;
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

export interface WeeklySlate {
  cards: GeneratedCard[];
  /** The week the cards came from, or null if none was found. */
  week: number | null;
  /** The latest week the league has, so the UI can offer every week. */
  latestWeek: number | null;
  error: boolean;
}

/**
 * Cards for an NFL week. A specific `week` is shown as asked (so the picker can
 * reach every week); with no `week`, starts at the league's latest scoring
 * period and steps back to the most recent week that actually has results.
 */
export async function loadNflWeek({
  season,
  week,
}: {
  season: string;
  week?: number;
}): Promise<WeeklySlate> {
  // One fetch tells us the latest week (status rides on any week's response).
  const probe = await fetchJson(weekUrl(season, week ?? 1));
  const latest = latestScoringPeriod(probe) ?? week ?? 1;

  if (week !== undefined) {
    if (!probe) return { cards: [], week, latestWeek: latest, error: true };
    const cards = generateCards(performancesFromWeek(probe, { season, week }));
    return { cards, week, latestWeek: latest, error: false };
  }

  for (let w = latest, steps = 0; w >= 1 && steps < MAX_WEEK_STEPS; w--, steps++) {
    const payload = await fetchJson(weekUrl(season, w));
    if (!payload) continue;
    const cards = generateCards(performancesFromWeek(payload, { season, week: w }));
    if (cards.length > 0) return { cards, week: w, latestWeek: latest, error: false };
  }
  return { cards: [], week: null, latestWeek: latest, error: false };
}
