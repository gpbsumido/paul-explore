import { NextRequest, NextResponse } from "next/server";
import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";
import { FANTASY_LEAGUES } from "@/lib/espn-performances";
import { parseTradePool } from "@/lib/nfl/trade";

// Projections and rosters move a few times a day, not by the minute.
const CACHE_CONTROL = "public, s-maxage=3600";

const SEASON_RE = /^\d{4}$/;

// Only players on a fantasy roster can be traded. Without this filter ESPN
// returns its default player page instead of the league's rosters.
const ROSTERED_FILTER = JSON.stringify({
  players: { filterStatus: { value: ["ONTEAM"] } },
});

/**
 * The league's rostered players with projections, plus the NFL schedule, parsed
 * into a TradePool here so the client gets ~100 players instead of ESPN's
 * megabyte of raw stats.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ season: string }> },
) {
  const { season } = await params;
  if (!SEASON_RE.test(season)) {
    return NextResponse.json({ error: "Invalid season" }, { status: 400 });
  }

  const { game, leagueId } = FANTASY_LEAGUES.nfl;
  const [leagueResult, scheduleResult] = await Promise.all([
    fetchUpstream(
      `https://lm-api-reads.fantasy.espn.com/apis/v3/games/${game}/seasons/${season}/segments/0/leagues/${leagueId}?view=kona_player_info&view=mTeam&view=mSettings`,
      { headers: { "X-Fantasy-Filter": ROSTERED_FILTER } },
    ),
    fetchUpstream(
      `https://lm-api-reads.fantasy.espn.com/apis/v3/games/${game}/seasons/${season}?view=proTeamSchedules_wl`,
    ),
  ]);

  if (!leagueResult.ok) return upstreamErrorResponse(leagueResult);
  if (!scheduleResult.ok) return upstreamErrorResponse(scheduleResult);
  const failed = [leagueResult.response, scheduleResult.response].find((r) => !r.ok);
  if (failed) {
    return NextResponse.json(
      { error: "Failed to fetch NFL trade data" },
      { status: failed.status },
    );
  }

  const pool = parseTradePool(
    await leagueResult.response.json(),
    await scheduleResult.response.json(),
    Number(season),
  );

  return NextResponse.json(pool, { headers: { "Cache-Control": CACHE_CONTROL } });
}
