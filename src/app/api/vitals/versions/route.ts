import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// GET /api/vitals/versions — returns { versions: string[] }
// auth required (same pattern as /api/vitals GET)
export async function GET() {
  let token: string | undefined;
  try {
    ({ token } = await auth0.getAccessToken());
  } catch (err) {
    console.error("[vitals BFF] GET /versions — getAccessToken failed:", err);
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const res = await fetch(`${API_URL}/api/vitals/versions`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      console.error("[vitals BFF] GET /versions — backend error:", res.status);
      return NextResponse.json(
        { error: "Failed to fetch versions" },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json({ versions: data.versions ?? [] });
  } catch (err) {
    console.error("[vitals BFF] GET /versions — fetch threw:", err);
    return NextResponse.json({ error: "Backend unavailable" }, { status: 502 });
  }
}
