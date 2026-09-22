import { NextRequest, NextResponse } from "next/server";
import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";
import { eventIdsByAbbrev, parseScoringPlays } from "@/lib/nfl/plays";
import { NFL_PRO_TEAM_ABBREV } from "@/types/espn-nfl";

// Live during games -- short cache so the ticker doesn't go stale mid-play.
const CACHE_CONTROL = "public, s-maxage=30";

const SEASON_RE = /^\d{4}$/;

function parseTeamIds(raw: string | null): number[] | null {
  if (!raw) return null;
  const ids = raw.split(",").map(Number);
  if (ids.length === 0 || ids.some((n) => !Number.isInteger(n) || n < 1)) {
    return null;
  }
  return [...new Set(ids)];
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const teamIds = parseTeamIds(params.get("teamIds"));
  if (!teamIds) {
    return NextResponse.json({ error: "Invalid teamIds" }, { status: 400 });
  }

  const week = Number(params.get("week"));
  if (!Number.isInteger(week) || week < 1 || week > 18) {
    return NextResponse.json({ error: "Invalid week" }, { status: 400 });
  }

  const season = params.get("season") ?? "";
  if (!SEASON_RE.test(season)) {
    return NextResponse.json({ error: "Invalid season" }, { status: 400 });
  }

  const scoreboardResult = await fetchUpstream(
    `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?week=${week}&seasontype=2&year=${season}`,
  );
  if (!scoreboardResult.ok) return upstreamErrorResponse(scoreboardResult);
  if (!scoreboardResult.response.ok) {
    return NextResponse.json(
      { error: "Failed to fetch NFL scoreboard" },
      { status: scoreboardResult.response.status },
    );
  }
  const eventIds = eventIdsByAbbrev(await scoreboardResult.response.json());

  const abbrevs = new Set(
    teamIds.map((id) => NFL_PRO_TEAM_ABBREV[id]).filter((a): a is string => !!a),
  );
  const uniqueEventIds = [
    ...new Set(
      [...abbrevs].map((a) => eventIds.get(a)).filter((id): id is string => !!id),
    ),
  ];

  const summaries = await Promise.all(
    uniqueEventIds.map((eventId) =>
      fetchUpstream(
        `https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=${eventId}`,
      ),
    ),
  );

  const plays = [];
  for (const result of summaries) {
    if (!result.ok || !result.response.ok) continue;
    plays.push(...parseScoringPlays(await result.response.json()));
  }

  return NextResponse.json(
    { plays },
    { headers: { "Cache-Control": CACHE_CONTROL } },
  );
}
