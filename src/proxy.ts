import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";

const PUBLIC_PATHS = ["/", "/auth/login", "/auth/logout", "/auth/callback"];
/**
 *
 * @param request - the request object
 * @returns - the response object
 */
export async function proxy(request: Request) {
  // take in request and return the response from the auth0 middleware
  const res = await auth0.middleware(request);

  const { pathname } = new URL(request.url);
  // check if the path is public or an auth route
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith("/auth/"),
  );

  //  if not public, check if the user is logged in
  if (!isPublic) {
    const session = await auth0.getSession();
    // if not logged in, redirect to login
    if (!session) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
  }

  return res;
}

// match all routes except for specified ones
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
