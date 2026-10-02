import { NextRequest, NextResponse } from "next/server";
import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";
import { parseGameProgress } from "@/lib/nfl/games";

// Live during games -- same short cache as the plays ticker.
const CACHE_CONTROL = "public, s-maxage=30";

const SEASON_RE = /^\d{4}$/;

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const week = Number(params.get("week"));
  if (!Number.isInteger(week) || week < 1 || week > 18) {
    return NextResponse.json({ error: "Invalid week" }, { status: 400 });
  }

  const season = params.get("season") ?? "";
  if (!SEASON_RE.test(season)) {
    return NextResponse.json({ error: "Invalid season" }, { status: 400 });
  }

  const result = await fetchUpstream(
    `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?week=${week}&seasontype=2&year=${season}`,
  );
  if (!result.ok) return upstreamErrorResponse(result);
  if (!result.response.ok) {
    return NextResponse.json(
      { error: "Failed to fetch NFL scoreboard" },
      { status: result.response.status },
    );
  }

  return NextResponse.json(
    { progress: parseGameProgress(await result.response.json()) },
    { headers: { "Cache-Control": CACHE_CONTROL } },
  );
}
