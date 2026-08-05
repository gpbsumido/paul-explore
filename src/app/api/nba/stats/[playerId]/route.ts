import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";
import { API_URL } from "@/lib/apiUrl";
import { NextResponse, type NextRequest } from "next/server";


// Stats update daily at most — 5 min CDN cache keeps the NBA API rate limits comfortable
const CACHE_CONTROL = "public, s-maxage=300";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  const { playerId } = await params;

  try {
    const upstreamResult = await fetchUpstream(`${API_URL}/api/nba/stats/${playerId}`);
    if (!upstreamResult.ok) return upstreamErrorResponse(upstreamResult);
    const res = upstreamResult.response;
    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch stats" },
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
