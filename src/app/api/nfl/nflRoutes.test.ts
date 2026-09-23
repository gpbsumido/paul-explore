import { describe, it, expect, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET as scoreboardGET } from "./scoreboard/[season]/route";

afterEach(() => vi.restoreAllMocks());

function stubFetch(impl: () => Response) {
  vi.stubGlobal("fetch", vi.fn(impl));
}

function call(season: string, week?: string) {
  const query = week === undefined ? "" : `?week=${week}`;
  const req = new NextRequest(`http://localhost/api/nfl/scoreboard/${season}${query}`);
  return scoreboardGET(req, { params: Promise.resolve({ season }) });
}

describe("NFL scoreboard proxy route", () => {
  it("forwards upstream JSON with a cache window", async () => {
    stubFetch(() => new Response(JSON.stringify({ ok: true }), { status: 200 }));
    const res = await call("2026", "3");
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("public, s-maxage=3600");
    expect(await res.json()).toEqual({ ok: true });
  });

  it("omits scoringPeriodId when no week is given (current period)", async () => {
    const fetchMock = vi.fn((_url: string) => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const res = await call("2026");
    expect(res.status).toBe(200);
    expect(fetchMock.mock.calls[0][0]).not.toContain("scoringPeriodId");
  });

  it("passes the requested week to ESPN as scoringPeriodId", async () => {
    const fetchMock = vi.fn((_url: string) => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await call("2026", "7");
    const url = fetchMock.mock.calls[0][0];
    expect(url).toContain("scoringPeriodId=7");
    expect(url).toContain("/ffl/seasons/2026/");
    expect(url).toContain("leagues/836777691");
  });

  it("rejects a malformed season", async () => {
    const res = await call("20xx");
    expect(res.status).toBe(400);
  });

  it("rejects an out-of-range or malformed week", async () => {
    expect((await call("2026", "0")).status).toBe(400);
    expect((await call("2026", "99")).status).toBe(400);
    expect((await call("2026", "xx")).status).toBe(400);
  });

  it("maps a 404 upstream to a labeled error", async () => {
    stubFetch(() => new Response("nope", { status: 404 }));
    const res = await call("2026");
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Failed to fetch NFL scoreboard" });
  });

  it("returns 502 when the upstream is unreachable", async () => {
    stubFetch(() => {
      throw new TypeError("fetch failed");
    });
    const res = await call("2026");
    expect(res.status).toBe(502);
  });
});
