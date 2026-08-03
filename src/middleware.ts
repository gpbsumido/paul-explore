import { NextResponse, type NextRequest } from "next/server";

import { VISITOR_COOKIE, newVisitorId } from "@/lib/operator-visitor";

const SIX_MONTHS_SECONDS = 60 * 60 * 24 * 180;

/**
 * Issues a visitor cookie for the operator dashboard.
 *
 * Set here rather than in each route handler because there are fifteen of them
 * and one of them forgetting would mean a visitor silently falls back to the
 * shared bucket. httpOnly because nothing in the browser needs to read it, and
 * lax because it is only ever sent to this origin.
 */
// ts-prune-ignore-next -- Next.js imports this by filename, not by reference.
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  if (request.cookies.get(VISITOR_COOKIE)) return response;

  response.cookies.set(VISITOR_COOKIE, newVisitorId(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SIX_MONTHS_SECONDS,
  });
  return response;
}

// ts-prune-ignore-next -- read by Next.js to decide which paths run the middleware.
export const config = {
  matcher: ["/operator/:path*", "/api/operator/:path*"],
};
