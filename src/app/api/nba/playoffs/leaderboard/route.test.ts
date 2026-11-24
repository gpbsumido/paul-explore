import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET } from "./route";

const backendEntry = {
  rank: 1,
  userSub: "auth0|abc",
  bracketId: "bracket-1",
  username: null,
  displayName: "Paul",
  score: 31,
  maxPossible: 52,
  breakdown: { r1: 6, r2: 4, cf: 2, finals: 3, bonuses: 5, mvp: 7, combinedScoreDiff: 12 },
};

const fetchMock = vi.fn();

beforeEach(() => {
  // November 2026 is part of the 2027 season, which the route has to ask for.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 10, 20));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

describe("GET /api/nba/playoffs/leaderboard", () => {
  it("asks the API for the season now in progress", async () => {
    fetchMock.mockResolvedValue(Response.json({ entries: [] }));

    await GET();

    expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/api\/nba\/playoffs\/leaderboard\/2027$/);
  });

  it("reshapes each entry into the leaderboard's own fields", async () => {
    fetchMock.mockResolvedValue(Response.json({ entries: [backendEntry] }));

    const { entries } = await (await GET()).json();

    expect(entries).toEqual([
      {
        rank: 1,
        sub: "auth0|abc",
        bracketId: "bracket-1",
        username: null,
        displayName: "Paul",
        score: 31,
        maxScore: 52,
        roundBreakdown: [
          { label: "R1", earned: 6, max: 8 },
          { label: "R2", earned: 4, max: 8 },
          { label: "CF", earned: 2, max: 8 },
          // Finals carries the bonus and MVP points: 3 + 5 + 7.
          { label: "Finals", earned: 15, max: 28 },
        ],
      },
    ]);
  });

  it("keeps a username when there is one", async () => {
    fetchMock.mockResolvedValue(
      Response.json({ entries: [{ ...backendEntry, username: "paul_s" }] }),
    );

    const { entries } = await (await GET()).json();

    expect(entries[0].username).toBe("paul_s");
  });

  it("is public and cacheable for five minutes", async () => {
    fetchMock.mockResolvedValue(Response.json({ entries: [] }));

    const res = await GET();

    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("public, s-maxage=300");
  });

  it("passes an upstream failure's status through under its own message", async () => {
    fetchMock.mockResolvedValue(new Response("nope", { status: 404 }));

    const res = await GET();

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Failed to fetch leaderboard" });
  });

  it("answers 502 when the body isn't the shape it expects", async () => {
    fetchMock.mockResolvedValue(Response.json({ nothing: true }));

    const res = await GET();

    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: "Backend unavailable" });
  });

  it("answers 502 and says why when the API can't be reached", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));

    const res = await GET();

    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: "Backend unavailable", cause: "unreachable" });
  });
});
