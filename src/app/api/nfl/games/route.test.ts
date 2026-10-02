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
          status: { clock: 0, period: 4, type: { state: "post" } },
          competitions: [
            {
              competitors: [
                { team: { abbreviation: "CLE" } },
                { team: { abbreviation: "PIT" } },
              ],
            },
          ],
        },
      ],
    }),
    { status: 200 },
  );
}

function call(query: string) {
  return GET(new NextRequest(`http://localhost/api/nfl/games?${query}`));
}

describe("NFL games proxy route", () => {
  it("returns each team's share of its game still to play", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(scoreboardResponse()));

    const res = await call("week=4&season=2026");
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("public, s-maxage=30");
    expect((await res.json()).progress).toEqual({ CLE: 0, PIT: 0 });
  });

  it("passes an upstream failure status through", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(new Response("nope", { status: 503 })),
    );
    expect((await call("week=4&season=2026")).status).toBe(503);
  });

  it("rejects an out-of-range week or malformed season", async () => {
    expect((await call("week=0&season=2026")).status).toBe(400);
    expect((await call("week=19&season=2026")).status).toBe(400);
    expect((await call("week=4&season=26")).status).toBe(400);
  });
});
