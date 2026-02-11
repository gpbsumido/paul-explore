import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";

const PUBLIC_PATHS = ["/", "/auth/login", "/auth/logout", "/auth/callback"];

/**
 * @param request - the request object
 * @returns - the response object
 */
export async function proxy(request: Request) {
  // let auth0 handle session cookies and auth routes
  const authRes = await auth0.middleware(request);

  const { pathname } = new URL(request.url);

  // don't add CSP to auth redirects, just return as-is
  if (pathname.startsWith("/auth/")) {
    return authRes;
  }

  // check if the path is public
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p);

  // if not public, check if the user is logged in
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
    `img-src 'self' data:`,
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

  // keep auth0 cookies
  for (const cookie of authRes.headers.getSetCookie()) {
    response.headers.append("set-cookie", cookie);
  }

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
