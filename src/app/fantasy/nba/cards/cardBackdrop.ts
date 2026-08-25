import { BAND_VALUES } from "@/lib/accentBand";
import { RARITY_META, type Rarity } from "@/lib/fantasy-cards";

/** A stable, unique background treatment for one card. */
export type CardBackdrop = {
  /** Which motion layers to render behind the card. */
  variant: "mesh" | "blob" | "both";
  /** Colours for the mesh/blobs — rarity accent first, then two from the band. */
  colors: string[];
  /** Blob shape seeds. */
  seeds: number[];
};

/** FNV-1a: a tiny, stable string hash so a card always draws the same backdrop. */
function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const VARIANTS: CardBackdrop["variant"][] = ["mesh", "blob", "both"];

/**
 * Pick a card's background from its identity, so every card looks distinct but
 * a given card looks the same on every render (and between server and client).
 * The rarity accent always leads the palette, so rarer cards read richer; the
 * second and third colours and the blob shapes come from the hash.
 */
export function cardBackdrop(seed: string, rarity: Rarity): CardBackdrop {
  const h = hash(seed);
  const primary = RARITY_META[rarity].color;
  const secondary = BAND_VALUES[h % BAND_VALUES.length];
  const tertiary = BAND_VALUES[(h >> 8) % BAND_VALUES.length];
  return {
    variant: VARIANTS[h % VARIANTS.length],
    colors: [primary, secondary, tertiary],
    seeds: [1 + (h % 6), 1 + ((h >> 5) % 6)],
  };
}
