import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/upstream", async () => {
  const actual = await vi.importActual<typeof import("@/lib/upstream")>("@/lib/upstream");
  return { ...actual, fetchUpstream: vi.fn() };
});
vi.mock("@/lib/auth0", () => ({
  auth0: { getAccessToken: vi.fn(), getSession: vi.fn() },
}));
vi.mock("@/lib/espn-nightly", () => ({ loadNightlySlate: vi.fn() }));
vi.mock("@/lib/espn-nfl", () => ({ loadNflWeek: vi.fn(), loadNflSeason: vi.fn() }));

import { NextRequest } from "next/server";
import { fetchUpstream } from "@/lib/upstream";
import { auth0 } from "@/lib/auth0";
import { loadNightlySlate } from "@/lib/espn-nightly";
import { loadNflWeek, loadNflSeason } from "@/lib/espn-nfl";
import { nbaFantasyLeagueUrl } from "@/lib/espn-performances";
import { POST } from "./route";

/**
 * The rip regenerates the slate on the server so the client can't choose its
 * own pool. It has to regenerate the slate the page is showing, though, and it
 * didn't: the page honours ?season= and builds an NBA season view from the
 * fantasy league, while the rip always used 2025 and always the nightly slate.
 * Every pack in season mode or for another year came out of a different pool
 * from the one on screen.
 */
const rip = (body: unknown) =>
  POST(
    new NextRequest("http://localhost/api/card-lab/packs/open", {
      method: "POST",
      body: JSON.stringify(body),
    }),
    undefined,
  );

const emptySlate = { cards: [], error: false, date: "2024-04-17", week: 1, latestWeek: 1 };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(auth0.getAccessToken).mockResolvedValue({ token: "t", expiresAt: 0 });
  vi.mocked(loadNightlySlate).mockResolvedValue(emptySlate);
  vi.mocked(loadNflWeek).mockResolvedValue(emptySlate);
  vi.mocked(loadNflSeason).mockResolvedValue(emptySlate);
  vi.mocked(fetchUpstream).mockResolvedValue({
    ok: true,
    response: new Response(JSON.stringify({}), { status: 200 }),
  });
});

describe("POST /api/card-lab/packs/open draws from the slate on screen", () => {
  it("rips an NBA season view from the fantasy league, for that season", async () => {
    await rip({ sport: "nba", mode: "season", season: "2024" });

    expect(loadNightlySlate).not.toHaveBeenCalled();
    expect(vi.mocked(fetchUpstream).mock.calls[0][0]).toBe(nbaFantasyLeagueUrl("2024"));
  });

  it("rips a nightly slate from the season asked for", async () => {
    await rip({ sport: "nba", mode: "nightly", season: "2024", date: "2024-04-17" });

    expect(loadNightlySlate).toHaveBeenCalledWith(
      expect.objectContaining({ season: "2024", date: "2024-04-17" }),
    );
  });

  it("rips an NFL week from the season asked for", async () => {
    await rip({ sport: "nfl", mode: "nightly", season: "2024", week: 3 });

    expect(loadNflWeek).toHaveBeenCalledWith({ season: "2024", week: 3 });
  });

  it("still defaults to the current season when none is sent", async () => {
    await rip({ sport: "nfl", mode: "season" });

    expect(loadNflSeason).toHaveBeenCalledWith({ season: "2025" });
  });

  it("rejects a season that isn't a year", async () => {
    const res = await rip({ sport: "nba", season: "../x" });

    expect(res.status).toBe(400);
    expect(loadNightlySlate).not.toHaveBeenCalled();
  });
});
