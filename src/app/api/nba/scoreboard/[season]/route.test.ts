import { describe, it, expect, vi, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { NextRequest } from "next/server";
import { server } from "@/test/server";
import { GET } from "./route";

const ESPN_SCOREBOARD = (season: string) =>
  `https://lm-api-reads.fantasy.espn.com/apis/v3/games/fba/seasons/${season}/segments/0/leagues/449389534`;

const request = () => new NextRequest("http://localhost/api/nba/scoreboard/2026");
const params = (season: string) => ({ params: Promise.resolve({ season }) });

afterEach(() => vi.restoreAllMocks());

describe("GET /api/nba/scoreboard/:season", () => {
  it("asks ESPN for that season's scoreboard with all four views and returns the JSON with a one-hour cache", async () => {
    const requested: URL[] = [];
    server.use(
      http.get(ESPN_SCOREBOARD("2026"), ({ request: upstream }) => {
        requested.push(new URL(upstream.url));
        return HttpResponse.json({ schedule: [{ id: 1 }] });
      }),
    );

    const res = await GET(request(), params("2026"));

    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("public, s-maxage=3600");
    expect(await res.json()).toEqual({ schedule: [{ id: 1 }] });
    expect(requested).toHaveLength(1);
    expect(requested[0].searchParams.getAll("view")).toEqual([
      "mScoreboard",
      "mTeam",
      "mRoster",
      "mSettings",
    ]);
  });

  it("uses the season from the path, not a fixed one", async () => {
    let requestedPath = "";
    server.use(
      http.get(ESPN_SCOREBOARD("2024"), ({ request: upstream }) => {
        requestedPath = new URL(upstream.url).pathname;
        return HttpResponse.json({});
      }),
    );

    await GET(request(), params("2024"));

    expect(requestedPath).toContain("/seasons/2024/");
  });

  it.each(["20", "20266", "20x6", "../..", "2026/extra", ""])(
    "rejects the season %j with 400 and never calls ESPN",
    async (season) => {
      const fetchSpy = vi.spyOn(globalThis, "fetch");

      const res = await GET(request(), params(season));

      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: "Invalid season" });
      expect(fetchSpy).not.toHaveBeenCalled();
    },
  );

  it("keeps ESPN's status under its own label when ESPN refuses", async () => {
    server.use(
      http.get(ESPN_SCOREBOARD("2026"), () => HttpResponse.json({ detail: "x" }, { status: 404 })),
    );

    const res = await GET(request(), params("2026"));

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Failed to fetch scoreboard data" });
  });

  it("answers 502 when ESPN cannot be reached", async () => {
    server.use(http.get(ESPN_SCOREBOARD("2026"), () => HttpResponse.error()));

    const res = await GET(request(), params("2026"));

    expect(res.status).toBe(502);
  });

  it("answers 504 when ESPN is too slow", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(
      Object.assign(new Error("deadline"), { name: "TimeoutError" }),
    );

    const res = await GET(request(), params("2026"));

    expect(res.status).toBe(504);
  });
});
