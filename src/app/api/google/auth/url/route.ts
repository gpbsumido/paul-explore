import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

/**
 * GET /api/google/auth/url
 *
 * Asks the backend to generate the Google OAuth authorization URL for the
 * current user. The frontend redirects to that URL to kick off the connect flow.
 *
 * Forwards the ?origin param so the backend can embed it in the signed state
 * and redirect back to the right environment after OAuth completes.
 */
export async function GET(request: Request) {
  let token: string | undefined;
  try {
    ({ token } = await auth0.getAccessToken());
  } catch (err) {
    console.error("[google BFF] GET /auth/url — getAccessToken failed:", err);
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const origin = searchParams.get("origin");

  try {
    const backendUrl = new URL(`${API_URL}/api/google/auth/url`);
    if (origin) backendUrl.searchParams.set("origin", origin);

    const res = await fetch(backendUrl.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      console.error("[google BFF] GET /auth/url — backend returned", res.status);
      return NextResponse.json({ error: "Failed to generate URL" }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[google BFF] GET /auth/url — fetch threw:", err);
    return NextResponse.json({ error: "Backend unavailable" }, { status: 502 });
  }
}
