import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";
import { LIST_QUERY, LIST_BY_TYPE_QUERY } from "@/lib/graphql";
/**
 * Proxy that forwards GraphQL requests to the PokeAPI Hasura endpoint.
 *
 * Sitting between the browser and the upstream API keeps two things clean:
 * - The connect-src CSP stays locked to same-origin (no direct beta.pokeapi.co calls)
 * - The endpoint URL stays out of client bundles
 *
 * This route is intentionally unauthenticated — PokeAPI is public data. What it
 * is not is a general-purpose relay: it forwards the two queries this app
 * actually sends and nothing else. Without that, anyone who found the path
 * could point arbitrary nested queries at a free public API from my origin,
 * which makes my server the thing that gets rate-limited for it.
 */

const POKEAPI_GRAPHQL = "https://beta.pokeapi.co/graphql/v1beta";

/**
 * Collapses runs of whitespace so a query still matches after a formatter or a
 * template literal changes its indentation. Everything else must match exactly:
 * this is an allowlist of known documents, not a parser.
 */
const normalize = (query: string): string => query.trim().replace(/\s+/g, " ");

const ALLOWED_QUERIES = new Set(
  [LIST_QUERY, LIST_BY_TYPE_QUERY].map(normalize),
);

// Results vary by query body so they're user-specific at the browser level.
// private keeps CDNs out of it; max-age=60 lets the browser reuse the same
// query result for a minute before re-fetching (type switching re-uses cached data).
const CACHE_CONTROL = "private, max-age=60";

export async function POST(request: Request) {
  const cl = Number(request.headers.get("content-length") ?? 0);
  if (cl > 65_536) {
    return Response.json({ error: "Payload too large" }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (new TextEncoder().encode(JSON.stringify(body)).length > 65_536) {
    return Response.json({ error: "Payload too large" }, { status: 413 });
  }

  // Only the documents this app sends get forwarded. Checking the whole query
  // string sidesteps having to reason about depth limits and cost analysis for
  // a proxy that has exactly two callers.
  const query = (body as { query?: unknown } | null)?.query;
  if (typeof query !== "string" || !ALLOWED_QUERIES.has(normalize(query))) {
    return Response.json({ error: "Query not allowed" }, { status: 403 });
  }

  // PokeAPI is a third party, so it gets a deadline like everything else. An
  // unbounded call here left the browser waiting on someone else's outage with
  // no way to tell that was what had happened.
  const upstreamResult = await fetchUpstream(POKEAPI_GRAPHQL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!upstreamResult.ok) return upstreamErrorResponse(upstreamResult);
  const upstream = upstreamResult.response;

  // Forward the upstream status transparently; guard the parse so a non-JSON
  // error body from upstream doesn't throw here.
  const data = await upstream.json().catch(() => null);
  return Response.json(data ?? { error: "Upstream error" }, {
    status: upstream.status,
    headers: { "Cache-Control": CACHE_CONTROL },
  });
}
