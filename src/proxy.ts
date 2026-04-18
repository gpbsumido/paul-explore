import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { checkRateLimit } from "@/lib/rateLimit";

/**
 * Single proxy entry point for auth, session enforcement, and CSP headers.
 *
 * Three responsibilities:
 *
 * 1. Auth0 OIDC routes (/auth/*) — delegated entirely to auth0.middleware()
 *    which handles login, callback, logout, and silent token refresh.
 *    Note: @auth0/nextjs-auth0 v4 uses /auth/* not /api/auth/*.
 *
 * 2. Session enforcement — unauthenticated requests to /vitals or /settings
 *    are redirected to /auth/login before auth0.middleware() ever runs.
 *    auth0.getSession(request) reads the encrypted cookie locally (no network
 *    call) so enforcement adds no measurable TTFB. Authenticated requests go
 *    through auth0.middleware() for rolling session refresh.
 *    The root / route is now a server component that calls auth0.getSession()
 *    itself and renders either the landing page or the hub depending on
 *    whether a session exists.
 *
 * 3. CSP headers — applied on every pass-through response so every page load
 *    carries the policy. 'unsafe-inline' in script-src is required for Next.js
 *    App Router RSC payload scripts (self.__next_f.push(...)) that are inlined
 *    into the HTML at build time with no nonce attribute. 'wasm-unsafe-eval'
 *    is required for the Draco WASM decoder used by the landing 3D models.
 *    See README for the full reasoning.
 */

const CSP = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://vercel.live https://va.vercel-scripts.com`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' blob: data: https://assets.tcgdex.net https://raw.githubusercontent.com`,
  `font-src 'self'`,
  `connect-src 'self' blob: https://vitals.vercel-insights.com https://vercel.live https://api.open-meteo.com`,
  `frame-src https://vercel.live`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `frame-ancestors 'none'`,
].join("; ");

/**
 * Rate limit config for API routes.
 * All windows are 60 seconds. Tighter limits on unauthenticated open routes;
 * a generous fallback for auth-gated routes where the auth check itself acts
 * as the primary protection.
 */
const RATE_LIMITS: Array<{
  match: (pathname: string, method: string) => boolean;
  bucket: string;
  limit: number;
}> = [
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
  // Backstop for all other API routes (auth-gated, so mostly a sanity check)
  { match: (p) => p.startsWith("/api/"), bucket: "api", limit: 300 },
];

const RATE_WINDOW_MS = 60_000;

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rate limiting — checked before auth so we reject at the edge without
  // doing any session work. First matching rule wins.
  const ip = getIp(request);
  for (const rule of RATE_LIMITS) {
    if (!rule.match(pathname, request.method)) continue;
    const { allowed, resetAt } = checkRateLimit(
      ip,
      rule.bucket,
      rule.limit,
      RATE_WINDOW_MS,
    );
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)),
            "X-RateLimit-Limit": String(rule.limit),
            "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)),
          },
        },
      );
    }
    break;
  }

  // Auth0 OIDC routes — the SDK owns the full login / callback / logout flow.
  // v4 of @auth0/nextjs-auth0 uses /auth/* (not /api/auth/*).
  if (pathname.startsWith("/auth/")) {
    try {
      return await auth0.middleware(request);
    } catch {
      // Auth0 is misconfigured (e.g. missing env vars in CI). Fall through so
      // public routes continue to work — auth-gated routes will 500 naturally.
      return NextResponse.next();
    }
  }

  // Protect /vitals and /settings the same way /protected was protected.
  // Unauthenticated requests redirect immediately to login with returnTo so
  // the user lands back here after signing in. Authenticated requests go
  // through auth0.middleware() for rolling session refresh.
  if (
    pathname.startsWith("/vitals") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/calendar")
  ) {
    const session = await auth0.getSession(request);
    if (!session) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("returnTo", pathname);
      return NextResponse.redirect(loginUrl);
    }
    const res = await auth0.middleware(request);
    res.headers.set("Content-Security-Policy", CSP);
    return res;
  }

  // All other routes: pass through with CSP headers.
  const response = NextResponse.next();
  response.headers.set("Content-Security-Policy", CSP);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
