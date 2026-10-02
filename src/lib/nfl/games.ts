/**
 * How much of each NFL team's game is still to play this week, read from
 * ESPN's public scoreboard. A fantasy projection is a whole-game number, so
 * this is the share of it a starter can still earn: all of it before kickoff,
 * none of it once the game is final, and the clock's share in between.
 */
import { z } from "zod";

/** Seconds in a regulation quarter and a regulation game. */
const QUARTER_SECONDS = 900;
const GAME_SECONDS = 3600;

const eventSchema = z.object({
  status: z.object({
    clock: z.number().optional(),
    period: z.number().optional(),
    type: z.object({ state: z.string() }),
  }),
  competitions: z.array(
    z.object({
      competitors: z.array(
        z.object({ team: z.object({ abbreviation: z.string() }) }),
      ),
    }),
  ),
});

const scoreboardSchema = z.object({ events: z.array(z.unknown()).optional() });

type GameStatus = z.infer<typeof eventSchema>["status"];

/** The share of a game left, 0..1. Overtime counts as over, it's sudden death. */
function shareLeft(status: GameStatus): number {
  if (status.type.state === "pre") return 1;
  if (status.type.state !== "in") return 0;

  const period = status.period ?? 0;
  if (period > 4) return 0;
  const secondsLeft = (4 - period) * QUARTER_SECONDS + (status.clock ?? 0);
  return Math.min(1, Math.max(0, secondsLeft / GAME_SECONDS));
}

/**
 * Every team on the week's scoreboard mapped to the share of its game still
 * to play. A team that's missing (a bye) has no game, so callers treat a
 * missing key as nothing left.
 */
export function parseGameProgress(payload: unknown): Record<string, number> {
  const parsed = scoreboardSchema.safeParse(payload);
  if (!parsed.success) return {};

  const progress: Record<string, number> = {};
  for (const raw of parsed.data.events ?? []) {
    const event = eventSchema.safeParse(raw);
    if (!event.success) continue;
    const left = shareLeft(event.data.status);
    for (const competitor of event.data.competitions[0]?.competitors ?? []) {
      progress[competitor.team.abbreviation] = left;
    }
  }
  return progress;
}
