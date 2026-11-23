import { describe, it, expect, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/upstream", async () => {
  const actual = await vi.importActual<typeof import("@/lib/upstream")>("@/lib/upstream");
  return { ...actual, fetchUpstream: vi.fn() };
});
vi.mock("@/lib/nbaSeason", () => ({ currentNbaSeason: () => 2027 }));

import { fetchUpstream } from "@/lib/upstream";
import { API_URL } from "@/lib/apiUrl";
import { GET } from "./route";

const BRACKET_ID = "3f2a9c1e-5b7d-4e8f-9a0b-1c2d3e4f5a6b";

const params = (sub: string) => ({ params: Promise.resolve({ sub }) });
const ask = (sub: string) => GET(new NextRequest("http://localhost/api/nba/playoffs/picks/x"), params(sub));

const upstreamAnswers = (body: unknown, status = 200) =>
  vi.mocked(fetchUpstream).mockResolvedValue({
    ok: true,
    response: new Response(typeof body === "string" ? body : JSON.stringify(body), { status }),
  });

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("GET /api/nba/playoffs/picks/:sub", () => {
  it("reads a username's public picks for the season in progress, with no credentials", async () => {
    upstreamAnswers({ picks: { "west-r1-1": "LAL" } });

    const res = await ask("paul");

    const [url, init] = vi.mocked(fetchUpstream).mock.calls[0];
    expect(url).toBe(`${API_URL}/api/nba/playoffs/picks/2027/public?username=paul`);
    expect(init).toEqual({ next: { revalidate: 60 } });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ picks: { "west-r1-1": "LAL" } });
  });

  it("looks up an anonymous bracket by its UUID instead of by username", async () => {
    upstreamAnswers({ picks: {} });

    await ask(BRACKET_ID);

    expect(vi.mocked(fetchUpstream).mock.calls[0][0]).toBe(
      `${API_URL}/api/nba/playoffs/picks/2027/public?bracketId=${BRACKET_ID}`,
    );
  });

  it("treats a UUID in any letter case as a bracket id", async () => {
    upstreamAnswers({ picks: {} });

    await ask(BRACKET_ID.toUpperCase());

    expect(String(vi.mocked(fetchUpstream).mock.calls[0][0])).toContain("bracketId=");
  });

  it("treats something that only resembles a UUID as a username", async () => {
    upstreamAnswers({ picks: null });

    await ask(`${BRACKET_ID}-x`);

    expect(String(vi.mocked(fetchUpstream).mock.calls[0][0])).toContain("username=");
  });

  it("encodes a username so it can't add query parameters", async () => {
    upstreamAnswers({ picks: null });

    await ask("paul&bracketId=other#x");

    const [url] = vi.mocked(fetchUpstream).mock.calls[0];
    const query = new URL(String(url)).searchParams;
    expect(query.get("username")).toBe("paul&bracketId=other#x");
    expect(query.has("bracketId")).toBe(false);
  });

  it("answers 404 with no picks when the backend has none to show", async () => {
    upstreamAnswers({ error: "not found" }, 404);

    const res = await ask("nobody");

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ picks: null });
  });

  it("answers 502 when the backend fails, rather than calling the bracket missing", async () => {
    upstreamAnswers({ error: "boom" }, 500);

    const res = await ask("paul");

    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: "Couldn't load these picks right now" });
  });

  it("answers 502 when the backend's reply isn't JSON", async () => {
    upstreamAnswers("<html>", 200);

    const res = await ask("paul");

    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: "Couldn't load these picks right now" });
  });

  it("answers 504 when the backend times out and 502 when it can't be reached", async () => {
    vi.mocked(fetchUpstream).mockResolvedValueOnce({ ok: false, cause: "timeout", message: "slow" });
    expect((await ask("paul")).status).toBe(504);

    vi.mocked(fetchUpstream).mockResolvedValueOnce({ ok: false, cause: "unreachable", message: "down" });
    expect((await ask("paul")).status).toBe(502);
  });
});
