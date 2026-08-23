/**
 * The card generator that turns fantasy performances into trading cards.
 *
 * Rarity is relative, not absolute: a player is rated against everyone else in
 * the same week's pool, so "well relative to others" earns a rare or SIR and a
 * quiet week earns a plain card. The engine is pure and sport-agnostic; the
 * ESPN wiring lives in espn-performances.ts.
 */
import { ACCENT_BAND } from "./accentBand";

/** Card tiers, ordered least to most rare. */
export type Rarity = "common" | "uncommon" | "rare" | "sir";

/** Sports the generator knows how to source art for. */
export type Sport = "nba" | "wnba";

/** One player's scoring line for a single period, the engine's only input. */
export interface PlayerPerformance {
  playerId: number;
  playerName: string;
  /** Points for the period. Can be zero or negative. */
  points: number;
  /** Period id, e.g. "2024-season" (season) or "2026-04-17" (a single night). */
  periodId: string;
  sport: Sport;
  proTeamId?: number;
  /** Opponent abbreviation for a nightly card, e.g. "PHX". Absent for season cards. */
  opponent?: string;
  /** Whether the game was at home. Only meaningful alongside `opponent`. */
  home?: boolean;
}

/** A generated card, ready to render. */
export interface GeneratedCard {
  /** Deterministic: `${sport}-${playerId}-${periodId}`, so generation is idempotent. */
  id: string;
  playerId: number;
  playerName: string;
  points: number;
  periodId: string;
  sport: Sport;
  rarity: Rarity;
  /** Display heading, e.g. "Victor Wembanyama · 50 PTS". */
  title: string;
  /** Where the card came from: "Apr 17 vs PHX" nightly, or "2025 season". */
  subtitle: string;
  imageUrl: string;
  proTeamId?: number;
  opponent?: string;
  home?: boolean;
}

/** Display and pull metadata for each rarity. */
export interface RarityMeta {
  label: string;
  /**
   * Accent colour for the card border and rarity badge, applied inline. A theme-
   * neutral CSS colour (an in-band accent, or a token var), rarer tiers warmer.
   */
  color: string;
  /**
   * Relative pull weight for the future pack-ripping economy. Strictly
   * decreasing by rarity, so an SIR is the hardest card to pull.
   */
  pullWeight: number;
}

export const RARITY_META: Record<Rarity, RarityMeta> = {
  common: { label: "Common", color: "var(--color-muted)", pullWeight: 60 },
  uncommon: { label: "Uncommon", color: ACCENT_BAND.sea, pullWeight: 25 },
  rare: { label: "Rare", color: ACCENT_BAND.azure, pullWeight: 12 },
  sir: { label: "SIR", color: ACCENT_BAND.gold, pullWeight: 3 },
};

/** Percentile above which a performance earns each tier. */
const SIR_AT = 0.95;
const RARE_AT = 0.8;
const UNCOMMON_AT = 0.5;

/** Below this pool size there aren't enough peers to justify an SIR. */
const MIN_POOL_FOR_SIR = 4;

/**
 * The ESPN headshot for a player. `a.espncdn.com` is allowlisted in the CSP,
 * so these render without a policy change.
 */
export function headshotUrl(sport: Sport, playerId: number): string {
  return `https://a.espncdn.com/i/headshots/${sport}/players/full/${playerId}.png`;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * Turn an ISO date ("2026-04-17") into a short label ("Apr 17"). Anything that
 * isn't a plain YYYY-MM-DD is returned unchanged, so a season id passes through.
 * Pure, so it stays deterministic and testable without a Date.
 */
export function prettyGameDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  const month = MONTHS[Number(match[2]) - 1];
  if (!month) return iso;
  return `${month} ${Number(match[3])}`;
}

/** "Apr 17 vs PHX" / "Apr 17 @ PHX" for a nightly card, else "2025 season". */
function subtitleFor(performance: PlayerPerformance): string {
  if (performance.opponent) {
    const at = performance.home ? "vs" : "@";
    return `${prettyGameDate(performance.periodId)} ${at} ${performance.opponent}`;
  }
  return performance.periodId.replace(/-season$/, " season");
}

/**
 * Rarity for one performance given its percentile within the pool. A zero or
 * negative outing never beats common, and a shallow pool can't mint an SIR.
 */
function rarityFor(points: number, percentile: number, poolSize: number): Rarity {
  if (points <= 0) return "common";
  const tier: Rarity =
    percentile >= SIR_AT
      ? "sir"
      : percentile >= RARE_AT
        ? "rare"
        : percentile >= UNCOMMON_AT
          ? "uncommon"
          : "common";
  return tier === "sir" && poolSize < MIN_POOL_FOR_SIR ? "rare" : tier;
}

function toCard(performance: PlayerPerformance, rarity: Rarity): GeneratedCard {
  return {
    id: `${performance.sport}-${performance.playerId}-${performance.periodId}`,
    playerId: performance.playerId,
    playerName: performance.playerName,
    points: performance.points,
    periodId: performance.periodId,
    sport: performance.sport,
    rarity,
    title: `${performance.playerName} · ${Math.round(performance.points)} PTS`,
    subtitle: subtitleFor(performance),
    imageUrl: headshotUrl(performance.sport, performance.playerId),
    proTeamId: performance.proTeamId,
    opponent: performance.opponent,
    home: performance.home,
  };
}

/**
 * Turn a pool of performances into cards, rarity assigned by how each player
 * did relative to the rest of the pool. Cards come back rarest performance
 * first. Tied performances get the same rarity, and an empty pool yields none.
 */
export function generateCards(
  performances: readonly PlayerPerformance[],
): GeneratedCard[] {
  const poolSize = performances.length;
  if (poolSize === 0) return [];

  const allPoints = performances.map((p) => p.points);

  return performances
    .map((performance) => {
      const below = allPoints.filter((x) => x < performance.points).length;
      const percentile = poolSize > 1 ? below / (poolSize - 1) : 1;
      return toCard(performance, rarityFor(performance.points, percentile, poolSize));
    })
    .sort((a, b) => b.points - a.points || a.playerId - b.playerId);
}
