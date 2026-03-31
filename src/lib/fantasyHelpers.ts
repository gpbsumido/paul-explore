import type { PlayerStats } from "@/types/nba";

/**
 * Approximate NBA per-game averages for the 2024-25 season.
 * Used to normalize player stats to a 0-100 scale for radar charts.
 */
export const LEAGUE_AVERAGES: Record<string, number> = {
  pts: 14.0,
  reb: 5.4,
  ast: 3.2,
  stl: 0.8,
  blk: 0.5,
  fg_pct: 0.46,
};

export interface NormalizedStats {
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  fg_pct: number;
}

/**
 * Normalize a player's stats to a 0-100 scale where 100 = 2x league average.
 * Caps at 100 so the radar chart doesn't distort for extreme outliers.
 */
export function normalizeStats(
  stats: PlayerStats,
  averages: Record<string, number> = LEAGUE_AVERAGES,
): NormalizedStats {
  function norm(val: number, key: string): number {
    const avg = averages[key] ?? 1;
    return Math.min(100, Math.round((val / (avg * 2)) * 100));
  }

  return {
    pts: norm(stats.pts, "pts"),
    reb: norm(stats.reb, "reb"),
    ast: norm(stats.ast, "ast"),
    stl: norm(stats.stl, "stl"),
    blk: norm(stats.blk, "blk"),
    fg_pct: norm(stats.fg_pct, "fg_pct"),
  };
}

/** Quick tier label based on scoring output. */
export function getPlayerTier(avgPts: number): "elite" | "solid" | "bench" {
  if (avgPts > 25) return "elite";
  if (avgPts >= 15) return "solid";
  return "bench";
}
