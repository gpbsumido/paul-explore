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

const getRequest = (query = "") =>
  new NextRequest(`http://localhost/api/calendar/countdowns${query}`);

const postRequest = (body: unknown) =>
  new NextRequest("http://localhost/api/calendar/countdowns", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

const validCountdown = {
  title: "Launch",
  description: "Ship it",
  targetDate: "2026-12-01T00:00:00.000Z",
  color: "#219b84",
};

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.mocked(auth0.getAccessToken).mockResolvedValue({
    token: "user-token",
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

describe("GET /api/calendar/countdowns", () => {
  it("answers 401 without calling the backend when nobody is signed in", async () => {
    signedOut();

    const res = await GET(getRequest(), undefined);

    expect(res.status).toBe(401);
    expect(fetchUpstream).not.toHaveBeenCalled();
  });

  it("asks the backend for the first page with the caller's bearer token", async () => {
    upstreamAnswers({ countdowns: [], nextCursor: null });

    await GET(getRequest(), undefined);

    const [url, init] = vi.mocked(fetchUpstream).mock.calls[0];
    expect(url).toBe(`${API_URL}/api/calendar/countdowns`);
    expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer user-token");
  });

  it("forwards the cursor to the backend, encoded", async () => {
    upstreamAnswers({ countdowns: [] });

    await GET(getRequest("?cursor=abc123%3D%3D"), undefined);

    expect(vi.mocked(fetchUpstream).mock.calls[0][0]).toBe(
      `${API_URL}/api/calendar/countdowns?cursor=${encodeURIComponent("abc123==")}`,
    );
  });

  it("refuses a malformed cursor with 400 and never calls the backend", async () => {
    const res = await GET(getRequest("?cursor=../../admin"), undefined);

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid cursor" });
    expect(fetchUpstream).not.toHaveBeenCalled();
  });

  it("passes the page of countdowns through", async () => {
    upstreamAnswers({ countdowns: [{ id: "c1", title: "Launch" }], nextCursor: "next" });

    const res = await GET(getRequest(), undefined);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      countdowns: [{ id: "c1", title: "Launch" }],
      nextCursor: "next",
    });
  });

  it("keeps the backend's status but not its body when it refuses", async () => {
    upstreamAnswers({ error: "db password is hunter2" }, 500);

    const res = await GET(getRequest(), undefined);

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Failed to fetch countdowns" });
  });

  it("answers 502 when the backend is unreachable and 504 on a timeout", async () => {
    vi.mocked(fetchUpstream).mockResolvedValueOnce({ ok: false, cause: "unreachable", message: "refused" });
    expect((await GET(getRequest(), undefined)).status).toBe(502);

    vi.mocked(fetchUpstream).mockResolvedValueOnce({ ok: false, cause: "timeout", message: "slow" });
    expect((await GET(getRequest(), undefined)).status).toBe(504);
  });
});

describe("POST /api/calendar/countdowns", () => {
  it("answers 401 without calling the backend when nobody is signed in", async () => {
    signedOut();

    const res = await POST(postRequest(validCountdown), undefined);

    expect(res.status).toBe(401);
    expect(fetchUpstream).not.toHaveBeenCalled();
  });

  it("refuses a body without a title with 400 and never calls the backend", async () => {
    const { title: _title, ...withoutTitle } = validCountdown;

    const res = await POST(postRequest(withoutTitle), undefined);

    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Invalid request body");
    expect(fetchUpstream).not.toHaveBeenCalled();
  });

  it("refuses a body that is not JSON with 400", async () => {
    const res = await POST(postRequest("{not json"), undefined);

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid JSON" });
    expect(fetchUpstream).not.toHaveBeenCalled();
  });

  it("posts the validated body as JSON with the caller's bearer token", async () => {
    upstreamAnswers({ id: "c1", ...validCountdown });

    await POST(postRequest({ ...validCountdown, ownerId: "someone-else" }), undefined);

    const [url, init] = vi.mocked(fetchUpstream).mock.calls[0];
    expect(url).toBe(`${API_URL}/api/calendar/countdowns`);
    expect(init?.method).toBe("POST");
    expect(init?.headers).toMatchObject({
      Authorization: "Bearer user-token",
      "Content-Type": "application/json",
    });
    // Only the fields the schema knows about travel upstream.
    expect(JSON.parse(String(init?.body))).toEqual(validCountdown);
  });

  it("answers 201 with the created countdown", async () => {
    upstreamAnswers({ id: "c1", ...validCountdown });

    const res = await POST(postRequest(validCountdown), undefined);

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ id: "c1", ...validCountdown });
  });

  it("keeps the backend's own error body and status when it refuses", async () => {
    upstreamAnswers({ error: "Too many countdowns" }, 409);

    const res = await POST(postRequest(validCountdown), undefined);

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "Too many countdowns" });
  });

  it("falls back to a plain message when the backend's error is not JSON", async () => {
    upstreamAnswers("oops", 500);

    const res = await POST(postRequest(validCountdown), undefined);

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Failed to create countdown" });
  });

  it("answers 502 when the backend is unreachable", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue({ ok: false, cause: "unreachable", message: "refused" });

    expect((await POST(postRequest(validCountdown), undefined)).status).toBe(502);
  });
});
