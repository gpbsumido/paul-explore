import { auth0 } from "@/lib/auth0";
import { isAllowedEmail } from "@/lib/emailAllowlist";
import { NextResponse } from "next/server";

/**
 * Returns the logged-in user's name and email from the Auth0 session cookie.
 * Used by FeatureHub to hydrate the header after the hub renders — page.tsx calls
 * getSession() for the auth branch decision, but FeatureHub fetches user details
 * separately on mount so the name fills in after first paint without blocking LCP.
 * Returns null for both fields if there's no active session.
 *
 * `isFlagAdmin` rides along so the flags console can lock the admin-tier cards
 * with the right explanation instead of guessing. It is a hint for the UI, not
 * a gate -- the API route re-derives it from the session on every write, so
 * lying about it here would change what the page renders and nothing else.
 */
export async function GET() {
  const session = await auth0.getSession();
  if (!session)
    return NextResponse.json({
      name: null,
      email: null,
      sub: null,
      isFlagAdmin: false,
    });
  const { name, email, sub } = session.user;
  return NextResponse.json({
    name: name ?? null,
    email: email ?? null,
    sub: sub ?? null,
    isFlagAdmin: isAllowedEmail({
      email,
      emailVerified: session.user.email_verified === true,
      allowlist: process.env.FLAG_ADMIN_ALLOWED_EMAILS,
    }),
  });
}
