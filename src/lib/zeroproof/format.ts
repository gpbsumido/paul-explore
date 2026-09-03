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
  let hash = 5381;
  for (let i = 0; i < userSub.length; i++) {
    hash = (hash * 33) ^ userSub.charCodeAt(i);
  }
  const token = (hash >>> 0).toString(36).toUpperCase().slice(0, 5);
  return `P-${token.padStart(5, "0")}`;
}

/** Win-loss-push record as `12-7-1`. */
export function formatRecord(entry: {
  wins: number;
  losses: number;
  pushes: number;
}): string {
  return `${entry.wins}-${entry.losses}-${entry.pushes}`;
}
