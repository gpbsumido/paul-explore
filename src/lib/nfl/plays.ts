/**
 * NFL scoring plays, read from ESPN's public site API (a different surface
 * from the fantasy league endpoint) and tagged back to whichever rostered
 * starter they mention. No fantasy-point field exists on a play, so this
 * carries the real play text rather than a computed delta.
 */
import { z } from "zod";
import type { NflPlayAttribution, NflScoringPlay } from "@/types/espn-nfl";

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

export interface RosterName {
  name: string;
  fantasyTeamName: string;
}

/**
 * Tags each play with every rostered starter whose exact name appears in its
 * text, and drops plays that mention nobody rostered -- a scoring play only
 * belongs on this ticker if it moved one of these fantasy teams' scores.
 */
export function attributePlays(
  plays: NflScoringPlay[],
  roster: RosterName[],
): NflPlayAttribution[] {
  const attributed: NflPlayAttribution[] = [];
  for (const play of plays) {
    const mentions = roster
      .filter((r) => play.text.includes(r.name))
      .map((r) => ({ playerName: r.name, fantasyTeamName: r.fantasyTeamName }));
    if (mentions.length > 0) attributed.push({ play, mentions });
  }
  return attributed;
}
