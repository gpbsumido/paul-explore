import { describe, it, expect, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

afterEach(() => vi.restoreAllMocks());

const league = {
  scoringPeriodId: 4,
  status: { currentMatchupPeriod: 4, finalScoringPeriod: 17 },
  settings: { rosterSettings: { lineupSlotCounts: { "2": 2 } } },
  teams: [{ id: 1, name: "Paul's Perfect Team" }],
  players: [
    {
      onTeamId: 1,
      player: {
        id: 10,
        fullName: "Jahmyr Gibbs",
        defaultPositionId: 2,
        proTeamId: 8,
        eligibleSlots: [2],
        stats: [],
      },
    },
  ],
};

const schedules = { settings: { proTeams: [] } };

function respond(url: string) {
  if (url.includes("proTeamSchedules")) return new Response(JSON.stringify(schedules));
  return new Response(JSON.stringify(league));
}

function call(season: string) {
  return GET(new NextRequest(`http://localhost/api/nfl/trade/${season}`), {
    params: Promise.resolve({ season }),
  });
}

describe("NFL trade pool route", () => {
  it("returns the parsed pool of rostered players, filtered to rostered at ESPN", async () => {
    const fetchMock = vi.fn((input: string) => Promise.resolve(respond(input)));
    vi.stubGlobal("fetch", fetchMock);

    const res = await call("2026");
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("public, s-maxage=3600");
    const body = await res.json();
    expect(body.players.map((p: { name: string }) => p.name)).toEqual(["Jahmyr Gibbs"]);
    expect(body.currentWeek).toBe(4);

    const leagueCall = fetchMock.mock.calls.find(([url]) => url.includes("kona_player_info"));
    const init = leagueCall?.[1] as RequestInit | undefined;
    const filter = new Headers(init?.headers).get("X-Fantasy-Filter");
    expect(JSON.parse(filter ?? "{}")).toEqual({
      players: { filterStatus: { value: ["ONTEAM"] } },
    });
  });

  it("passes an upstream failure status through", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(new Response("nope", { status: 503 }))));
    expect((await call("2026")).status).toBe(503);
  });

  it("rejects a malformed season", async () => {
    expect((await call("26")).status).toBe(400);
  });
});
