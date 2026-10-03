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

const freeAgents = {
  players: [
    {
      onTeamId: 0,
      player: { id: 30, fullName: "Jaylen Warren", defaultPositionId: 2, proTeamId: 23, eligibleSlots: [2], stats: [] },
    },
  ],
};

function respond(url: string) {
  if (url.includes("proTeamSchedules")) return new Response(JSON.stringify(schedules));
  if (url.includes("mTeam")) return new Response(JSON.stringify(league));
  return new Response(JSON.stringify(freeAgents));
}

function call(season: string) {
  return GET(new NextRequest(`http://localhost/api/nfl/trade/${season}`), {
    params: Promise.resolve({ season }),
  });
}

describe("NFL trade pool route", () => {
  it("returns the parsed pool of rostered players, filtered to rostered at ESPN", async () => {
    const fetchMock = vi.fn((input: string, _init?: RequestInit) => Promise.resolve(respond(input)));
    vi.stubGlobal("fetch", fetchMock);

    const res = await call("2026");
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("public, s-maxage=3600");
    const body = await res.json();
    expect(body.players.map((p: { name: string }) => p.name)).toEqual(["Jahmyr Gibbs"]);
    expect(body.currentWeek).toBe(4);

    const leagueCall = fetchMock.mock.calls.find(([url]) => url.includes("kona_player_info"));
    const init = leagueCall?.[1];
    const filter = new Headers(init?.headers).get("X-Fantasy-Filter");
    expect(JSON.parse(filter ?? "{}")).toEqual({
      players: { filterStatus: { value: ["ONTEAM"] } },
    });
  });

  it("fetches the free-agent pool, sorted and capped, and passes it to the parser", async () => {
    const fetchMock = vi.fn((input: string, _init?: RequestInit) => Promise.resolve(respond(input)));
    vi.stubGlobal("fetch", fetchMock);

    const body = await (await call("2026")).json();
    expect(body.freeAgents.map((p: { name: string }) => p.name)).toEqual(["Jaylen Warren"]);

    const faCall = fetchMock.mock.calls.find(
      ([, init]) => new Headers(init?.headers).get("X-Fantasy-Filter")?.includes("FREEAGENT"),
    );
    const filter = JSON.parse(new Headers(faCall?.[1]?.headers).get("X-Fantasy-Filter") ?? "{}");
    expect(filter.players.filterStatus.value).toEqual(["FREEAGENT", "WAIVERS"]);
    // ESPN refuses a limit without a sort.
    expect(filter.players.limit).toBeGreaterThan(0);
    expect(filter.players.sortPercOwned).toBeDefined();
  });

  it("reads who's on IR from the league's rosters", async () => {
    const fetchMock = vi.fn((input: string, _init?: RequestInit) => Promise.resolve(respond(input)));
    vi.stubGlobal("fetch", fetchMock);
    await call("2026");
    const leagueCall = fetchMock.mock.calls.find(([url]) => url.includes("mTeam"));
    expect(leagueCall?.[0]).toContain("view=mRoster");
  });

  it("passes an upstream failure status through", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(new Response("nope", { status: 503 }))));
    expect((await call("2026")).status).toBe(503);
  });

  it("rejects a malformed season", async () => {
    expect((await call("26")).status).toBe(400);
  });
});
