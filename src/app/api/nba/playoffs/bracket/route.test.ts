import { describe, it, expect, vi, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";

vi.mock("@/lib/nbaSeason", () => ({ currentNbaSeason: () => 2026 }));

import { GET } from "./route";

const ESPN_SCOREBOARD = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard";

afterEach(() => vi.restoreAllMocks());

describe("GET /api/nba/playoffs/bracket", () => {
  it("asks ESPN's playoff scoreboard and attaches its events to the static bracket", async () => {
    const events = [{ id: "401", name: "DET vs ORL" }];
    const requested: URL[] = [];
    server.use(
      http.get(ESPN_SCOREBOARD, ({ request }) => {
        requested.push(new URL(request.url));
        return HttpResponse.json({ events });
      }),
    );

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("public, s-maxage=3600");
    expect(body.espnEvents).toEqual(events);
    expect(body.season).toBe(2026);
    expect(body.matchups).toHaveLength(15);
    expect(requested).toHaveLength(1);
    expect(requested[0].searchParams.get("groups")).toBe("60");
  });

  it("serves the static bracket without espnEvents when ESPN has no playoff games", async () => {
    server.use(http.get(ESPN_SCOREBOARD, () => HttpResponse.json({ events: [] })));

    const body = await (await GET()).json();

    expect(body).not.toHaveProperty("espnEvents");
    expect(body.matchups).toHaveLength(15);
  });

  it("serves the static bracket when ESPN answers with an unexpected shape", async () => {
    server.use(http.get(ESPN_SCOREBOARD, () => HttpResponse.json({ nothing: "useful" })));

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).not.toHaveProperty("espnEvents");
    expect(body.matchups).toHaveLength(15);
  });

  it("serves the static bracket when ESPN returns an error status", async () => {
    server.use(http.get(ESPN_SCOREBOARD, () => HttpResponse.json({ events: [{ id: "x" }] }, { status: 500 })));

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).not.toHaveProperty("espnEvents");
  });

  it("serves the static bracket when ESPN cannot be reached", async () => {
    server.use(http.get(ESPN_SCOREBOARD, () => HttpResponse.error()));

    const res = await GET();

    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("public, s-maxage=3600");
    const body = await res.json();
    expect(body.season).toBe(2026);
    expect(body.matchups).toHaveLength(15);
  });

  it("serves the static bracket when ESPN sends a body that is not JSON", async () => {
    server.use(http.get(ESPN_SCOREBOARD, () => new HttpResponse("<html>", { status: 200 })));

    const res = await GET();

    expect(res.status).toBe(200);
    expect((await res.json()).matchups).toHaveLength(15);
  });

  describe("the static bracket", () => {
    async function staticBracket() {
      server.use(http.get(ESPN_SCOREBOARD, () => HttpResponse.error()));
      return (await GET()).json() as Promise<{
        season: number;
        matchups: {
          id: string;
          round: number;
          conference: string;
          topTeam: { seed: number; abbreviation: string; conference: string };
          bottomTeam: { seed: number; abbreviation: string; conference: string };
        }[];
      }>;
    }

    it("has four first-round series per conference with seeds 1v8, 2v7, 3v6 and 4v5", async () => {
      const { matchups } = await staticBracket();

      for (const conference of ["East", "West"]) {
        const firstRound = matchups.filter((m) => m.round === 1 && m.conference === conference);
        expect(firstRound.map((m) => [m.topTeam.seed, m.bottomTeam.seed])).toEqual([
          [1, 8],
          [2, 7],
          [3, 6],
          [4, 5],
        ]);
        for (const m of firstRound) {
          expect(m.topTeam.conference).toBe(conference);
          expect(m.bottomTeam.conference).toBe(conference);
        }
      }
    });

    it("leaves every later round as TBD placeholders for the picks to fill", async () => {
      const { matchups } = await staticBracket();

      const later = matchups.filter((m) => m.round > 1);

      expect(later.map((m) => m.id)).toEqual([
        "E_R2_M1",
        "E_R2_M2",
        "W_R2_M1",
        "W_R2_M2",
        "E_CF",
        "W_CF",
        "NBA_FINALS",
      ]);
      for (const m of later) {
        expect(m.topTeam.abbreviation).toBe("TBD");
        expect(m.bottomTeam.abbreviation).toBe("TBD");
        expect(m.topTeam.seed).toBe(0);
      }
    });

    it("keeps every matchup id unique", async () => {
      const { matchups } = await staticBracket();
      const ids = matchups.map((m) => m.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });
});
