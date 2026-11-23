import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";
import { NextRequest, NextResponse } from "next/server";

/**
 * Returns the NBA game schedule for a given Mon-Sun week.
 * Query params: ?start=YYYYMMDD&end=YYYYMMDD
 * Response: { [proTeamId]: { date, opp, home }[] }
 */

const DATE_RE = /^\d{8}$/;
const MAX_DAYS_IN_A_WEEK = 7;

/** "YYYYMMDD" for a UTC date. */
function ymd(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}

/** The UTC date a "YYYYMMDD" names, or null when it's not a real day (Feb 30). */
function parseDay(yyyymmdd: string): Date | null {
  const date = new Date(
    Date.UTC(Number(yyyymmdd.slice(0, 4)), Number(yyyymmdd.slice(4, 6)) - 1, Number(yyyymmdd.slice(6, 8))),
  );
  return ymd(date) === yyyymmdd ? date : null;
}

/**
 * Every day from start to end inclusive, or null if either isn't a real day,
 * the end comes first, or it runs past a week. ESPN gets one request per day,
 * so the cap is what stops a hand-written URL fanning out into hundreds.
 */
function daysOfWeek(start: string, end: string): string[] | null {
  const first = parseDay(start);
  const last = parseDay(end);
  if (!first || !last) return null;
  const count = Math.round((last.getTime() - first.getTime()) / 86_400_000) + 1;
  if (count < 1 || count > MAX_DAYS_IN_A_WEEK) return null;
  return Array.from({ length: count }, (_, i) =>
    ymd(new Date(first.getTime() + i * 86_400_000)),
  );
}

/**
 * One day's scoreboard. ESPN answers a `dates=A-B` range with 400 "Failed to
 * get events endpoint." now, so a week is read a day at a time.
 */
function scoreboardUrl(yyyymmdd: string): string {
  return `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?limit=200&dates=${yyyymmdd}`;
}

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

  const days = daysOfWeek(start, end);
  if (!days) {
    return NextResponse.json(
      { error: "start and end must be real days, at most a week apart" },
      { status: 400 },
    );
  }

  try {
    const upstreamResults = await Promise.all(
      days.map((day) => fetchUpstream(scoreboardUrl(day))),
    );

    // A week with a day missing would undercount games for the prediction, so
    // one failed day fails the week.
    const responses: Response[] = [];
    for (const upstreamResult of upstreamResults) {
      if (!upstreamResult.ok) return upstreamErrorResponse(upstreamResult);
      if (!upstreamResult.response.ok) {
        return NextResponse.json(
          { error: "Failed to fetch NBA schedule" },
          { status: upstreamResult.response.status },
        );
      }
      responses.push(upstreamResult.response);
    }

    const scoreboards = await Promise.all(responses.map((res) => res.json()));
    const events: unknown[] = scoreboards.flatMap((data) => data.events ?? []);

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
