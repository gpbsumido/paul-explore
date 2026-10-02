/**
 * NFL scoring plays, read from ESPN's public site API (a different surface
 * from the fantasy league endpoint) and tagged back to whichever rostered
 * starter they mention. No fantasy-point field exists on a play, so this
 * carries the real play text rather than a computed delta.
 */
import { z } from "zod";
import type {
  NflMatchup,
  NflPlayAttribution,
  NflScoringPlay,
} from "@/types/espn-nfl";

const competitorSchema = z.object({
  team: z.object({ abbreviation: z.string() }),
});

const eventSchema = z.object({
  id: z.string(),
  competitions: z.array(z.object({ competitors: z.array(competitorSchema) })),
});

const scoreboardSchema = z.object({ events: z.array(eventSchema).optional() });

/** Every team abbreviation playing this week, mapped to its ESPN event id. */
export function eventIdsByAbbrev(payload: unknown): Map<string, string> {
  const map = new Map<string, string>();
  const parsed = scoreboardSchema.safeParse(payload);
  if (!parsed.success) return map;

  for (const event of parsed.data.events ?? []) {
    for (const competitor of event.competitions[0]?.competitors ?? []) {
      map.set(competitor.team.abbreviation, event.id);
    }
  }
  return map;
}

const scoringPlaySchema = z.object({
  id: z.string(),
  text: z.string(),
  team: z.object({ abbreviation: z.string() }).optional(),
  period: z.object({ number: z.number() }).optional(),
  clock: z.object({ displayValue: z.string() }).optional(),
  scoringType: z.object({ abbreviation: z.string() }).optional(),
  awayScore: z.number().optional(),
  homeScore: z.number().optional(),
});

const summarySchema = z.object({
  scoringPlays: z.array(scoringPlaySchema).optional(),
});

/** Parse one game's scoring plays out of an ESPN summary payload. */
export function parseScoringPlays(payload: unknown): NflScoringPlay[] {
  const parsed = summarySchema.safeParse(payload);
  if (!parsed.success) return [];

  return (parsed.data.scoringPlays ?? []).map((play) => ({
    id: play.id,
    text: play.text,
    teamAbbrev: play.team?.abbreviation ?? "",
    period: play.period?.number ?? 0,
    clock: play.clock?.displayValue ?? "",
    scoringType: play.scoringType?.abbreviation ?? "",
    awayScore: play.awayScore ?? 0,
    homeScore: play.homeScore ?? 0,
  }));
}

/** A starter in one of the week's matchups, with what the ticker filters on. */
export interface RosterStarter {
  playerId: number;
  name: string;
  positionId: number;
  fantasyTeamId: number;
  fantasyTeamName: string;
  matchupId: number;
}

/** Every starter across the week's matchups, tagged with team and matchup. */
export function rosterStarters(matchups: NflMatchup[]): RosterStarter[] {
  return matchups.flatMap((m) =>
    [m.away, m.home].flatMap((side) =>
      side.starters.map((p) => ({
        playerId: p.playerId,
        name: p.name,
        positionId: p.positionId,
        fantasyTeamId: side.teamId,
        fantasyTeamName: side.name,
        matchupId: m.id,
      })),
    ),
  );
}

/**
 * Tags each play with every rostered starter whose exact name appears in its
 * text, and drops plays that mention nobody rostered -- a scoring play only
 * belongs on this ticker if it moved one of these fantasy teams' scores.
 */
export function attributePlays(
  plays: NflScoringPlay[],
  roster: RosterStarter[],
): NflPlayAttribution[] {
  const attributed: NflPlayAttribution[] = [];
  for (const play of plays) {
    const mentions = roster
      .filter((r) => play.text.includes(r.name))
      .map(({ name, ...rest }) => ({ ...rest, playerName: name }));
    if (mentions.length > 0) attributed.push({ play, mentions });
  }
  return attributed;
}

/** Ticker filters; an unset key doesn't filter. */
export interface PlayFilters {
  positionId?: number;
  scoringType?: string;
  nflTeam?: string;
  fantasyTeamId?: number;
  matchupId?: number;
}

/**
 * The plays that pass every set filter. Score type and NFL team belong to the
 * play; position, fantasy team and matchup belong to a mentioned starter, and
 * one starter has to satisfy all three -- a QB filter plus a team filter means
 * that team's QB, not any QB on a play that also mentions that team.
 */
export function filterPlays(
  plays: NflPlayAttribution[],
  filters: PlayFilters,
): NflPlayAttribution[] {
  return plays.filter(({ play, mentions }) => {
    if (filters.scoringType !== undefined && play.scoringType !== filters.scoringType) return false;
    if (filters.nflTeam !== undefined && play.teamAbbrev !== filters.nflTeam) return false;
    return mentions.some(
      (m) =>
        (filters.positionId === undefined || m.positionId === filters.positionId) &&
        (filters.fantasyTeamId === undefined || m.fantasyTeamId === filters.fantasyTeamId) &&
        (filters.matchupId === undefined || m.matchupId === filters.matchupId),
    );
  });
}

/** The positions, score types and NFL teams that actually appear, sorted. */
export function playFilterOptions(plays: NflPlayAttribution[]): {
  positionIds: number[];
  scoringTypes: string[];
  nflTeams: string[];
} {
  const positions = new Set(plays.flatMap((p) => p.mentions.map((m) => m.positionId)));
  const types = new Set(plays.map((p) => p.play.scoringType).filter(Boolean));
  const teams = new Set(plays.map((p) => p.play.teamAbbrev).filter(Boolean));
  return {
    positionIds: [...positions].sort((a, b) => a - b),
    scoringTypes: [...types].sort(),
    nflTeams: [...teams].sort(),
  };
}
