import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

/**
 * GET /api/google/auth/status
 *
 * Returns { connected: boolean } indicating whether the current user has
 * linked their Google Calendar. Used by the settings page on mount.
 */
export async function GET() {
  let token: string | undefined;
  try {
    ({ token } = await auth0.getAccessToken());
  } catch (err) {
    console.error("[google BFF] GET /auth/status — getAccessToken failed:", err);
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const res = await fetch(`${API_URL}/api/google/auth/status`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      console.error("[google BFF] GET /auth/status — backend returned", res.status);
      return NextResponse.json({ error: "Failed to fetch status" }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[google BFF] GET /auth/status — fetch threw:", err);
    return NextResponse.json({ error: "Backend unavailable" }, { status: 502 });
  }
}
