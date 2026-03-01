import { auth0 } from "@/lib/auth0";
import { NextResponse } from "next/server";

/**
 * Returns the logged-in user's name and email from the Auth0 session cookie.
 * Used by FeatureHub to hydrate the header after the static /protected page loads,
 * so the page itself can stay plain sync (no getSession call) and get served from
 * the CDN edge instead of a cold serverless function. Returns null for both fields
 * if there's no active session.
 */
export async function GET() {
  const session = await auth0.getSession();
  if (!session) return NextResponse.json({ name: null, email: null });
  const { name, email } = session.user;
  return NextResponse.json({ name: name ?? null, email: email ?? null });
}
