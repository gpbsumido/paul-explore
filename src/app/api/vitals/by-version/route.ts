import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// GET /api/vitals/by-version — returns { byVersion: VersionMetrics[] }
// P75 per metric for the last 5 versions, oldest→newest — auth required
export async function GET() {
  let token: string | undefined;
  try {
    ({ token } = await auth0.getAccessToken());
  } catch (err) {
    console.error("[vitals BFF] GET /by-version — getAccessToken failed:", err);
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const res = await fetch(`${API_URL}/api/vitals/by-version`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) return NextResponse.json({ byVersion: [] });

    const data = await res.json();
    return NextResponse.json({ byVersion: data.byVersion ?? [] });
  } catch (err) {
    console.error("[vitals BFF] GET /by-version — fetch threw:", err);
    return NextResponse.json({ byVersion: [] });
  }
}
