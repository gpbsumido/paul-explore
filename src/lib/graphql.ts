import type { Pokemon, PokemonListResult, PokemonPage, GraphQLResponse } from "@/types/graphql";
import { PAGE_SIZE } from "@/types/graphql";

// ---------------------------------------------------------------------------
// GraphQL queries
// ---------------------------------------------------------------------------

/**
 * The stat/type field selection is the same whether or not we're filtering
 * by type, so keep it in one place.
 */
const POKEMON_FIELDS = `
  id
  name
  pokemon_v2_pokemontypes {
    pokemon_v2_type { name }
  }
  pokemon_v2_pokemonstats {
    base_stat
    pokemon_v2_stat { name }
  }
`;

/**
 * No type filter — where clause only checks name and is_default.
 * `is_default: true` skips alternate forms (Mega, regional variants, etc.)
 * so the grid stays clean without manual ID exclusions.
 */
export const LIST_QUERY = `
  query PokemonList($limit: Int!, $offset: Int!, $name: String!) {
    pokemon_v2_pokemon(
      limit: $limit
      offset: $offset
      where: { is_default: { _eq: true }, name: { _ilike: $name } }
      order_by: { id: asc }
    ) { ${POKEMON_FIELDS} }
    pokemon_v2_pokemon_aggregate(
      where: { is_default: { _eq: true }, name: { _ilike: $name } }
    ) { aggregate { count } }
  }
`;

/**
 * Same as LIST_QUERY but adds the type join condition to both the list
 * and the aggregate so the count stays in sync with what's on screen.
 */
export const LIST_BY_TYPE_QUERY = `
  query PokemonListByType($limit: Int!, $offset: Int!, $name: String!, $type: String!) {
    pokemon_v2_pokemon(
      limit: $limit
      offset: $offset
      where: {
        is_default: { _eq: true }
        name: { _ilike: $name }
        pokemon_v2_pokemontypes: { pokemon_v2_type: { name: { _eq: $type } } }
      }
      order_by: { id: asc }
    ) { ${POKEMON_FIELDS} }
    pokemon_v2_pokemon_aggregate(
      where: {
        is_default: { _eq: true }
        name: { _ilike: $name }
        pokemon_v2_pokemontypes: { pokemon_v2_type: { name: { _eq: $type } } }
      }
    ) { aggregate { count } }
  }
`;

// ---------------------------------------------------------------------------
// Query builder + fetch
// ---------------------------------------------------------------------------

/**
 * Returns the right query string and variables object for the current
 * filter state. Keeping this logic in the lib means the component just
 * calls one function and hands the result to fetchPokemon.
 */
export function buildPokemonQuery(
  name: string,
  type: string,
  limit: number = PAGE_SIZE,
  offset: number = 0,
): { query: string; variables: Record<string, unknown> } {
  // ilike pattern: empty search matches everything
  const namePattern = name.trim() ? `%${name.trim()}%` : "%";

  if (type) {
    return {
      query: LIST_BY_TYPE_QUERY,
      variables: { limit, offset, name: namePattern, type },
    };
  }
  return {
    query: LIST_QUERY,
    variables: { limit, offset, name: namePattern },
  };
}

/**
 * Sends a GraphQL request to the local /api/graphql proxy.
 * The proxy forwards to PokeAPI's Hasura endpoint — keeps the endpoint URL
 * out of client bundles and stays within the app's CSP connect-src policy.
 */
export async function fetchPokemon(
  query: string,
  variables: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<PokemonListResult> {
  const res = await fetch("/api/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
    signal,
  });
  if (!res.ok) throw new Error("GraphQL request failed");
  const json = (await res.json()) as GraphQLResponse<PokemonListResult>;
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data;
}

/**
 * Fetches one page of Pokémon for the given filter state and offset.
 * Returns the PokemonPage shape consumed by useInfiniteQuery — the flat
 * pokemon array and the total count (needed to derive hasNextPage).
 */
export async function fetchPokemonPage({
  name,
  type,
  offset,
  signal,
}: {
  name: string;
  type: string;
  offset: number;
  signal?: AbortSignal;
}): Promise<PokemonPage> {
  const { query, variables } = buildPokemonQuery(name, type, PAGE_SIZE, offset);
  const result = await fetchPokemon(query, variables, signal);
  return {
    pokemon: result.pokemon_v2_pokemon,
    total: result.pokemon_v2_pokemon_aggregate.aggregate.count,
  };
}

// The PokeAPI Hasura endpoint — only referenced server-side.
// The browser never sees this URL; it goes through /api/graphql instead.
const POKEAPI_GRAPHQL = "https://beta.pokeapi.co/graphql/v1beta";

/**
 * Server-side variant — calls PokeAPI directly instead of going through the
 * /api/graphql proxy. The proxy is only needed in the browser (CSP connect-src
 * + endpoint hiding). Server components and API routes can hit the origin.
 *
 * Uses Next.js's fetch cache (revalidate: 3600) so repeated renders within an
 * hour don't re-hit PokeAPI on every request.
 */
export async function fetchPokemonDirect(
  name: string,
  type: string,
  limit: number = PAGE_SIZE,
  offset: number = 0,
): Promise<PokemonListResult> {
  const { query, variables } = buildPokemonQuery(name, type, limit, offset);
  const res = await fetch(POKEAPI_GRAPHQL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`PokeAPI returned ${res.status}`);
  const json = (await res.json()) as GraphQLResponse<PokemonListResult>;
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data;
}

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

/** Official PokeAPI sprite CDN URL — small pixel-art sprite for a given dex ID. */
export function spriteUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}

/** Zero-padded national dex number — #001, #025, #150, etc. */
export function formatDexId(id: number): string {
  return `#${String(id).padStart(3, "0")}`;
}

/**
 * Readable Pokémon name — replaces hyphens with spaces and capitalises
 * the first letter. Handles edge cases like nidoran-f → "Nidoran f".
 */
export function formatPokemonName(name: string): string {
  return name.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

/** Pull a single base stat value by name. Returns 0 when the stat isn't present. */
export function getStat(pokemon: Pokemon, statName: string): number {
  return (
    pokemon.pokemon_v2_pokemonstats.find(
      (s) => s.pokemon_v2_stat.name === statName,
    )?.base_stat ?? 0
  );
}

// ---------------------------------------------------------------------------
// Type colours — used by both the card badges and the filter pills
// ---------------------------------------------------------------------------

/**
 * Tailwind bg/text/border classes for each Pokémon type.
 * Kept here so the card and the filter pills always use the same palette.
 */
export const POKEMON_TYPE_COLORS: Record<string, string> = {
  fire:     "bg-orange-500/20 text-orange-400 border-orange-500/40",
  water:    "bg-blue-500/20 text-blue-400 border-blue-500/40",
  grass:    "bg-green-500/20 text-green-400 border-green-500/40",
  electric: "bg-yellow-400/20 text-yellow-400 border-yellow-400/40",
  psychic:  "bg-pink-500/20 text-pink-400 border-pink-500/40",
  dragon:   "bg-indigo-500/20 text-indigo-400 border-indigo-500/40",
  fighting: "bg-red-600/20 text-red-400 border-red-600/40",
  rock:     "bg-amber-700/20 text-amber-400 border-amber-700/40",
  ghost:    "bg-purple-700/20 text-purple-400 border-purple-700/40",
  dark:     "bg-slate-700/20 text-slate-400 border-slate-700/40",
  steel:    "bg-zinc-400/20 text-zinc-400 border-zinc-400/40",
  ice:      "bg-cyan-400/20 text-cyan-400 border-cyan-400/40",
  normal:   "bg-neutral-400/20 text-neutral-400 border-neutral-400/40",
  flying:   "bg-sky-400/20 text-sky-400 border-sky-400/40",
  poison:   "bg-purple-500/20 text-purple-400 border-purple-500/40",
  ground:   "bg-amber-600/20 text-amber-400 border-amber-600/40",
  bug:      "bg-lime-500/20 text-lime-400 border-lime-500/40",
  fairy:    "bg-rose-400/20 text-rose-400 border-rose-400/40",
};

/** Fallback for any type not in the map above. */
export const DEFAULT_TYPE_COLOR = "bg-neutral-400/20 text-neutral-400 border-neutral-400/40";
