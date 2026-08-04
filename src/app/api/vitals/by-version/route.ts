import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";
import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// GET /api/vitals/by-version — returns { byVersion: VersionMetrics[] }
// P75 per metric for the last 5 versions, oldest→newest. Public (same pattern
// as /api/vitals GET): forwards a token when present, otherwise unauthenticated.
export async function GET() {
  let token: string | undefined;
  try {
    ({ token } = await auth0.getAccessToken());
  } catch {
    token = undefined;
  }

  try {
    const upstreamResult = await fetchUpstream(`${API_URL}/api/vitals/by-version`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!upstreamResult.ok) return upstreamErrorResponse(upstreamResult);
    const res = upstreamResult.response;

    if (!res.ok) {
      console.error(
        "[vitals BFF] GET /by-version — backend error:",
        res.status,
      );
      return NextResponse.json(
        { error: "Failed to fetch version metrics" },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json({ byVersion: data.byVersion ?? [] });
  } catch (err) {
    console.error("[vitals BFF] GET /by-version — fetch threw:", err);
    return NextResponse.json({ error: "Backend unavailable" }, { status: 502 });
  }
}
