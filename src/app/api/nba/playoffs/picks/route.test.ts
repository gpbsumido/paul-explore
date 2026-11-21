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
import { GET, PUT } from "./route";

const upstreamAnswers = (body: unknown, status = 200) =>
  vi.mocked(fetchUpstream).mockResolvedValue({
    ok: true,
    response: new Response(typeof body === "string" ? body : JSON.stringify(body), { status }),
  });

const getRequest = () => new NextRequest("http://localhost/api/nba/playoffs/picks");
const putRequest = (body: unknown) =>
  new NextRequest("http://localhost/api/nba/playoffs/picks", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

const picks = { "west-r1-1": "LAL", "east-r1-1": "BOS" };

beforeEach(() => {
  // Only the clock is faked, so promises and the route's awaits run normally.
  // April 2026 is inside the 2026 season, which the picks are keyed by.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 3, 15, 12));
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.mocked(auth0.getAccessToken).mockResolvedValue({
    token: "user-token",
    expiresAt: Date.now() / 1000 + 3600,
    scope: "openid",
  } as Awaited<ReturnType<typeof auth0.getAccessToken>>);
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

const signedOut = () =>
  vi
    .mocked(auth0.getAccessToken)
    .mockRejectedValue(new AccessTokenError(AccessTokenErrorCode.MISSING_SESSION, "no session"));

describe("GET /api/nba/playoffs/picks", () => {
  it("answers 401 without calling the backend when nobody is signed in", async () => {
    signedOut();

    const res = await GET(getRequest(), undefined);

    expect(res.status).toBe(401);
    expect(fetchUpstream).not.toHaveBeenCalled();
  });

  it("asks for the current season's picks with the caller's bearer token", async () => {
    upstreamAnswers({ picks });

    await GET(getRequest(), undefined);

    const [url, init] = vi.mocked(fetchUpstream).mock.calls[0];
    expect(url).toBe(`${API_URL}/api/nba/playoffs/picks/2026`);
    expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer user-token");
  });

  it("moves to next year's picks once the season tips off in October", async () => {
    vi.setSystemTime(new Date(2026, 9, 25, 12));
    upstreamAnswers({ picks: {} });

    await GET(getRequest(), undefined);

    expect(vi.mocked(fetchUpstream).mock.calls[0][0]).toBe(`${API_URL}/api/nba/playoffs/picks/2027`);
  });

  it("passes the saved picks through", async () => {
    upstreamAnswers({ picks });

    const res = await GET(getRequest(), undefined);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ picks });
  });

  it("answers an empty bracket, not an error, when nothing has been saved yet", async () => {
    upstreamAnswers({ error: "not found" }, 404);

    const res = await GET(getRequest(), undefined);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ picks: {} });
  });

  it("keeps the backend's status but not its body when it fails", async () => {
    upstreamAnswers({ error: "stack trace here" }, 503);

    const res = await GET(getRequest(), undefined);

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "Failed to fetch picks" });
  });

  it("answers 502 when the backend is unreachable and 504 on a timeout", async () => {
    vi.mocked(fetchUpstream).mockResolvedValueOnce({ ok: false, cause: "unreachable", message: "refused" });
    expect((await GET(getRequest(), undefined)).status).toBe(502);

    vi.mocked(fetchUpstream).mockResolvedValueOnce({ ok: false, cause: "timeout", message: "slow" });
    expect((await GET(getRequest(), undefined)).status).toBe(504);
  });
});

describe("PUT /api/nba/playoffs/picks", () => {
  it("answers 401 without calling the backend when nobody is signed in", async () => {
    signedOut();

    const res = await PUT(putRequest({ picks }), undefined);

    expect(res.status).toBe(401);
    expect(fetchUpstream).not.toHaveBeenCalled();
  });

  it("refuses picks that are not a map of short strings, without calling the backend", async () => {
    const res = await PUT(putRequest({ picks: { "west-r1-1": 7 } }), undefined);
    const tooLong = await PUT(putRequest({ picks: { "west-r1-1": "x".repeat(65) } }), undefined);
    const missing = await PUT(putRequest({}), undefined);

    expect(res.status).toBe(400);
    expect(tooLong.status).toBe(400);
    expect(missing.status).toBe(400);
    expect(fetchUpstream).not.toHaveBeenCalled();
  });

  it("saves only the picks, for the current season, as JSON with the caller's bearer token", async () => {
    upstreamAnswers({ saved: true });

    await PUT(putRequest({ picks, extra: "ignored" }), undefined);

    const [url, init] = vi.mocked(fetchUpstream).mock.calls[0];
    expect(url).toBe(`${API_URL}/api/nba/playoffs/picks/2026`);
    expect(init?.method).toBe("PUT");
    expect(init?.headers).toMatchObject({
      Authorization: "Bearer user-token",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init?.body))).toEqual({ picks });
  });

  it("answers { ok: true } once the backend accepts the save", async () => {
    upstreamAnswers({ saved: true });

    const res = await PUT(putRequest({ picks }), undefined);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("keeps the backend's status but not its body when the save fails", async () => {
    upstreamAnswers({ error: "constraint violation" }, 422);

    const res = await PUT(putRequest({ picks }), undefined);

    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ error: "Failed to save picks" });
  });

  it("answers 502 when the backend is unreachable", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue({ ok: false, cause: "unreachable", message: "refused" });

    expect((await PUT(putRequest({ picks }), undefined)).status).toBe(502);
  });
});
