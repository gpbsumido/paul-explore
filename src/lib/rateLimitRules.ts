/**
 * The per-IP rate-limit rule table, first-match-wins.
 *
 * Pulled out of proxy.ts into its own pure module so the matching logic is
 * imported by both the middleware and its test — the test used to re-declare a
 * copy of these rules, which could silently drift from the real ones.
 *
 * All windows are 60 seconds (see RATE_WINDOW_MS in proxy.ts). Tighter caps on
 * the unauthenticated open routes; a generous backstop for the auth-gated rest,
 * where the auth check itself is the primary protection.
 */
export type RateLimitRule = {
  match: (pathname: string, method: string) => boolean;
  bucket: string;
  limit: number;
};

export const RATE_LIMITS: RateLimitRule[] = [
  // Open ingestion — no auth, strict cap to block fake-metric spam
  {
    match: (p, m) => p === "/api/vitals" && m === "POST",
    bucket: "vitals",
    limit: 20,
  },
  // Geo proxy — no auth, low cap (cached 60 s server-side anyway)
  {
    match: (p, m) => p === "/api/geo" && m === "GET",
    bucket: "geo",
    limit: 30,
  },
  // Public PokeAPI proxy — no auth, moderate cap
  {
    match: (p, m) => p === "/api/graphql" && m === "POST",
    bucket: "graphql",
    limit: 60,
  },
  // Operator dashboard writes — a public demo over synthetic data that is
  // reseeded daily, so the writes take no login by design. Cap them per IP so
  // the shared demo can't be spam-mutated: tighter than the generic backstop,
  // still generous for a human clicking through the dashboard. Reads (GET) fall
  // through to the backstop.
  {
    match: (p, m) => p.startsWith("/api/operator/") && m !== "GET",
    bucket: "operator-write",
    limit: 40,
  },
  // Backstop for all other API routes (auth-gated, so mostly a sanity check)
  { match: (p) => p.startsWith("/api/"), bucket: "api", limit: 300 },
];

/** The first rule matching this request, or null. Mirrors proxy.ts's loop. */
export function matchRateLimit(
  pathname: string,
  method: string,
): RateLimitRule | null {
  return RATE_LIMITS.find((r) => r.match(pathname, method)) ?? null;
}
