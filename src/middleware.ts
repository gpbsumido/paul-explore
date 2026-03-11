import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";

/**
 * Handles two things: the Auth0 auth routes (/api/auth/*) and auth
 * enforcement for protected pages (/protected/*).
 *
 * For /protected routes the session check runs first, before auth0.middleware.
 * auth0.getSession(req) reads and decrypts the session cookie locally, no
 * network call, so this adds no measurable TTFB cost. Unauthenticated requests
 * are redirected immediately and auth0.middleware never runs for them, which
 * is actually slightly faster than the previous version.
 *
 * For authenticated /protected requests, auth0.middleware runs after the check
 * and handles rolling session refresh (updates the cookie maxAge so the session
 * stays alive as the user navigates).
 *
 * The matcher is narrow by design. auth0.middleware() makes a network call to
 * Auth0 when a token needs refreshing, so running it on every page in the app
 * would add that latency to every page load. Limiting it to just the routes
 * that actually need it means the landing page, TCG browser, and everything
 * else never pay that cost.
 *
 * /protected/page.tsx is a plain static component with no auth calls, which
 * lets Next.js pre-render it at build time and serve the cached HTML from the
 * CDN edge. The session check here enforces auth at the edge before that
 * cached HTML is ever returned, so the page being static doesn't mean it's
 * publicly accessible.
 */
export async function middleware(req: NextRequest) {
  // For /protected routes, check the session before doing anything else.
  // getSession(req) is the middleware-safe overload — reads from req.cookies
  // directly, no next/headers dependency, no network call.
  // Unauthenticated requests get redirected here and auth0.middleware is
  // skipped entirely, which keeps the redirect path as cheap as possible.
  if (req.nextUrl.pathname.startsWith("/protected")) {
    const session = await auth0.getSession(req);
    if (!session) {
      const loginUrl = new URL("/api/auth/login", req.url);
      loginUrl.searchParams.set("returnTo", req.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // auth0.middleware handles the /api/auth/* routes (login/logout/callback)
  // and touches rolling sessions for authenticated /protected requests.
  return auth0.middleware(req);
}

export const config = {
  matcher: [
    // auth0 needs these routes to handle login, logout, and the callback.
    // without this, clicking "Log in" just returns a 404.
    "/api/auth/:path*",

    // session check and rolling session refresh for the protected area.
    "/protected/:path*",
  ],
};
