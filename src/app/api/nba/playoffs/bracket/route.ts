import { NextResponse } from "next/server";
import type { PlayoffBracket, PlayoffTeam, PlayoffMatchup } from "@/types/nba";

const CACHE_CONTROL = "public, s-maxage=3600";

// Derive the current NBA season year (the year the season ends).
// Before September → the season that started last fall (e.g. April 2026 → 2026).
function currentSeasonYear(): number {
  const now = new Date();
  return now.getMonth() >= 9 ? now.getFullYear() + 1 : now.getFullYear();
}

// ---- Hardcoded fallback bracket ----
// Used when the ESPN API is unavailable or returns an unexpected shape.
// R2 / CF / Finals slots have placeholder teams — the UI derives those from user picks.

function tbd(conference: "East" | "West"): PlayoffTeam {
  return { seed: 0, teamId: "", abbreviation: "TBD", name: "TBD", conference };
}

function r1(
  id: string,
  conference: "East" | "West",
  top: Omit<PlayoffTeam, "conference">,
  bottom: Omit<PlayoffTeam, "conference">,
): PlayoffMatchup {
  return {
    id,
    topTeam: { ...top, conference },
    bottomTeam: { ...bottom, conference },
    round: 1,
    conference,
  };
}

function laterRound(
  id: string,
  round: number,
  conference: "East" | "West" | "Finals",
): PlayoffMatchup {
  const conf = conference === "Finals" ? "East" : conference;
  return {
    id,
    topTeam: tbd(conf),
    bottomTeam: tbd(conf === "East" ? "East" : "West"),
    round,
    conference,
  };
}

function buildFallbackBracket(season: number): PlayoffBracket {
  const matchups: PlayoffMatchup[] = [
    // East — Round 1 (2025-26 season, verified from ESPN April 2026)
    // DET (1) opponent TBD — play-in game ORL vs CHA on Apr 17 determines 8 seed
    r1(
      "E_R1_M1",
      "East",
      { seed: 1, teamId: "8", abbreviation: "DET", name: "Detroit Pistons" },
      { seed: 8, teamId: "", abbreviation: "TBD", name: "TBD" },
    ),
    r1(
      "E_R1_M2",
      "East",
      { seed: 2, teamId: "2", abbreviation: "BOS", name: "Boston Celtics" },
      // PHI won East play-in (7v8) on Apr 15
      {
        seed: 7,
        teamId: "20",
        abbreviation: "PHI",
        name: "Philadelphia 76ers",
      },
    ),
    r1(
      "E_R1_M3",
      "East",
      { seed: 3, teamId: "18", abbreviation: "NY", name: "New York Knicks" },
      { seed: 6, teamId: "1", abbreviation: "ATL", name: "Atlanta Hawks" },
    ),
    r1(
      "E_R1_M4",
      "East",
      {
        seed: 4,
        teamId: "5",
        abbreviation: "CLE",
        name: "Cleveland Cavaliers",
      },
      { seed: 5, teamId: "28", abbreviation: "TOR", name: "Toronto Raptors" },
    ),

    // West — Round 1 (2025-26 season, verified from ESPN April 2026)
    // OKC (1) opponent TBD — play-in game PHX vs LAC on Apr 17 determines 8 seed
    r1(
      "W_R1_M1",
      "West",
      {
        seed: 1,
        teamId: "25",
        abbreviation: "OKC",
        name: "Oklahoma City Thunder",
      },
      { seed: 8, teamId: "", abbreviation: "TBD", name: "TBD" },
    ),
    r1(
      "W_R1_M2",
      "West",
      { seed: 2, teamId: "24", abbreviation: "SA", name: "San Antonio Spurs" },
      // POR won West play-in (7v8), confirmed by SA vs POR scheduled Apr 19
      {
        seed: 7,
        teamId: "22",
        abbreviation: "POR",
        name: "Portland Trail Blazers",
      },
    ),
    r1(
      "W_R1_M3",
      "West",
      { seed: 3, teamId: "7", abbreviation: "DEN", name: "Denver Nuggets" },
      {
        seed: 6,
        teamId: "16",
        abbreviation: "MIN",
        name: "Minnesota Timberwolves",
      },
    ),
    r1(
      "W_R1_M4",
      "West",
      {
        seed: 4,
        teamId: "13",
        abbreviation: "LAL",
        name: "Los Angeles Lakers",
      },
      { seed: 5, teamId: "10", abbreviation: "HOU", name: "Houston Rockets" },
    ),

    // East — Round 2 (TBD)
    laterRound("E_R2_M1", 2, "East"),
    laterRound("E_R2_M2", 2, "East"),

    // West — Round 2 (TBD)
    laterRound("W_R2_M1", 2, "West"),
    laterRound("W_R2_M2", 2, "West"),

    // Conference Finals (TBD)
    laterRound("E_CF", 3, "East"),
    laterRound("W_CF", 3, "West"),

    // NBA Finals (TBD)
    laterRound("NBA_FINALS", 4, "Finals"),
  ];

  return { season, matchups };
}

// ---- Route handler ----

export async function GET() {
  const season = currentSeasonYear();

  try {
    const espnRes = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?groups=60&limit=32`,
      { next: { revalidate: 3600 } },
    );

    if (espnRes.ok) {
      const espnData = await espnRes.json();
      // Only use ESPN data if it contains playoff events — fall through to the
      // static bracket if the shape is unexpected or no events are present.
      const events: unknown[] = espnData?.events ?? [];
      const hasPlayoffGames = events.length > 0;

      if (hasPlayoffGames) {
        // Return raw ESPN data under a flag so the client can optionally use it,
        // alongside the static bracket which the UI always relies on for structure.
        return NextResponse.json(
          { ...buildFallbackBracket(season), espnEvents: events },
          { headers: { "Cache-Control": CACHE_CONTROL } },
        );
      }
    }
  } catch {
    // Fall through to static bracket
  }

  return NextResponse.json(buildFallbackBracket(season), {
    headers: { "Cache-Control": CACHE_CONTROL },
  });
}
