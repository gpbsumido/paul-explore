import { proxyUpstream } from "@/lib/upstream";
import { FANTASY_LEAGUES } from "@/lib/espn-performances";
import { NextRequest, NextResponse } from "next/server";

// Scores move throughout the week as games are played — 1 hour CDN cache.
const CACHE_CONTROL = "public, s-maxage=3600";

const SEASON_RE = /^\d{4}$/;

/** NFL fantasy weeks run 1..18; anything outside that is a bad request. */
function parseWeek(raw: string | null): number | null {
  if (!raw || !/^\d{1,2}$/.test(raw)) return null;
  const week = Number(raw);
  return week >= 1 && week <= 18 ? week : null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ season: string }> },
) {
  const { season } = await params;
  if (!SEASON_RE.test(season)) {
    return NextResponse.json({ error: "Invalid season" }, { status: 400 });
  }

  const week = parseWeek(request.nextUrl.searchParams.get("week"));
  if (week === null) {
    return NextResponse.json({ error: "Invalid week" }, { status: 400 });
  }

  const { game, leagueId } = FANTASY_LEAGUES.nfl;
  return proxyUpstream(
    `https://lm-api-reads.fantasy.espn.com/apis/v3/games/${game}/seasons/${season}/segments/0/leagues/${leagueId}?view=mMatchup&view=mMatchupScore&view=mRoster&view=mTeam&view=mSettings&scoringPeriodId=${week}`,
    {
      errorLabel: "Failed to fetch NFL scoreboard",
      cacheControl: CACHE_CONTROL,
    },
  );
}
