import { NextResponse } from "next/server";

// Historical season data never changes once the season ends — a full day of CDN cache is fine
const CACHE_CONTROL = "public, s-maxage=86400";

const SEASON_RE = /^\d{4}$/;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ season: string }> },
) {
  const { season } = await params;

  if (!SEASON_RE.test(season)) {
    return NextResponse.json({ error: "Invalid season" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://lm-api-reads.fantasy.espn.com/apis/v3/games/fba/seasons/${season}/segments/0/leagues/449389534?view=mTeam&view=mRoster&view=mSettings`,
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch league data" },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: { "Cache-Control": CACHE_CONTROL },
    });
  } catch {
    return NextResponse.json(
      { error: "ESPN API unavailable" },
      { status: 502 },
    );
  }
}
