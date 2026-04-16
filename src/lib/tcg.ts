/**
 * Minimal card shape returned by the /api/tcg/cards list endpoint.
 * Full card detail lives at /api/tcg/cards/:id.
 */
export type CardResume = {
  id: string;
  name: string;
  /** Base CDN URL — append /low.webp or /high.webp to get the actual image */
  image?: string;
  localId: string;
};

/** One page of cards as returned by the useInfiniteQuery queryFn. */
export type CardPage = {
  cards: CardResume[];
  hasMore: boolean;
};

export const POKEMON_TYPES = [
  "Colorless",
  "Darkness",
  "Dragon",
  "Fairy",
  "Fighting",
  "Fire",
  "Grass",
  "Lightning",
  "Metal",
  "Psychic",
  "Water",
] as const;

export type PokemonType = (typeof POKEMON_TYPES)[number];

export const TYPE_COLORS: Record<string, string> = {
  Fire: "bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200",
  Water: "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200",
  Grass: "bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-200",
  Lightning: "bg-yellow-100 text-yellow-900 dark:bg-yellow-950 dark:text-yellow-200",
  Psychic: "bg-pink-100 text-pink-900 dark:bg-pink-950 dark:text-pink-200",
  Fighting: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
  Darkness: "bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-200",
  Metal: "bg-zinc-100 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-200",
  Dragon: "bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200",
  Fairy: "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200",
  Colorless: "bg-neutral-100 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-200",
};

export const DEFAULT_TYPE_COLOR =
  "bg-primary-100 text-primary-900 dark:bg-primary-950 dark:text-primary-200";

export function typeStyle(type: string): string {
  return TYPE_COLORS[type] ?? DEFAULT_TYPE_COLOR;
}

/**
 * Strip SDK model instances to plain JSON-serializable objects.
 * The SDK attaches a circular `sdk` reference on every model instance,
 * which breaks NextResponse.json(). We skip those keys in the replacer.
 */
export function toPlain<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (key, value) =>
      key === "sdk" || key === "tcgdex" ? undefined : value
    )
  );
}
