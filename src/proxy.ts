import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";

/**
 * Single proxy entry point for auth, session enforcement, and CSP headers.
 *
 * Three responsibilities:
 *
 * 1. Auth0 OIDC routes (/auth/*) — delegated entirely to auth0.middleware()
 *    which handles login, callback, logout, and silent token refresh.
 *    Note: @auth0/nextjs-auth0 v4 uses /auth/* not /api/auth/*.
 *
 * 2. Session enforcement — unauthenticated requests to /protected are
 *    redirected to /auth/login before auth0.middleware() ever runs.
 *    auth0.getSession(request) reads the encrypted cookie locally (no network
 *    call) so enforcement adds no measurable TTFB. Authenticated /protected
 *    requests go through auth0.middleware() for rolling session refresh.
 *    Logged-in users hitting / are bounced straight to the hub.
 *
 * 3. CSP headers — applied on every pass-through response so every page load
 *    carries the policy. 'unsafe-inline' in script-src is required for Next.js
 *    App Router RSC payload scripts (self.__next_f.push(...)) that are inlined
 *    into the HTML at build time with no nonce attribute. See README for the
 *    full reasoning.
 */

const CSP = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline' https://vercel.live`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: https://assets.tcgdex.net https://raw.githubusercontent.com`,
  `font-src 'self'`,
  `connect-src 'self' https://vitals.vercel-insights.com https://vercel.live`,
  `frame-src https://vercel.live`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `frame-ancestors 'none'`,
].join("; ");

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Auth0 OIDC routes — the SDK owns the full login / callback / logout flow.
  // v4 of @auth0/nextjs-auth0 uses /auth/* (not /api/auth/*).
  if (pathname.startsWith("/auth/")) {
    return auth0.middleware(request);
  }

  // Logged-in users landing on / skip the marketing page and go straight to
  // the hub. getSession(request) is the middleware-safe overload that reads
  // from request.cookies directly — no next/headers dependency, no network
  // call. This is what keeps the landing page statically pre-rendered at
  // build time (page.tsx has no auth calls) while still redirecting sessions.
  if (pathname === "/") {
    const session = await auth0.getSession(request);
    if (session) {
      return NextResponse.redirect(new URL("/protected", request.url));
    }
  }

  // Enforce auth on /protected routes before auth0.middleware runs.
  // Unauthenticated requests redirect immediately — auth0.middleware is
  // skipped entirely, which keeps the redirect path as cheap as possible.
  // Authenticated requests go through auth0.middleware for rolling session
  // refresh (updates the cookie maxAge so the session stays alive).
  if (pathname.startsWith("/protected")) {
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
