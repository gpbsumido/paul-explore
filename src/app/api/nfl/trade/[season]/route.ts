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

// The waiver wire: pickups for spots a trade opens, and the replacement level
// scarcity is measured against. ESPN refuses a limit without a sort, so the
// most-owned 100 it is.
const FREE_AGENT_FILTER = JSON.stringify({
  players: {
    filterStatus: { value: ["FREEAGENT", "WAIVERS"] },
    limit: 100,
    sortPercOwned: { sortPriority: 1, sortAsc: false },
  },
});

/**
 * The league's rostered players with projections, its settings, the NFL
 * schedule and the top free agents, parsed into a TradePool here so the client
 * gets ~200 players instead of ESPN's megabytes of raw stats.
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
  const leagueUrl = `https://lm-api-reads.fantasy.espn.com/apis/v3/games/${game}/seasons/${season}/segments/0/leagues/${leagueId}`;
  const [leagueResult, scheduleResult, freeAgentResult] = await Promise.all([
    // mRoster says who's in an IR slot, which doesn't count against roster size.
    fetchUpstream(`${leagueUrl}?view=kona_player_info&view=mTeam&view=mSettings&view=mRoster`, {
      headers: { "X-Fantasy-Filter": ROSTERED_FILTER },
    }),
    fetchUpstream(
      `https://lm-api-reads.fantasy.espn.com/apis/v3/games/${game}/seasons/${season}?view=proTeamSchedules_wl`,
    ),
    fetchUpstream(`${leagueUrl}?view=kona_player_info`, {
      headers: { "X-Fantasy-Filter": FREE_AGENT_FILTER },
    }),
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

  // Free agents only refine the numbers; without them the analyzer still works,
  // just without pickups or a replacement baseline.
  const freeAgents =
    freeAgentResult.ok && freeAgentResult.response.ok ? await freeAgentResult.response.json() : undefined;

  const pool = parseTradePool(
    await leagueResult.response.json(),
    await scheduleResult.response.json(),
    Number(season),
    freeAgents,
  );

  return NextResponse.json(pool, { headers: { "Cache-Control": CACHE_CONTROL } });
}
