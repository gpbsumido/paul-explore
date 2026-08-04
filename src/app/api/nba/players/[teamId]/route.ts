import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";
import { NextResponse, type NextRequest } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// Player rosters don't change mid-session — CDN can hold this for 5 minutes
const CACHE_CONTROL = "public, s-maxage=300";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params;

  try {
    const upstreamResult = await fetchUpstream(`${API_URL}/api/nba/players/${teamId}`);
    if (!upstreamResult.ok) return upstreamErrorResponse(upstreamResult);
    const res = upstreamResult.response;
    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch players" },
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
