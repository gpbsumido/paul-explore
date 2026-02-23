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
  Fire: "bg-orange-500/20 text-orange-300",
  Water: "bg-blue-500/20 text-blue-300",
  Grass: "bg-green-500/20 text-green-300",
  Lightning: "bg-yellow-400/20 text-yellow-300",
  Psychic: "bg-pink-500/20 text-pink-300",
  Fighting: "bg-red-600/20 text-red-300",
  Darkness: "bg-slate-600/20 text-slate-300",
  Metal: "bg-zinc-400/20 text-zinc-300",
  Dragon: "bg-indigo-500/20 text-indigo-300",
  Fairy: "bg-rose-400/20 text-rose-300",
  Colorless: "bg-neutral-400/20 text-neutral-300",
};

export const DEFAULT_TYPE_COLOR = "bg-primary-500/15 text-primary-400";

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
