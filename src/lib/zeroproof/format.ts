import type { ZeroproofMarket } from "./schemas";

/**
 * American odds as they're written on a book: a leading `+` for underdogs, the
 * `-` the number already carries for favourites.
 */
export function formatAmerican(price: number): string {
  return price > 0 ? `+${price}` : `${price}`;
}

/** The line a spread/total outcome sits at, e.g. `-3.5` or `O 45.5`. Empty for moneyline. */
export function formatPoint(point: number | undefined): string {
  if (point === undefined) return "";
  return point > 0 ? `+${point}` : `${point}`;
}

const MARKET_LABELS: Record<string, string> = {
  h2h: "Moneyline",
  spread: "Spread",
  total: "Total",
};

/** Human label for a market key, falling back to the raw key if it's new. */
export function marketLabel(market: string): string {
  return MARKET_LABELS[market] ?? market;
}

/** Orders markets the way a book lists them, unknown ones last. */
const MARKET_ORDER = ["h2h", "spread", "total"];
export function sortMarkets(markets: ZeroproofMarket[]): ZeroproofMarket[] {
  const rank = (m: string) => {
    const i = MARKET_ORDER.indexOf(m);
    return i === -1 ? MARKET_ORDER.length : i;
  };
  return [...markets].sort((a, b) => rank(a.market) - rank(b.market));
}

/**
 * A stable, opaque handle for a leaderboard row.
 *
 * The backend returns the raw Auth0 `sub`, which is a user identifier and has no
 * business on a public page. This derives a short deterministic token from it —
 * the same player always reads the same handle, and the token can't be walked
 * back to the sub — so the board can name rows without exposing anyone.
 */
export function playerHandle(userSub: string): string {
  // FNV-1a over the sub, then a murmur3 finalizer. The finalizer is the point:
  // without it, subs that share a prefix (auth0|a1, auth0|b2) differ only in the
  // low bits, and the leading base36 digits — the ones a naive slice keeps —
  // come out identical, so every player reads as the same handle. The avalanche
  // spreads each input difference across all 32 bits.
  let h = 2166136261;
  for (let i = 0; i < userSub.length; i++) {
    h ^= userSub.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x45d9f3b);
  h ^= h >>> 16;
  const token = (h >>> 0).toString(36).toUpperCase().padStart(7, "0").slice(-5);
  return `P-${token}`;
}

/** Win-loss-push record as `12-7-1`. */
export function formatRecord(entry: {
  wins: number;
  losses: number;
  pushes: number;
}): string {
  return `${entry.wins}-${entry.losses}-${entry.pushes}`;
}

/** Integer cents as a dollar amount, e.g. 12345 -> `$123.45`. */
export function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

/** A signed percentage, e.g. 12.5 -> `+12.5%`, null -> `—`. */
export function formatSignedPct(pct: number | null): string {
  if (pct === null) return "—";
  return `${pct > 0 ? "+" : ""}${pct}%`;
}

/**
 * A current streak as a readable run: positive is a win streak, negative a
 * losing one, zero is nothing going.
 */
export function formatStreak(streak: number): string {
  if (streak === 0) return "—";
  const n = Math.abs(streak);
  return streak > 0 ? `W${n}` : `L${n}`;
}
