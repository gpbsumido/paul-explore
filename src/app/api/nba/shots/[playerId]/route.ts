import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";
import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// Shot data is seasonal and doesn't change often — 24hr CDN cache
const CACHE_CONTROL = "public, s-maxage=86400";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ playerId: string }> },
) {
  const { playerId } = await params;

  try {
    const upstreamResult = await fetchUpstream(`${API_URL}/api/nba/shots/${playerId}`);
    if (!upstreamResult.ok) return upstreamErrorResponse(upstreamResult);
    const res = upstreamResult.response;
    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch shot data" },
        { status: res.status },
      );
    }
    const data = await res.json();
    return NextResponse.json(data, {
      headers: { "Cache-Control": CACHE_CONTROL },
    });
  } catch {
    return NextResponse.json({ error: "Backend unavailable" }, { status: 502 });
  }
}
