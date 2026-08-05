import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";
import { API_URL } from "@/lib/apiUrl";
import { NextResponse } from "next/server";


// Team list is static within a season — 5 minutes is a safe CDN window
const CACHE_CONTROL = "public, s-maxage=300";

export async function GET() {
  try {
    const upstreamResult = await fetchUpstream(`${API_URL}/api/nba/teams`);
    if (!upstreamResult.ok) return upstreamErrorResponse(upstreamResult);
    const res = upstreamResult.response;
    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch teams" },
        { status: res.status }
      );
    }
    const data = await res.json();
    return NextResponse.json(data, {
      headers: { "Cache-Control": CACHE_CONTROL },
    });
  } catch {
    return NextResponse.json(
      { error: "Backend unavailable" },
      { status: 502 }
    );
  }
}
