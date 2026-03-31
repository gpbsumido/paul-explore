import { NextRequest, NextResponse } from "next/server";

/**
 * Returns the NBA game schedule for a given Mon-Sun week.
 * Query params: ?start=YYYYMMDD&end=YYYYMMDD
 * Response: { [proTeamId]: { date, opp, home }[] }
 */

const DATE_RE = /^\d{8}$/;

// games don't change mid-week, cache for 6 hours
const CACHE_CONTROL = "public, s-maxage=21600";

export async function GET(request: NextRequest) {
  const start = request.nextUrl.searchParams.get("start");
  const end = request.nextUrl.searchParams.get("end");

  if (!start || !end || !DATE_RE.test(start) || !DATE_RE.test(end)) {
    return NextResponse.json(
      { error: "start and end query params required (YYYYMMDD)" },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?limit=200&dates=${start}-${end}`,
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch NBA schedule" },
        { status: res.status },
      );
    }

    const data = await res.json();
    const events: unknown[] = data.events ?? [];

    // build map: proTeamId -> game list
    const schedule: Record<
      number,
      { date: string; opp: string; home: boolean }[]
    > = {};

    for (const ev of events) {
      const event = ev as {
        date?: string;
        competitions?: {
          competitors?: {
            homeAway?: string;
            team?: { id?: string; abbreviation?: string };
          }[];
        }[];
      };
      const date = event.date?.slice(0, 10) ?? "";
      const competitors = event.competitions?.[0]?.competitors ?? [];
      if (competitors.length !== 2) continue;

      const home = competitors.find((c) => c.homeAway === "home");
      const away = competitors.find((c) => c.homeAway === "away");
      if (!home?.team?.id || !away?.team?.id) continue;

      const homeId = Number(home.team.id);
      const awayId = Number(away.team.id);

      schedule[homeId] ??= [];
      schedule[homeId].push({
        date,
        opp: away.team.abbreviation ?? "??",
        home: true,
      });

      schedule[awayId] ??= [];
      schedule[awayId].push({
        date,
        opp: home.team.abbreviation ?? "??",
        home: false,
      });
    }

    return NextResponse.json(schedule, {
      headers: { "Cache-Control": CACHE_CONTROL },
    });
  } catch {
    return NextResponse.json(
      { error: "NBA schedule API unavailable" },
      { status: 502 },
    );
  }
}
