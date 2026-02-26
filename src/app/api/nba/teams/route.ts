import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// Team list is static within a season — 5 minutes is a safe CDN window
const CACHE_CONTROL = "public, s-maxage=300";

export async function GET() {
  try {
    const res = await fetch(`${API_URL}/api/nba/teams`);
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
