import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { clientIp } from "@/lib/clientIp";
import {
  loginRedirectAdditions,
  LOGIN_PROMPT_COOKIE,
  SESSION_TIMEOUT_PROMPT,
} from "@/lib/loginReturnTo";
import {
  SESSION_MARKER_COOKIE,
  SESSION_ABSOLUTE_SECONDS,
  isSessionTimeout,
  isLogoutPath,
} from "@/lib/authSession";
import { checkRateLimit } from "@/lib/rateLimit";
import { buildCsp } from "@/lib/csp";
import { API_URL } from "@/lib/apiUrl";
import { isSessionProtectedPath } from "@/lib/protectedPaths";
import {
  VISITOR_COOKIE,
  VISITOR_COOKIE_MAX_AGE,
  newVisitorId,
} from "@/lib/visitor";
import { CONSENT_COOKIE, hasAcceptedConsent } from "@/lib/consent";

/**
 * Single proxy entry point for auth, session enforcement, and CSP headers.
 *
 * Three responsibilities:
 *
 * 1. Auth0 OIDC routes (/auth/*) — delegated entirely to auth0.middleware()
 *    which handles login, callback, logout, and silent token refresh.
 *    Note: @auth0/nextjs-auth0 v4 uses /auth/* not /api/auth/*.
 *
 * 2. Session enforcement — unauthenticated requests to /settings or /calendar
 *    are redirected to /auth/login before auth0.middleware() ever runs.
 *    (Web Vitals is public — see isSessionProtectedPath.)
 *    auth0.getSession(request) reads the encrypted cookie locally (no network
 *    call) so enforcement adds no measurable TTFB. Authenticated requests go
 *    through auth0.middleware() for rolling session refresh.
 *    The / and /discover routes are server components that call
 *    auth0.getSession() themselves and render either the landing page or the
 *    hub depending on whether a session exists.
 *
 * 3. CSP headers — applied on every pass-through response so every page load
 *    carries the policy. 'unsafe-inline' in script-src is a deliberate trade,
 *    not a limitation: App Router does support nonces on its RSC payload
 *    scripts, but reading headers() in the root layout opts every route out of
 *    static generation, and a build confirmed every page flipping from static
 *    to dynamic. Taken knowing the XSS surface is one static inline script,
 *    no eval, and nothing user-supplied reaching markup. 'wasm-unsafe-eval'
 *    is required for the Draco WASM decoder used by the landing 3D models.
 *    See /thoughts/security for the full reasoning.
 */

// Built in src/lib/csp.ts so the one environment-dependent part -- the origin
// serving user-uploaded photos -- is testable and configurable. Without it,
// saved gallery walls render blank because the browser blocks every photo.
// API_URL rather than the raw env var: it carries the localhost fallback, so
// connect-src allows wherever the app will actually fetch from even when
// NEXT_PUBLIC_API_URL is unset.
const CSP = buildCsp(process.env.NEXT_PUBLIC_MEDIA_ORIGIN, {
  dev: process.env.NODE_ENV === "development",
  apiUrl: API_URL,
});

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

/**
 * Stamps the long-lived marker on an authenticated response. It outlives the
 * session cookie, so once the session has expired its lingering presence is how
 * we know the user timed out rather than never logging in.
 */
function markSessionActive(res: NextResponse): NextResponse {
  res.cookies.set(SESSION_MARKER_COOKIE, "1", {
    path: "/",
    maxAge: SESSION_ABSOLUTE_SECONDS,
    httpOnly: true,
    sameSite: "lax",
    secure: true,
  });
  return res;
}

/**
 * Sends a timed-out user to the landing page with a toast flag, clears the
 * marker so we only say it once, and arms the next login to re-authenticate. We land them on a real page rather than bouncing straight
 * to Auth0 so the "session timed out" toast actually gets a chance to render.
 */
function sessionTimeoutRedirect(request: NextRequest): NextResponse {
  const url = new URL("/", request.url);
  url.searchParams.set("authError", "timeout");
  const res = NextResponse.redirect(url);
  res.cookies.delete(SESSION_MARKER_COOKIE);
  res.cookies.set(LOGIN_PROMPT_COOKIE, SESSION_TIMEOUT_PROMPT, {
    path: "/",
    maxAge: 600,
    httpOnly: true,
    sameSite: "lax",
    secure: true,
  });
  return res;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rate limiting — checked before auth so we reject at the edge without
  // doing any session work. First matching rule wins.
  const ip = clientIp(request);
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
    // The login links across the app point at a bare /auth/login, so the SDK
    // would default the post-login redirect to "/". Fill in a returnTo from the
    // page they came from (the Referer) so they land back where they started.
    // And after a denied consent, force a fresh prompt so Auth0 asks who's
    // logging in again instead of jumping straight back to the permission
    // screen — the reauth cookie set by onCallback is a one-shot, cleared here.
    if (pathname === "/auth/login") {
      const promptCookie = request.cookies.get(LOGIN_PROMPT_COOKIE)?.value;
      const additions = loginRedirectAdditions({
        searchParams: request.nextUrl.searchParams,
        referer: request.headers.get("referer"),
        origin: request.nextUrl.origin,
        promptCookie,
      });
      if (Object.keys(additions).length > 0 || promptCookie) {
        const loginUrl = request.nextUrl.clone();
        if (additions.returnTo)
          loginUrl.searchParams.set("returnTo", additions.returnTo);
        if (additions.prompt)
          loginUrl.searchParams.set("prompt", additions.prompt);
        const res = NextResponse.redirect(loginUrl);
        if (promptCookie) res.cookies.delete(LOGIN_PROMPT_COOKIE);
        return res;
      }
    }
    try {
      const res = await auth0.middleware(request);
      // Clear the marker on the way out. It deliberately outlives the session
      // cookie so an expired session can be told apart from never having been
      // signed in -- but that makes a deliberate logout look identical to a
      // timeout, and the next page load told the user their session had
      // expired when they had just chosen to leave.
      if (isLogoutPath(pathname)) res.cookies.delete(SESSION_MARKER_COOKIE);
      return res;
    } catch (err) {
      console.error("[proxy] auth0.middleware() failed on", pathname, err);
      // Auth0 is misconfigured (e.g. missing env vars in CI). Fall through so
      // public routes continue to work — auth-gated routes will 500 naturally.
      return NextResponse.next();
    }
  }

  // Protect /settings and /calendar the same way /protected was protected.
  // Unauthenticated requests redirect immediately to login with returnTo so
  // the user lands back here after signing in. Authenticated requests go
  // through auth0.middleware() for rolling session refresh. Web Vitals is
  // deliberately not here — it's public (see isSessionProtectedPath).
  if (isSessionProtectedPath(pathname)) {
    const session = await auth0.getSession(request);
    if (!session) {
      const marker = request.cookies.get(SESSION_MARKER_COOKIE)?.value;
      if (isSessionTimeout(false, marker)) {
        return sessionTimeoutRedirect(request);
      }
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("returnTo", pathname);
      return NextResponse.redirect(loginUrl);
    }
    const res = await auth0.middleware(request);
    res.headers.set("Content-Security-Policy", CSP);
    return markSessionActive(res);
  }

  // The two pages that read the session themselves — run auth0.middleware()
  // when a session cookie is present so that expired/invalid tokens are
  // refreshed or cleared before page.tsx reads the session. Without this,
  // getSession() trusts the cookie without hitting Auth0, so a stale session
  // renders FeatureHub even though the user's actual token is expired (looks
  // logged-in but isn't).
  if (pathname === "/" && request.nextUrl.searchParams.has("version")) {
    // The version switcher used to live on the landing page, so bookmarks and
    // old links carry ?version= against "/". Send them where the registry went
    // and keep the param, rather than silently showing them the current
    // version. Permanent, because this one is not moving back.
    const url = new URL("/discover", request.url);
    url.search = request.nextUrl.search;
    return NextResponse.redirect(url, 308);
  }

  if (pathname === "/" || pathname === "/discover") {
    const session = await auth0.getSession(request);
    if (session) {
      const res = await auth0.middleware(request);
      res.headers.set("Content-Security-Policy", CSP);
      return markSessionActive(res);
    }
    // No session on the landing page. If the marker is still around the session
    // just timed out, so bounce once to show the toast; the redirect clears the
    // marker so the followup falls through and the landing renders.
    const marker = request.cookies.get(SESSION_MARKER_COOKIE)?.value;
    if (
      isSessionTimeout(false, marker) &&
      !request.nextUrl.searchParams.has("authError")
    ) {
      return sessionTimeoutRedirect(request);
    }
  }

  // Any other request from a signed-in user — a public write-up, an API call, a
  // client-side navigation — rolls the session too, so any activity anywhere
  // resets the idle timer, not just the hub and the protected features.
  // getSession() is a cheap cookie read that returns null with no work when
  // there's no session, so anonymous traffic falls straight through.
  const session = await auth0.getSession(request);
  if (session) {
    const res = await auth0.middleware(request);
    res.headers.set("Content-Security-Policy", CSP);
    return markSessionActive(res);
  }

  // All other routes: pass through with CSP headers, minting a stable visitor
  // id on first contact. Server-side flag rollouts (the /tcg/pocket gate) key
  // off this cookie, so a visitor's bucket stays fixed across visits. When it is
  // missing we forward the freshly minted id on this request too, so the current
  // render already sees it instead of waiting for the next navigation.
  const visitorId = request.cookies.get(VISITOR_COOKIE)?.value;
  if (visitorId) {
    const response = NextResponse.next();
    response.headers.set("Content-Security-Policy", CSP);
    return response;
  }

  // visitor_id is a non-essential (feature-flag bucketing) cookie, so it is only
  // minted once the visitor has accepted cookie consent. Until then the site
  // runs without it: rollouts fall back to a keyless default bucket and the
  // backend rate-limits on IP. Recording the consent choice itself is strictly
  // necessary, so the consent cookie needs no consent of its own.
  if (!hasAcceptedConsent(request.cookies.get(CONSENT_COOKIE)?.value)) {
    const response = NextResponse.next();
    response.headers.set("Content-Security-Policy", CSP);
    return response;
  }

  const mintedVisitorId = newVisitorId();
  request.cookies.set(VISITOR_COOKIE, mintedVisitorId);
  const response = NextResponse.next({ request: { headers: request.headers } });
  response.cookies.set(VISITOR_COOKIE, mintedVisitorId, {
    path: "/",
    maxAge: VISITOR_COOKIE_MAX_AGE,
    sameSite: "lax",
    httpOnly: true,
    secure: true,
  });
  response.headers.set("Content-Security-Policy", CSP);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
