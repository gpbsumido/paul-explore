import { NextResponse } from "next/server";
import { API_URL } from "@/lib/backendFetch";
import type { LeaderboardEntry } from "@/types/nba";

// Leaderboard is public — no auth required.
// 5-minute CDN cache keeps it reasonably fresh without hammering the backend.
const CACHE_CONTROL = "public, s-maxage=300";

function currentSeasonYear(): number {
  const now = new Date();
  return now.getMonth() >= 9 ? now.getFullYear() + 1 : now.getFullYear();
}

type BackendEntry = {
  rank: number;
  userSub: string;
  displayName: string;
  score: number;
  maxPossible: number;
  breakdown: {
    r1: number;
    r2: number;
    cf: number;
    finals: number;
    bonuses: number;
    mvp: number;
    combinedScoreDiff: number | null;
  };
};

function toLeaderboardEntry(e: BackendEntry): LeaderboardEntry {
  return {
    rank: e.rank,
    sub: e.userSub,
    displayName: e.displayName,
    score: e.score,
    maxScore: e.maxPossible,
    roundBreakdown: [
      { label: "R1", earned: e.breakdown.r1, max: 8 },
      { label: "R2", earned: e.breakdown.r2, max: 8 },
      { label: "CF", earned: e.breakdown.cf, max: 8 },
      {
        label: "Finals",
        earned: e.breakdown.finals + e.breakdown.bonuses + e.breakdown.mvp,
        max: 28,
      },
    ],
  };
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

    const data: { entries: BackendEntry[] } = await res.json();
    const entries = data.entries.map(toLeaderboardEntry);

    return NextResponse.json(
      { entries },
      {
        headers: { "Cache-Control": CACHE_CONTROL },
      },
    );
  } catch {
    return NextResponse.json({ error: "Backend unavailable" }, { status: 502 });
  }
}
