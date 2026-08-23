/**
 * The card generator that turns fantasy performances into trading cards.
 *
 * Rarity is relative, not absolute: a player is rated against everyone else in
 * the same week's pool, so "well relative to others" earns a rare or SIR and a
 * quiet week earns a plain card. The engine is pure and sport-agnostic; the
 * ESPN wiring lives in espn-performances.ts.
 */

/** Card tiers, ordered least to most rare. */
export type Rarity = "common" | "uncommon" | "rare" | "sir";

/** Sports the generator knows how to source art for. NBA ships first. */
export type Sport = "nba";

/** One player's scoring line for a single period, the engine's only input. */
export interface PlayerPerformance {
  playerId: number;
  playerName: string;
  /** Fantasy points for the period. Can be zero or negative. */
  points: number;
  /** Scoring period or week label, e.g. "2024-season" or "2024-wk12". */
  periodId: string;
  sport: Sport;
  proTeamId?: number;
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
  /** The period the card came from. */
  subtitle: string;
  imageUrl: string;
  proTeamId?: number;
}

/** Display and pull metadata for each rarity. */
export interface RarityMeta {
  label: string;
  /** Tailwind border/text classes, dark-mode aware. */
  className: string;
  /**
   * Relative pull weight for the future pack-ripping economy. Strictly
   * decreasing by rarity, so an SIR is the hardest card to pull.
   */
  pullWeight: number;
}

export const RARITY_META: Record<Rarity, RarityMeta> = {
  common: {
    label: "Common",
    className:
      "border-neutral-300 text-neutral-600 dark:border-neutral-700 dark:text-neutral-300",
    pullWeight: 60,
  },
  uncommon: {
    label: "Uncommon",
    className:
      "border-emerald-400 text-emerald-700 dark:border-emerald-500 dark:text-emerald-300",
    pullWeight: 25,
  },
  rare: {
    label: "Rare",
    className:
      "border-sky-400 text-sky-700 dark:border-sky-500 dark:text-sky-300",
    pullWeight: 12,
  },
  sir: {
    label: "SIR",
    className:
      "border-amber-400 text-amber-700 dark:border-amber-500 dark:text-amber-300",
    pullWeight: 3,
  },
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
    subtitle: performance.periodId,
    imageUrl: headshotUrl(performance.sport, performance.playerId),
    proTeamId: performance.proTeamId,
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
