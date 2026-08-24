import type { Rarity } from "./fantasy-cards";

/** Rarity buckets, rarest first — for filter chips and grouping. */
export const RARITY_ORDER: Rarity[] = ["sir", "rare", "uncommon", "common"];

/** A rarity filter, or "all". */
export type RarityFilter = Rarity | "all";

/** How the card grids can be ordered. */
export type CardSort = "points" | "rarity" | "name";

/** Sort options for the shared card controls, in menu order. */
export const CARD_SORTS: { value: CardSort; label: string }[] = [
  { value: "points", label: "Points" },
  { value: "rarity", label: "Rarity" },
  { value: "name", label: "Name" },
];

const RARITY_RANK: Record<Rarity, number> = { sir: 3, rare: 2, uncommon: 1, common: 0 };

/**
 * Order a set of cards for display. Points and rarity go highest-first (rarity
 * ties broken by points); name is A→Z. Pure — returns a new array.
 */
export function sortCards<T extends { points: number; rarity: Rarity; playerName: string }>(
  cards: readonly T[],
  sort: CardSort,
): T[] {
  const copy = [...cards];
  switch (sort) {
    case "rarity":
      return copy.sort((a, b) => RARITY_RANK[b.rarity] - RARITY_RANK[a.rarity] || b.points - a.points);
    case "name":
      return copy.sort((a, b) => a.playerName.localeCompare(b.playerName));
    default:
      return copy.sort((a, b) => b.points - a.points);
  }
}
