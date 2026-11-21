import { describe, it, expect, vi, afterEach } from "vitest";

vi.mock("@/lib/upstream", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/upstream")>("@/lib/upstream");
  return { ...actual, fetchUpstream: vi.fn() };
});

import { NextRequest } from "next/server";
import { fetchUpstream } from "@/lib/upstream";
import { GET } from "./route";

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

/** The ESPN reply the route reads: free agents sit on team 0, season stats have an id starting "00". */
function espnReply(players: unknown[]) {
  return {
    ok: true,
    response: Response.json({ players }),
  } as Awaited<ReturnType<typeof fetchUpstream>>;
}

const get = (query = "") =>
  GET(new NextRequest(`http://localhost:3000/api/nba/freeagents${query}`));

describe("GET /api/nba/freeagents", () => {
  it("defaults to the current season rather than a year written into the code", async () => {
    vi.useFakeTimers({ now: new Date(2026, 10, 19), toFake: ["Date"] });
    vi.mocked(fetchUpstream).mockResolvedValue({
      ok: true,
      response: Response.json({ players: [] }),
    } as Awaited<ReturnType<typeof fetchUpstream>>);

    await GET(new NextRequest("http://localhost:3000/api/nba/freeagents"));

    expect(vi.mocked(fetchUpstream).mock.calls[0][0]).toContain("/seasons/2027/");
  });

  it("turns ESPN's free agents into players with a per-game average, skipping rostered ones", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue(
      espnReply([
        {
          onTeamId: 0,
          player: {
            id: 7,
            fullName: "Free Agent",
            defaultPositionId: 3,
            proTeamId: 12,
            injuryStatus: "DAY_TO_DAY",
            stats: [
              { id: "102026", stats: { "42": 99 }, appliedTotal: 999 },
              { id: "002026", stats: { "42": 30 }, appliedTotal: 1000 },
            ],
          },
        },
        {
          onTeamId: 4,
          player: { id: 8, fullName: "Already Rostered", stats: [] },
        },
        {
          onTeamId: 0,
          player: { id: 9, fullName: "No Games", stats: [] },
        },
      ]),
    );

    const res = await get("?season=2026");

    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("public, s-maxage=3600");
    expect(await res.json()).toEqual([
      {
        id: 7,
        name: "Free Agent",
        position: 3,
        proTeamId: 12,
        avgPts: 33.3,
        injuryStatus: "DAY_TO_DAY",
      },
      { id: 9, name: "No Games", avgPts: 0 },
    ]);
  });

  it("caps the number of players asked of ESPN at 25", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue(espnReply([]));

    await get("?season=2026&limit=500");

    const [url, init] = vi.mocked(fetchUpstream).mock.calls[0];
    expect(url).toContain("/seasons/2026/");
    const filter = JSON.parse(
      new Headers(init?.headers).get("x-fantasy-filter") ?? "{}",
    );
    expect(filter.players.limit).toBe(25);
    expect(filter.players.filterStatus.value).toEqual(["FREEAGENT"]);
  });

  it("asks for ten players when no limit is given", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue(espnReply([]));

    await get("?season=2026");

    const [, init] = vi.mocked(fetchUpstream).mock.calls[0];
    const filter = JSON.parse(
      new Headers(init?.headers).get("x-fantasy-filter") ?? "{}",
    );
    expect(filter.players.limit).toBe(10);
  });

  it("refuses a season that is not four digits, without calling ESPN", async () => {
    const res = await get("?season=2026/../leagues");

    expect(res.status).toBe(400);
    expect(fetchUpstream).not.toHaveBeenCalled();
  });

  it("passes ESPN's failure status through", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue({
      ok: true,
      response: new Response("nope", { status: 503 }),
    } as Awaited<ReturnType<typeof fetchUpstream>>);

    const res = await get("?season=2026");

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "Failed to fetch free agents" });
  });

  it("answers 504 when ESPN times out", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue({
      ok: false,
      cause: "timeout",
      message: "timed out",
    });

    const res = await get("?season=2026");

    expect(res.status).toBe(504);
  });
});
