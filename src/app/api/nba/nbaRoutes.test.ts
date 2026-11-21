import { describe, it, expect, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET as teamsGET } from "./teams/route";
import { GET as playersGET } from "./players/[teamId]/route";
import { GET as statsGET } from "./stats/[playerId]/route";
import { GET as shotsGET } from "./shots/[playerId]/route";

afterEach(() => vi.restoreAllMocks());

function stubFetch(impl: (url: string) => Response) {
  const fetchMock = vi.fn((url: string) => impl(url));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const req = new NextRequest("http://localhost/x");

// Each entry pins one NBA proxy route's observable contract: the cache window
// it advertises and the error label it returns when the upstream 404s.
const cases = [
  {
    name: "teams",
    path: "/api/nba/teams",
    call: () => teamsGET(),
    cache: "public, s-maxage=300",
    label: "Failed to fetch teams",
  },
  {
    name: "players",
    path: "/api/nba/players/7",
    call: () => playersGET(req, { params: Promise.resolve({ teamId: "7" }) }),
    cache: "public, s-maxage=300",
    label: "Failed to fetch players",
  },
  {
    name: "stats",
    path: "/api/nba/stats/7",
    call: () => statsGET(req, { params: Promise.resolve({ playerId: "7" }) }),
    cache: "public, s-maxage=300",
    label: "Failed to fetch stats",
  },
  {
    name: "shots",
    path: "/api/nba/shots/7",
    call: () => shotsGET(req, { params: Promise.resolve({ playerId: "7" }) }),
    cache: "public, s-maxage=86400",
    label: "Failed to fetch shot data",
  },
];

describe("NBA proxy routes", () => {
  for (const c of cases) {
    it(`${c.name}: forwards upstream JSON with its cache window`, async () => {
      stubFetch(
        () => new Response(JSON.stringify({ ok: c.name }), { status: 200 }),
      );
      const res = await c.call();
      expect(res.status).toBe(200);
      expect(res.headers.get("Cache-Control")).toBe(c.cache);
      expect(await res.json()).toEqual({ ok: c.name });
    });

    it(`${c.name}: asks the upstream for ${c.path}`, async () => {
      const fetchMock = stubFetch(() => new Response("{}", { status: 200 }));
      await c.call();
      expect(String(fetchMock.mock.calls[0][0])).toMatch(
        new RegExp(`${c.path}$`),
      );
    });

    it(`${c.name}: maps a 404 upstream to its labeled error`, async () => {
      stubFetch(() => new Response("nope", { status: 404 }));
      const res = await c.call();
      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ error: c.label });
    });

    it(`${c.name}: returns 502 when the upstream sends a body that is not JSON`, async () => {
      stubFetch(() => new Response("<html>oops</html>", { status: 200 }));
      const res = await c.call();
      expect(res.status).toBe(502);
    });

    it(`${c.name}: returns 504 when the upstream times out`, async () => {
      stubFetch(() => {
        throw Object.assign(new Error("timed out"), { name: "TimeoutError" });
      });
      const res = await c.call();
      expect(res.status).toBe(504);
    });

    it(`${c.name}: returns 502 when the upstream is unreachable`, async () => {
      stubFetch(() => {
        throw new TypeError("fetch failed");
      });
      const res = await c.call();
      expect(res.status).toBe(502);
    });
  }

  // Known bug: Known gap: safeSegment throws on a path separator and nothing in these
  // routes catches it, so a bad id surfaces as an unhandled error instead of
  // the 400 the withBackend routes give. Flip this to a plain `it` once fixed.
  it.fails("answers 400 to an id that could climb out of the path", async () => {
    stubFetch(() => new Response("{}", { status: 200 }));
    const res = await playersGET(req, {
      params: Promise.resolve({ teamId: "../x" }),
    });
    expect(res.status).toBe(400);
  });
});
