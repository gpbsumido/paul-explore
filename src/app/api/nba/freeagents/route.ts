import { NextRequest, NextResponse } from "next/server";

/**
 * Returns top free agents for the fantasy league sorted by season total.
 * Query params: ?season=YYYY&limit=10
 */

const SEASON_RE = /^\d{4}$/;
const CACHE_CONTROL = "public, s-maxage=3600";

export async function GET(request: NextRequest) {
  const season = request.nextUrl.searchParams.get("season") ?? "2026";
  const limit = Math.min(
    Number(request.nextUrl.searchParams.get("limit") ?? "10"),
    25,
  );

  if (!SEASON_RE.test(season)) {
    return NextResponse.json({ error: "Invalid season" }, { status: 400 });
  }

  try {
    const filter = JSON.stringify({
      players: {
        filterStatus: { value: ["FREEAGENT"] },
        sortAppliedStatTotal: {
          sortAsc: false,
          sortPriority: 1,
          value: `00${season}`,
        },
        limit,
      },
    });

    const res = await fetch(
      `https://lm-api-reads.fantasy.espn.com/apis/v3/games/fba/seasons/${season}/segments/0/leagues/449389534?view=kona_player_info&scoringPeriodId=162`,
      { headers: { "x-fantasy-filter": filter } },
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch free agents" },
        { status: res.status },
      );
    }

    const data = await res.json();
    const players: {
      id: number;
      name: string;
      position: number;
      proTeamId: number;
      avgPts: number;
      injuryStatus?: string;
    }[] = [];

    for (const entry of data.players ?? []) {
      if (entry.onTeamId !== 0) continue;
      const p = entry.player;
      if (!p) continue;

      const seasonStats = p.stats?.find((s: { id: string }) =>
        s.id.startsWith("00"),
      );
      const gp = seasonStats?.stats?.["42"] ?? 0;
      const total = seasonStats?.appliedTotal ?? 0;
      const avgPts = gp > 0 ? Math.round((total / gp) * 10) / 10 : 0;

      players.push({
        id: p.id,
        name: p.fullName,
        position: p.defaultPositionId,
        proTeamId: p.proTeamId,
        avgPts,
        injuryStatus: p.injuryStatus,
      });
    }

    return NextResponse.json(players, {
      headers: { "Cache-Control": CACHE_CONTROL },
    });
  } catch {
    return NextResponse.json(
      { error: "ESPN API unavailable" },
      { status: 502 },
    );
  }
}
