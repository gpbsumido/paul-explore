/** Shapes returned from the PokeAPI v2 Hasura GraphQL endpoint. */

export type PokemonStatEntry = {
  base_stat: number;
  pokemon_v2_stat: { name: string };
};

export type PokemonTypeEntry = {
  pokemon_v2_type: { name: string };
};

export type Pokemon = {
  id: number;
  name: string;
  pokemon_v2_pokemontypes: PokemonTypeEntry[];
  pokemon_v2_pokemonstats: PokemonStatEntry[];
};

export type PokemonListResult = {
  pokemon_v2_pokemon: Pokemon[];
  pokemon_v2_pokemon_aggregate: {
    aggregate: { count: number };
  };
};

/** Wrapper around every PokeAPI GraphQL response — errors array is non-null on failure. */
export type GraphQLResponse<T> = {
  data: T;
  errors?: Array<{ message: string }>;
};

/** Number of cards fetched per page in the browser. */
export const PAGE_SIZE = 24;

/**
 * The types shown as filter pills in the browser.
 * Ordered roughly by popularity so the most-used ones land
 * in the first row on mobile.
 */
export const POKEMON_TYPES = [
  "fire",
  "water",
  "grass",
  "electric",
  "psychic",
  "dragon",
  "fighting",
  "rock",
  "ghost",
  "dark",
  "steel",
  "ice",
  "normal",
  "flying",
  "poison",
  "ground",
  "bug",
  "fairy",
] as const;

export type PokemonTypeName = (typeof POKEMON_TYPES)[number];
