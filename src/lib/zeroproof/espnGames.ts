/**
 * The ESPN fantasy games a league can be added for, keyed by ESPN's own game
 * code. The add forms, the league page and the board labels all read this one
 * list, so a new sport only has to be added here.
 */
export const ESPN_GAMES = [
  { code: "ffl", sport: "Football" },
  { code: "fba", sport: "Basketball" },
  { code: "flb", sport: "Baseball" },
  { code: "fhl", sport: "Hockey" },
] as const;

/** The sport name for an ESPN game code, or null for a code not in the list. */
export function espnGameSport(code: string): string | null {
  return ESPN_GAMES.find((game) => game.code === code)?.sport ?? null;
}
