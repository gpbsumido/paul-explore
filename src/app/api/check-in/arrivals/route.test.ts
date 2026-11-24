import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { AccessTokenError, AccessTokenErrorCode } from "@auth0/nextjs-auth0/errors";

vi.mock("@/lib/auth0", () => ({
  auth0: { getAccessToken: vi.fn() },
}));
vi.mock("@/lib/upstream", async () => {
  const actual = await vi.importActual<typeof import("@/lib/upstream")>("@/lib/upstream");
  return { ...actual, fetchUpstream: vi.fn() };
});

import { auth0 } from "@/lib/auth0";
import { fetchUpstream } from "@/lib/upstream";
import { API_URL } from "@/lib/apiUrl";

import { POST } from "./route";

const upstreamAnswers = (body: unknown, status = 200) =>
  vi.mocked(fetchUpstream).mockResolvedValue({
    ok: true,
    response: new Response(typeof body === "string" ? body : JSON.stringify(body), { status }),
  });

const arrival = (body: string) =>
  new NextRequest("http://localhost/api/check-in/arrivals", { method: "POST", body });

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.mocked(auth0.getAccessToken).mockResolvedValue({
    token: "tok",
    expiresAt: Date.now() / 1000 + 3600,
    scope: "openid",
  } as Awaited<ReturnType<typeof auth0.getAccessToken>>);
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("POST /api/check-in/arrivals", () => {
  it("answers a signed-out volunteer with 401 and never calls the backend", async () => {
    vi.mocked(auth0.getAccessToken).mockRejectedValue(
      new AccessTokenError(AccessTokenErrorCode.MISSING_SESSION, "no session"),
    );

    const res = await POST(arrival("{}"), undefined);

    expect(res.status).toBe(401);
    expect(fetchUpstream).not.toHaveBeenCalled();
  });

  it("forwards the code to the backend as JSON with the volunteer's own token", async () => {
    upstreamAnswers({ status: "recorded" }, 201);
    const payload = JSON.stringify({ code: "483-221" });

    await POST(arrival(payload), undefined);

    expect(fetchUpstream).toHaveBeenCalledTimes(1);
    const [url, init] = vi.mocked(fetchUpstream).mock.calls[0];
    expect(url).toBe(`${API_URL}/api/check-in/arrivals`);
    expect(init?.method).toBe("POST");
    expect(init?.body).toBe(payload);
    expect(init?.headers).toEqual({
      Authorization: "Bearer tok",
      "Content-Type": "application/json",
    });
  });

  // The page renders each of these differently, so none may be flattened.
  it.each([
    [201, { status: "recorded" }],
    [200, { status: "already-checked-in" }],
    [400, { error: "That code is wrong or has expired" }],
    [429, { error: "Too many attempts" }],
  ])("passes the backend's %i and its body through unchanged", async (status, body) => {
    upstreamAnswers(body, status);

    const res = await POST(arrival("{}"), undefined);

    expect(res.status).toBe(status);
    expect(await res.json()).toEqual(body);
  });

  it("answers 504 when the backend times out and 502 when it can't be reached", async () => {
    vi.mocked(fetchUpstream).mockResolvedValueOnce({ ok: false, cause: "timeout", message: "slow" });
    expect((await POST(arrival("{}"), undefined)).status).toBe(504);

    vi.mocked(fetchUpstream).mockResolvedValueOnce({ ok: false, cause: "unreachable", message: "down" });
    expect((await POST(arrival("{}"), undefined)).status).toBe(502);
  });

  it("answers 502 when the backend's reply isn't JSON", async () => {
    upstreamAnswers("<html>gateway</html>", 200);

    const res = await POST(arrival("{}"), undefined);

    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: "Backend unavailable" });
  });
});
