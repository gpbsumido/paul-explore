import { NextResponse } from "next/server";
import { API_URL } from "@/lib/backendFetch";

// Leaderboard is public — no auth required.
// 5-minute CDN cache keeps it reasonably fresh without hammering the backend.
const CACHE_CONTROL = "public, s-maxage=300";

function currentSeasonYear(): number {
  const now = new Date();
  return now.getMonth() >= 9 ? now.getFullYear() + 1 : now.getFullYear();
}

export async function GET() {
  const season = currentSeasonYear();

  try {
    const res = await fetch(
      `${API_URL}/api/nba/playoffs/leaderboard/${season}`,
      { next: { revalidate: 300 } },
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch leaderboard" },
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
