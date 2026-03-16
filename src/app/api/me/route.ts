import { auth0 } from "@/lib/auth0";
import { NextResponse } from "next/server";

/**
 * Returns the logged-in user's name and email from the Auth0 session cookie.
 * Used by FeatureHub to hydrate the header after the hub renders — page.tsx calls
 * getSession() for the auth branch decision, but FeatureHub fetches user details
 * separately on mount so the name fills in after first paint without blocking LCP.
 * Returns null for both fields if there's no active session.
 */
export async function GET() {
  const session = await auth0.getSession();
  if (!session) return NextResponse.json({ name: null, email: null });
  const { name, email } = session.user;
  return NextResponse.json({ name: name ?? null, email: email ?? null });
}
