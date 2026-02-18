export interface Team {
  id: number;
  full_name: string;
  abbreviation: string;
  city: string;
  conference: string;
  division: string;
  name: string;
}

export interface Player {
  id: number;
  first_name: string;
  last_name: string;
  position: string;
  team?: Team;
}

export interface PlayerStats {
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  games_played: number;
  min: string;
  fgm: number;
  fga: number;
  fg_pct: number;
  ft_pct: number;
  fg3_pct: number;
  turnover: number;
}

// nba/player/stats page types

export type PlayerStatsMap = Record<number, PlayerStats>;

export type SortKey =
  | "name"
  | "pos"
  | "gp"
  | "pts"
  | "reb"
  | "ast"
  | "stl"
  | "blk";

// Player row in Player Stats page
export interface PlayerRow {
  id: number;
  name: string;
  pos: string;
  stats: PlayerStats | null;
  error?: boolean;
}
