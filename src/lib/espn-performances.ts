/**
 * Adapts an ESPN fantasy league payload into the performances the card
 * generator understands, validating the shape at the boundary so a malformed
 * or unauthorized response degrades to an empty pool rather than a throw.
 */
import { z } from "zod";
import {
  generateCards,
  type GeneratedCard,
  type PlayerPerformance,
  type Sport,
} from "./fantasy-cards";

const statSchema = z.object({
  appliedTotal: z.number(),
  statSourceId: z.number().optional(),
  statSplitTypeId: z.number().optional(),
});

const rosterEntrySchema = z.object({
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
  teams: z
    .array(
      z.object({
        roster: z.object({ entries: z.array(z.unknown()) }).optional(),
      }),
    )
    .optional(),
});

/** An ESPN fantasy league: the game code and the league id to read. */
export interface LeagueConfig {
  /** ESPN game code: fba = men's basketball, wfba = women's basketball. */
  game: string;
  leagueId: number;
}

/**
 * The fantasy leagues this site reads, per sport. The NBA league is public; the
 * WNBA league is private, so reading its roster needs ESPN auth cookies (see
 * espn-nightly.ts) and otherwise degrades to the whole night's public slate.
 */
export const FANTASY_LEAGUES: Record<Sport, LeagueConfig> = {
  nba: { game: "fba", leagueId: 449389534 },
  wnba: { game: "wfba", leagueId: 886603882 },
  nfl: { game: "ffl", leagueId: 836777691 },
};

/** The ESPN read endpoint for a league's teams, rosters, and settings. */
export function fantasyLeagueUrl(sport: Sport, season: string): string {
  const { game, leagueId } = FANTASY_LEAGUES[sport];
  return `https://lm-api-reads.fantasy.espn.com/apis/v3/games/${game}/seasons/${season}/segments/0/leagues/${leagueId}?view=mTeam&view=mRoster&view=mSettings`;
}

/** The NBA league url, kept for the season Card Lab route. */
export function nbaFantasyLeagueUrl(season: string): string {
  return fantasyLeagueUrl("nba", season);
}

type Stat = z.infer<typeof statSchema>;

/**
 * The player's real season total. ESPN carries both a projection
 * (statSourceId 1) and the actual (statSourceId 0); prefer the actual season
 * split, then any actual, then whatever's first, then zero.
 */
function actualSeasonPoints(stats: Stat[] | undefined): number {
  if (!stats || stats.length === 0) return 0;
  const actualSeason = stats.find(
    (s) => s.statSourceId === 0 && s.statSplitTypeId === 0,
  );
  const actual = actualSeason ?? stats.find((s) => s.statSourceId === 0);
  return (actual ?? stats[0]).appliedTotal;
}

/** Flatten every rostered player in the league into a performance. */
export function performancesFromLeague(
  payload: unknown,
  { season }: { season: string },
): PlayerPerformance[] {
  const league = leagueSchema.safeParse(payload);
  if (!league.success) return [];

  const performances: PlayerPerformance[] = [];
  for (const team of league.data.teams ?? []) {
    for (const raw of team.roster?.entries ?? []) {
      const parsed = rosterEntrySchema.safeParse(raw);
      if (!parsed.success) continue;
      const player = parsed.data.playerPoolEntry.player;
      performances.push({
        playerId: player.id,
        playerName: player.fullName,
        points: actualSeasonPoints(player.stats),
        periodId: `${season}-season`,
        sport: "nba",
        proTeamId: player.proTeamId,
      });
    }
  }
  return performances;
}

/** Convenience: league payload straight to generated cards. */
export function cardsFromLeaguePayload(
  payload: unknown,
  opts: { season: string },
): GeneratedCard[] {
  return generateCards(performancesFromLeague(payload, opts));
}
