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

/**
 * ESPN proTeamId -> team abbreviation. Verified against the public site API's
 * team list and cross-checked against a real rostered player (id 4 = CIN,
 * matching a Bengals player's proTeamId in a live payload) -- the fantasy
 * payload and the public site API use the same numbering for NFL.
 */
export const NFL_PRO_TEAM_ABBREV: Record<number, string> = {
  1: "ATL",
  2: "BUF",
  3: "CHI",
  4: "CIN",
  5: "CLE",
  6: "DAL",
  7: "DEN",
  8: "DET",
  9: "GB",
  10: "TEN",
  11: "IND",
  12: "KC",
  13: "LV",
  14: "LAR",
  15: "MIA",
  16: "MIN",
  17: "NE",
  18: "NO",
  19: "NYG",
  20: "NYJ",
  21: "PHI",
  22: "ARI",
  23: "PIT",
  24: "LAC",
  25: "SF",
  26: "SEA",
  27: "TB",
  28: "WSH",
  29: "CAR",
  30: "JAX",
  33: "BAL",
  34: "HOU",
};

/** One scoring play from an NFL game's public summary, as ESPN describes it. */
export interface NflScoringPlay {
  id: string;
  text: string;
  teamAbbrev: string;
  period: number;
  clock: string;
  scoringType: string;
  awayScore: number;
  homeScore: number;
}

/** A scoring play tagged with every rostered starter it mentions. */
export interface NflPlayAttribution {
  play: NflScoringPlay;
  mentions: { playerName: string; fantasyTeamName: string }[];
}
