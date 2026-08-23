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
export type Sport = "nba" | "wnba" | "nfl";

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
  /** Rarity-boost signals — a card is rarer when the moment mattered more. */
  /** The player's real team won that game. */
  wonGame?: boolean;
  /** A real playoff/postseason game. */
  playoff?: boolean;
  /** The fantasy team that rostered the player (shown as a badge). */
  rosteredBy?: string;
  /** The roster owner's fantasy matchup context that period. */
  fantasyResult?: "win" | "playoff" | "finals";
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
  /** Badge labels for the boosts that made this card rarer (or the roster team). */
  boosts: string[];
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

/**
 * Card subtitle: "Apr 17 vs PHX" nightly, "Week 5, 2025" for an NFL week, or
 * "2025 season" for a season card.
 */
function subtitleFor(performance: PlayerPerformance): string {
  if (performance.opponent) {
    const at = performance.home ? "vs" : "@";
    return `${prettyGameDate(performance.periodId)} ${at} ${performance.opponent}`;
  }
  const week = /^(\d{4})-wk(\d+)$/.exec(performance.periodId);
  if (week) return `Week ${Number(week[2])}, ${week[1]}`;
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

/** Rarity tiers in order, for boosting a card up by whole tiers. */
const RARITY_TIERS: Rarity[] = ["common", "uncommon", "rare", "sir"];

/** How many tiers each fantasy-matchup context is worth. */
const FANTASY_BOOST: Record<NonNullable<PlayerPerformance["fantasyResult"]>, number> = {
  win: 1,
  playoff: 2,
  finals: 3,
};

/**
 * A card is rarer when the moment mattered more: the team won, it was a playoff
 * game, or the roster owner was winning/deep in their fantasy season. Returns
 * the tier bump and the badge labels. The rostering team shows as a badge but
 * doesn't move rarity — every roster card has one, so it can't differentiate.
 * A zero or negative outing earns no boost.
 */
function boostsFor(performance: PlayerPerformance): { tiers: number; labels: string[] } {
  const labels: string[] = [];
  if (performance.rosteredBy) labels.push(performance.rosteredBy);
  if (performance.points <= 0) return { tiers: 0, labels };

  let tiers = 0;
  if (performance.wonGame) {
    tiers += 1;
    labels.push("Won");
  }
  if (performance.playoff) {
    tiers += 1;
    labels.push("Playoffs");
  }
  if (performance.fantasyResult) {
    tiers += FANTASY_BOOST[performance.fantasyResult];
    labels.push(
      performance.fantasyResult === "finals"
        ? "Fantasy Finals"
        : performance.fantasyResult === "playoff"
          ? "Fantasy Playoffs"
          : "Fantasy W",
    );
  }
  return { tiers, labels };
}

/**
 * Draw a pack of `size` distinct cards from a pool, weighted by each rarity's
 * `pullWeight` so rares come up less often. Sampling is without replacement, so
 * a pack has no duplicates; a pool smaller than the pack comes back whole. The
 * `random` source is injectable so the draw is testable.
 */
export function drawPack(
  pool: readonly GeneratedCard[],
  { size = 5, random = Math.random }: { size?: number; random?: () => number } = {},
): GeneratedCard[] {
  const remaining = [...pool];
  const picked: GeneratedCard[] = [];
  const count = Math.min(size, remaining.length);

  for (let k = 0; k < count; k++) {
    const weights = remaining.map((card) => RARITY_META[card.rarity].pullWeight);
    const total = weights.reduce((sum, w) => sum + w, 0);
    let roll = random() * total;
    let index = 0;
    for (; index < remaining.length - 1; index++) {
      roll -= weights[index];
      if (roll < 0) break;
    }
    picked.push(remaining.splice(index, 1)[0]);
  }
  return picked;
}

/** Upgrade a rarity by whole tiers, capped at SIR. */
function boostRarity(base: Rarity, tiers: number): Rarity {
  const i = Math.min(RARITY_TIERS.length - 1, RARITY_TIERS.indexOf(base) + tiers);
  return RARITY_TIERS[i];
}

function toCard(performance: PlayerPerformance, baseRarity: Rarity): GeneratedCard {
  const { tiers, labels } = boostsFor(performance);
  return {
    id: `${performance.sport}-${performance.playerId}-${performance.periodId}`,
    playerId: performance.playerId,
    playerName: performance.playerName,
    points: performance.points,
    periodId: performance.periodId,
    sport: performance.sport,
    rarity: boostRarity(baseRarity, tiers),
    title: `${performance.playerName} · ${Math.round(performance.points)} PTS`,
    subtitle: subtitleFor(performance),
    imageUrl: headshotUrl(performance.sport, performance.playerId),
    proTeamId: performance.proTeamId,
    opponent: performance.opponent,
    home: performance.home,
    boosts: labels,
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
