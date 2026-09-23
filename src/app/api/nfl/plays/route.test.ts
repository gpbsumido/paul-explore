import { describe, it, expect, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

afterEach(() => vi.restoreAllMocks());

function scoreboardResponse() {
  return new Response(
    JSON.stringify({
      events: [
        {
          id: "401772725",
          competitions: [
            {
              competitors: [
                { team: { abbreviation: "JAX" } },
                { team: { abbreviation: "CIN" } },
              ],
            },
          ],
        },
      ],
    }),
    { status: 200 },
  );
}

function summaryResponse(text = "Dyami Brown 9 Yd pass from Trevor Lawrence") {
  return new Response(
    JSON.stringify({
      scoringPlays: [
        {
          id: "1",
          text,
          team: { abbreviation: "JAX" },
          period: { number: 1 },
          clock: { displayValue: "10:51" },
          scoringType: { abbreviation: "TD" },
          awayScore: 7,
          homeScore: 0,
        },
      ],
    }),
    { status: 200 },
  );
}

function call(query: string) {
  const req = new NextRequest(`http://localhost/api/nfl/plays?${query}`);
  return GET(req);
}

describe("NFL plays proxy route", () => {
  it("resolves the requested team's game and returns its scoring plays", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(scoreboardResponse())
      .mockResolvedValueOnce(summaryResponse());
    vi.stubGlobal("fetch", fetchMock);

    const res = await call("teamIds=4&week=3&season=2026");
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("public, s-maxage=30");
    const body = await res.json();
    expect(body.plays).toHaveLength(1);
    expect(body.plays[0].text).toContain("Trevor Lawrence");
  });

  it("skips a single failed game summary rather than failing the whole response", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(scoreboardResponse())
      .mockResolvedValueOnce(new Response("nope", { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);

    const res = await call("teamIds=4&week=3&season=2026");
    expect(res.status).toBe(200);
    expect((await res.json()).plays).toEqual([]);
  });

  it("returns an empty list when no requested team has a game this week", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ events: [] }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const res = await call("teamIds=4&week=3&season=2026");
    expect(res.status).toBe(200);
    expect((await res.json()).plays).toEqual([]);
  });

  it("rejects missing or malformed teamIds", async () => {
    expect((await call("week=3&season=2026")).status).toBe(400);
    expect((await call("teamIds=abc&week=3&season=2026")).status).toBe(400);
  });

  it("rejects an out-of-range week or malformed season", async () => {
    expect((await call("teamIds=4&week=0&season=2026")).status).toBe(400);
    expect((await call("teamIds=4&week=3&season=26")).status).toBe(400);
  });
});
