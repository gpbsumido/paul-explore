import { describe, it, expect, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET as scheduleGET } from "./schedule/route";
import { GET as leagueGET } from "./league/[season]/route";

afterEach(() => vi.unstubAllGlobals());

/** Replaces fetch with a spy answering `impl`, and returns the spy. */
function stubFetch(impl: () => Response | Promise<Response>) {
  const fetchSpy = vi.fn((..._args: unknown[]) => impl());
  vi.stubGlobal("fetch", fetchSpy);
  return fetchSpy;
}

/** The URL the route asked ESPN for. */
function requestedUrl(fetchSpy: ReturnType<typeof stubFetch>): string {
  return String(fetchSpy.mock.calls[0][0]);
}

const scheduleRequest = (query: string) =>
  new NextRequest(`http://localhost/api/nba/schedule${query}`);

/** A scoreboard event between two teams, as ESPN shapes it. */
function game(
  date: string,
  home: { id: string; abbreviation?: string },
  away: { id: string; abbreviation?: string },
) {
  return {
    date,
    competitions: [
      {
        competitors: [
          { homeAway: "home", team: home },
          { homeAway: "away", team: away },
        ],
      },
    ],
  };
}

describe("GET /api/nba/schedule", () => {
  it.each([
    ["no params", ""],
    ["no end", "?start=20260101"],
    ["no start", "?end=20260107"],
    ["a dashed date", "?start=2026-01-01&end=20260107"],
    ["a short date", "?start=202601&end=20260107"],
    ["a date with extra digits", "?start=202601011&end=20260107"],
    ["a date inside other text", "?start=x20260101y&end=20260107"],
  ])("rejects %s with a 400 and never calls ESPN", async (_name, query) => {
    const fetchSpy = stubFetch(() => new Response("{}"));

    const res = await scheduleGET(scheduleRequest(query));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "start and end query params required (YYYYMMDD)",
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("asks ESPN for exactly the requested week", async () => {
    const fetchSpy = stubFetch(
      () => new Response(JSON.stringify({ events: [] }), { status: 200 }),
    );

    await scheduleGET(scheduleRequest("?start=20260105&end=20260111"));

    expect(requestedUrl(fetchSpy)).toContain("dates=20260105-20260111");
  });

  it("files each game under both teams, with the opponent and where it is played", async () => {
    stubFetch(
      () =>
        new Response(
          JSON.stringify({
            events: [
              game(
                "2026-01-06T00:30:00Z",
                { id: "13", abbreviation: "LAL" },
                { id: "2", abbreviation: "BOS" },
              ),
            ],
          }),
        ),
    );

    const res = await scheduleGET(scheduleRequest("?start=20260105&end=20260111"));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      "13": [{ date: "2026-01-06", opp: "BOS", home: true }],
      "2": [{ date: "2026-01-06", opp: "LAL", home: false }],
    });
  });

  it("lists a team's games in the order ESPN sent them", async () => {
    stubFetch(
      () =>
        new Response(
          JSON.stringify({
            events: [
              game("2026-01-06T00:30:00Z", { id: "13", abbreviation: "LAL" }, { id: "2", abbreviation: "BOS" }),
              game("2026-01-08T00:30:00Z", { id: "5", abbreviation: "CLE" }, { id: "13", abbreviation: "LAL" }),
            ],
          }),
        ),
    );

    const res = await scheduleGET(scheduleRequest("?start=20260105&end=20260111"));
    const schedule = await res.json();

    expect(schedule["13"]).toEqual([
      { date: "2026-01-06", opp: "BOS", home: true },
      { date: "2026-01-08", opp: "CLE", home: false },
    ]);
  });

  it("falls back to ?? when ESPN leaves out a team abbreviation", async () => {
    stubFetch(
      () =>
        new Response(
          JSON.stringify({
            events: [game("2026-01-06T00:30:00Z", { id: "13" }, { id: "2" })],
          }),
        ),
    );

    const res = await scheduleGET(scheduleRequest("?start=20260105&end=20260111"));
    const schedule = await res.json();

    expect(schedule["13"][0].opp).toBe("??");
    expect(schedule["2"][0].opp).toBe("??");
  });

  it("skips an event that is not a two-team game", async () => {
    stubFetch(
      () =>
        new Response(
          JSON.stringify({
            events: [
              { date: "2026-01-06T00:30:00Z", competitions: [{ competitors: [] }] },
              {
                date: "2026-01-06T00:30:00Z",
                competitions: [
                  {
                    competitors: [
                      { homeAway: "home", team: { id: "13" } },
                      { homeAway: "home", team: { id: "2" } },
                    ],
                  },
                ],
              },
              { date: "2026-01-06T00:30:00Z" },
              {
                date: "2026-01-06T00:30:00Z",
                competitions: [
                  {
                    competitors: [
                      { homeAway: "home", team: { id: "13" } },
                      { homeAway: "away", team: { id: "2" } },
                      { homeAway: "away", team: { id: "9" } },
                    ],
                  },
                ],
              },
            ],
          }),
        ),
    );

    const res = await scheduleGET(scheduleRequest("?start=20260105&end=20260111"));

    expect(await res.json()).toEqual({});
  });

  it("caches the schedule for six hours", async () => {
    stubFetch(() => new Response(JSON.stringify({ events: [] })));

    const res = await scheduleGET(scheduleRequest("?start=20260105&end=20260111"));

    expect(res.headers.get("Cache-Control")).toBe("public, s-maxage=21600");
  });

  it("passes an ESPN error status through with a labelled message", async () => {
    stubFetch(() => new Response("nope", { status: 503 }));

    const res = await scheduleGET(scheduleRequest("?start=20260105&end=20260111"));

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "Failed to fetch NBA schedule" });
  });

  it("answers 502 when ESPN cannot be reached", async () => {
    stubFetch(() => {
      throw new TypeError("fetch failed");
    });

    const res = await scheduleGET(scheduleRequest("?start=20260105&end=20260111"));

    expect(res.status).toBe(502);
  });

  it("answers 502 when ESPN returns something that is not JSON", async () => {
    stubFetch(() => new Response("<html>oops</html>", { status: 200 }));

    const res = await scheduleGET(scheduleRequest("?start=20260105&end=20260111"));

    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: "NBA schedule API unavailable" });
  });
});

describe("GET /api/nba/league/[season]", () => {
  const call = (season: string) =>
    leagueGET(new Request("http://localhost/x"), {
      params: Promise.resolve({ season }),
    });

  it.each(["20x4", "202", "20255", "2025/../x", " 2025"])(
    "rejects the season %j with a 400 and never calls ESPN",
    async (season) => {
      const fetchSpy = stubFetch(() => new Response("{}"));

      const res = await call(season);

      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: "Invalid season" });
      expect(fetchSpy).not.toHaveBeenCalled();
    },
  );

  it("fetches that season's league from ESPN and caches it for a day", async () => {
    const fetchSpy = stubFetch(
      () => new Response(JSON.stringify({ teams: [] }), { status: 200 }),
    );

    const res = await call("2025");

    expect(requestedUrl(fetchSpy)).toContain("/seasons/2025/");
    expect(requestedUrl(fetchSpy)).toContain("/leagues/449389534");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ teams: [] });
    expect(res.headers.get("Cache-Control")).toBe("public, s-maxage=86400");
  });

  it("passes an ESPN error status through with a labelled message", async () => {
    stubFetch(() => new Response("private league", { status: 401 }));

    const res = await call("2025");

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Failed to fetch league data" });
  });
});
