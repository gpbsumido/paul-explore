import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

/**
 * DELETE /api/google/auth/disconnect
 *
 * Stops the user's Google Calendar watch channel and removes their stored
 * tokens. After this their events will no longer sync with Google Calendar.
 * Returns 204 on success.
 */
export async function DELETE() {
  let token: string | undefined;
  try {
    ({ token } = await auth0.getAccessToken());
  } catch (err) {
    console.error("[google BFF] DELETE /auth/disconnect — getAccessToken failed:", err);
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const res = await fetch(`${API_URL}/api/google/auth/disconnect`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      console.error("[google BFF] DELETE /auth/disconnect — backend returned", res.status);
      return NextResponse.json({ error: "Failed to disconnect" }, { status: res.status });
    }
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("[google BFF] DELETE /auth/disconnect — fetch threw:", err);
    return NextResponse.json({ error: "Backend unavailable" }, { status: 502 });
  }
}
