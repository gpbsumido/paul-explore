/**
 * Proxy that forwards GraphQL requests to the PokeAPI Hasura endpoint.
 *
 * Sitting between the browser and the upstream API keeps two things clean:
 * - The connect-src CSP stays locked to same-origin (no direct beta.pokeapi.co calls)
 * - The endpoint URL stays out of client bundles
 *
 * This route is intentionally unauthenticated — PokeAPI is public data.
 */

const POKEAPI_GRAPHQL = "https://beta.pokeapi.co/graphql/v1beta";

// Results vary by query body so they're user-specific at the browser level.
// private keeps CDNs out of it; max-age=60 lets the browser reuse the same
// query result for a minute before re-fetching (type switching re-uses cached data).
const CACHE_CONTROL = "private, max-age=60";

export async function POST(request: Request) {
  const body = await request.json();

  const upstream = await fetch(POKEAPI_GRAPHQL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await upstream.json();
  return Response.json(data, {
    status: upstream.status,
    headers: { "Cache-Control": CACHE_CONTROL },
  });
}
