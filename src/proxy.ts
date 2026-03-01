import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";

const PUBLIC_PATHS = ["/", "/auth/login", "/auth/logout", "/auth/callback"];

/**
 * @param request - the request object
 * @returns - the response object
 */
export async function proxy(request: Request) {
  const { pathname } = new URL(request.url);

  // Auth routes: let auth0.middleware() handle the full OIDC flow
  // (login, callback, logout, silent token refresh).
  if (pathname.startsWith("/auth/")) {
    return auth0.middleware(request);
  }

  // Logged-in users who hit the landing page get bounced to the hub immediately.
  // Doing this in middleware keeps the redirect off the page's render path --
  // page.tsx becomes a static build artifact and doesn't pay the cookie-read
  // cost on every request.
  if (pathname === "/") {
    const session = await auth0.getSession();
    if (session) {
      return NextResponse.redirect(new URL("/protected", request.url));
    }
  }

  // check if the path is public or is api (which handles its own auth)
  const isPublic =
    PUBLIC_PATHS.some((p) => pathname === p) || pathname.startsWith("/api/");

  // For protected pages: getSession() reads the encrypted session cookie
  // locally -- no network call, so it doesn't add TTFB the way middleware() does.
  if (!isPublic) {
    const session = await auth0.getSession();
    if (!session) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
  }

  const csp = [
    `default-src 'self'`,
    // 'self' allows Next.js static chunks; 'unsafe-inline' is required for
    // Next.js App Router RSC payload scripts (self.__next_f.push(...)) that
    // are inlined into the HTML at build time and cannot carry a per-request
    // nonce. This is the standard CSP for Next.js apps with static pages.
    `script-src 'self' 'unsafe-inline'`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: https://assets.tcgdex.net https://raw.githubusercontent.com`,
    `font-src 'self'`,
    `connect-src 'self' https://vitals.vercel-insights.com`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
  ].join("; ");

  const response = NextResponse.next();
  response.headers.set("Content-Security-Policy", csp);

  return response;
}

// match all routes except for specified ones
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
