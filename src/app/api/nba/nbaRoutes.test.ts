import { describe, it, expect, afterEach, vi } from "vitest";
import { GET as teamsGET } from "./teams/route";
import { GET as playersGET } from "./players/[teamId]/route";
import { GET as statsGET } from "./stats/[playerId]/route";
import { GET as shotsGET } from "./shots/[playerId]/route";

afterEach(() => vi.restoreAllMocks());

function stubFetch(impl: () => Response) {
  vi.stubGlobal("fetch", vi.fn(impl));
}

const req = new Request("http://localhost/x");

// Each entry pins one NBA proxy route's observable contract: the cache window
// it advertises and the error label it returns when the upstream 404s.
const cases = [
  {
    name: "teams",
    call: () => teamsGET(),
    cache: "public, s-maxage=300",
    label: "Failed to fetch teams",
  },
  {
    name: "players",
    call: () => playersGET(req, { params: Promise.resolve({ teamId: "1" }) }),
    cache: "public, s-maxage=300",
    label: "Failed to fetch players",
  },
  {
    name: "stats",
    call: () => statsGET(req, { params: Promise.resolve({ playerId: "1" }) }),
    cache: "public, s-maxage=300",
    label: "Failed to fetch stats",
  },
  {
    name: "shots",
    call: () => shotsGET(req, { params: Promise.resolve({ playerId: "1" }) }),
    cache: "public, s-maxage=86400",
    label: "Failed to fetch shot data",
  },
];

describe("NBA proxy routes", () => {
  for (const c of cases) {
    it(`${c.name}: forwards upstream JSON with its cache window`, async () => {
      stubFetch(() => new Response(JSON.stringify({ ok: c.name }), { status: 200 }));
      const res = await c.call();
      expect(res.status).toBe(200);
      expect(res.headers.get("Cache-Control")).toBe(c.cache);
      expect(await res.json()).toEqual({ ok: c.name });
    });

    it(`${c.name}: maps a 404 upstream to its labeled error`, async () => {
      stubFetch(() => new Response("nope", { status: 404 }));
      const res = await c.call();
      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ error: c.label });
    });

    it(`${c.name}: returns 502 when the upstream is unreachable`, async () => {
      stubFetch(() => {
        throw new TypeError("fetch failed");
      });
      const res = await c.call();
      expect(res.status).toBe(502);
    });
  }
});
