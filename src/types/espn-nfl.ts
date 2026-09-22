/**
 * Normalized shapes for the ESPN fantasy football matchups feature. NFL is
 * points-based and weekly, so unlike the NBA category types these carry a
 * per-player actual and projected point line for a single scoring period.
 */

/** ESPN default position ids for football, mapped to display labels. */
export const ESPN_NFL_POSITION: Record<number, string> = {
  1: "QB",
  2: "RB",
  3: "WR",
  4: "TE",
  5: "K",
  16: "D/ST",
};

/** ESPN lineup slot ids that sit off the active lineup. */
export const NFL_BENCH_SLOTS = new Set<number>([20, 21]);

/** Lineup slot ids to short labels, for the roster breakdown. */
export const ESPN_NFL_SLOT: Record<number, string> = {
  0: "QB",
  2: "RB",
  4: "WR",
  6: "TE",
  16: "D/ST",
  17: "K",
  23: "FLEX",
  20: "BE",
  21: "IR",
};

/** One player's week: their actual and projected fantasy points. */
export interface NflPlayerLine {
  playerId: number;
  name: string;
  proTeamId: number;
  positionId: number;
  lineupSlotId: number;
  actual: number;
  projected: number;
  started: boolean;
}

/** One team's side of a matchup for a given week. */
export interface NflMatchupSide {
  teamId: number;
  name: string;
  abbrev: string;
  ownerName: string;
  /** Points scored so far this week (ESPN's authoritative total). */
  totalPoints: number;
  /** Projected points still to come from starters who haven't finished. */
  remaining: number;
  starters: NflPlayerLine[];
  bench: NflPlayerLine[];
}

/** A single head-to-head matchup for a week. */
export interface NflMatchup {
  id: number;
  matchupPeriodId: number;
  winner: string;
  away: NflMatchupSide;
  home: NflMatchupSide;
}

/** The scoreboard for one week, plus the bounds needed to drive the selector. */
export interface NflScoreboard {
  season: number;
  currentWeek: number;
  regularSeasonWeeks: number;
  totalWeeks: number;
  matchups: NflMatchup[];
}
