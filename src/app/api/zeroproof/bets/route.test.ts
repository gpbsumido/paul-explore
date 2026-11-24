import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { AccessTokenError, AccessTokenErrorCode } from "@auth0/nextjs-auth0/errors";

vi.mock("@/lib/auth0", () => ({
  auth0: { getAccessToken: vi.fn() },
}));

vi.mock("@/lib/upstream", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/upstream")>("@/lib/upstream");
  return { ...actual, fetchUpstream: vi.fn() };
});

import { auth0 } from "@/lib/auth0";
import { fetchUpstream } from "@/lib/upstream";
import { API_URL } from "@/lib/backendFetch";
import { GET, POST } from "./route";

const upstreamAnswers = (body: unknown, status = 200) =>
  vi.mocked(fetchUpstream).mockResolvedValue({
    ok: true,
    response: new Response(typeof body === "string" ? body : JSON.stringify(body), { status }),
  });

const getRequest = () => new NextRequest("http://localhost/api/zeroproof/bets");
const postRequest = (body: string) =>
  new NextRequest("http://localhost/api/zeroproof/bets", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });

const slip = {
  walletId: "w1",
  eventId: "e1",
  market: "h2h",
  selection: "Lakers",
  stakeCents: 2500,
};

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.mocked(auth0.getAccessToken).mockResolvedValue({
    token: "player-token",
    expiresAt: Date.now() / 1000 + 3600,
    scope: "openid",
  } as Awaited<ReturnType<typeof auth0.getAccessToken>>);
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

const signedOut = () =>
  vi
    .mocked(auth0.getAccessToken)
    .mockRejectedValue(new AccessTokenError(AccessTokenErrorCode.MISSING_SESSION, "no session"));

describe("POST /api/zeroproof/bets", () => {
  it("answers 401 without calling the backend when nobody is signed in", async () => {
    signedOut();

    const res = await POST(postRequest(JSON.stringify(slip)), undefined);

    expect(res.status).toBe(401);
    expect(fetchUpstream).not.toHaveBeenCalled();
  });

  it("forwards the slip as JSON to the bets endpoint with the player's bearer token", async () => {
    upstreamAnswers({ bet: { id: "b1" } });

    await POST(postRequest(JSON.stringify(slip)), undefined);

    const [url, init] = vi.mocked(fetchUpstream).mock.calls[0];
    expect(url).toBe(`${API_URL}/api/zeroproof/bets`);
    expect(init?.method).toBe("POST");
    expect(init?.headers).toMatchObject({
      Authorization: "Bearer player-token",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init?.body))).toEqual(slip);
  });

  it("passes the placed bet through", async () => {
    upstreamAnswers({ bet: { id: "b1", oddsAmerican: -110 } });

    const res = await POST(postRequest(JSON.stringify(slip)), undefined);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ bet: { id: "b1", oddsAmerican: -110 } });
  });

  it("keeps the backend's own refusal and status, so the slip can say why", async () => {
    upstreamAnswers({ error: "Insufficient balance" }, 409);

    const res = await POST(postRequest(JSON.stringify(slip)), undefined);

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "Insufficient balance" });
  });

  it("falls back to a plain message when a refusal has no readable body", async () => {
    upstreamAnswers("oops", 500);

    const res = await POST(postRequest(JSON.stringify(slip)), undefined);

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Failed to place bet" });
  });

  it("refuses a body that is not JSON without calling the backend", async () => {
    const res = await POST(postRequest("{not json"), undefined);

    expect(fetchUpstream).not.toHaveBeenCalled();
    expect(res.status).toBe(400);
  });

  it("answers 502 when the backend is unreachable and 504 on a timeout", async () => {
    vi.mocked(fetchUpstream).mockResolvedValueOnce({ ok: false, cause: "unreachable", message: "refused" });
    expect((await POST(postRequest(JSON.stringify(slip)), undefined)).status).toBe(502);

    vi.mocked(fetchUpstream).mockResolvedValueOnce({ ok: false, cause: "timeout", message: "slow" });
    expect((await POST(postRequest(JSON.stringify(slip)), undefined)).status).toBe(504);
  });
});

describe("GET /api/zeroproof/bets", () => {
  it("answers 401 without calling the backend when nobody is signed in", async () => {
    signedOut();

    const res = await GET(getRequest(), undefined);

    expect(res.status).toBe(401);
    expect(fetchUpstream).not.toHaveBeenCalled();
  });

  it("asks for the player's own history with their bearer token", async () => {
    upstreamAnswers({ bets: [] });

    await GET(getRequest(), undefined);

    const [url, init] = vi.mocked(fetchUpstream).mock.calls[0];
    expect(url).toBe(`${API_URL}/api/zeroproof/bets`);
    expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer player-token");
  });

  it("passes the bet history through", async () => {
    upstreamAnswers({ bets: [{ id: "b1" }, { id: "b2" }] });

    const res = await GET(getRequest(), undefined);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ bets: [{ id: "b1" }, { id: "b2" }] });
  });

  it("keeps the backend's status but not its body when the history fails", async () => {
    upstreamAnswers({ error: "relation bets does not exist" }, 503);

    const res = await GET(getRequest(), undefined);

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "Failed to load bet history" });
  });

  it("answers 502 when the backend is unreachable", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue({ ok: false, cause: "unreachable", message: "refused" });

    expect((await GET(getRequest(), undefined)).status).toBe(502);
  });
});
