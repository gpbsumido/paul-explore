import { proxyUpstream } from "@/lib/upstream";
import { FANTASY_LEAGUES } from "@/lib/espn-performances";
import { NextRequest, NextResponse } from "next/server";

// Scores move throughout the week as games are played — 1 hour CDN cache.
const CACHE_CONTROL = "public, s-maxage=3600";

const SEASON_RE = /^\d{4}$/;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ season: string }> },
) {
  const { season } = await params;
  if (!SEASON_RE.test(season)) {
    return NextResponse.json({ error: "Invalid season" }, { status: 400 });
  }

  // Week is optional: omit it and ESPN returns the current scoring period. When
  // given, it must be a real NFL week (1..18); anything else is a bad request.
  const raw = request.nextUrl.searchParams.get("week");
  let scoringPeriod = "";
  if (raw !== null && raw !== "") {
    if (!/^\d{1,2}$/.test(raw) || Number(raw) < 1 || Number(raw) > 18) {
      return NextResponse.json({ error: "Invalid week" }, { status: 400 });
    }
    scoringPeriod = `&scoringPeriodId=${Number(raw)}`;
  }

  const { game, leagueId } = FANTASY_LEAGUES.nfl;
  return proxyUpstream(
    `https://lm-api-reads.fantasy.espn.com/apis/v3/games/${game}/seasons/${season}/segments/0/leagues/${leagueId}?view=mMatchup&view=mMatchupScore&view=mRoster&view=mTeam&view=mSettings${scoringPeriod}`,
    {
      errorLabel: "Failed to fetch NFL scoreboard",
      cacheControl: CACHE_CONTROL,
    },
  );
}
