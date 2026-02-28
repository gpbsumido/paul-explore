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

  // check if the path is public or is api (which handles it's own auth)
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

  // generate a per-request nonce for inline scripts
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  const csp = [
    `default-src 'self'`,
    `script-src 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: https://assets.tcgdex.net https://raw.githubusercontent.com`,
    `font-src 'self'`,
    `connect-src 'self'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
  ].join("; ");

  // pass nonce to layout via request headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  // create the response object
  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // set the CSP header
  response.headers.set("Content-Security-Policy", csp);

  return response;
}

// match all routes except for specified ones
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
