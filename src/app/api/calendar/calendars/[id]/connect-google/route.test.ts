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
import { POST } from "./route";

const params = (id: string) => ({ params: Promise.resolve({ id }) });
const request = () => new NextRequest("http://localhost/x", { method: "POST" });

const upstreamAnswers = (body: unknown, status = 200) =>
  vi.mocked(fetchUpstream).mockResolvedValue({
    ok: true,
    response: new Response(typeof body === "string" ? body : JSON.stringify(body), { status }),
  });

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

describe("POST /api/calendar/calendars/:id/connect-google", () => {
  it("answers 401 without calling the backend when nobody is signed in", async () => {
    vi.mocked(auth0.getAccessToken).mockRejectedValue(
      new AccessTokenError(AccessTokenErrorCode.MISSING_SESSION, "no session"),
    );

    const res = await POST(request(), params("cal-1"));

    expect(res.status).toBe(401);
    expect(fetchUpstream).not.toHaveBeenCalled();
  });

  it("posts to the calendar's connect-google path with the caller's bearer token", async () => {
    upstreamAnswers({ url: "https://accounts.example/consent" });

    await POST(request(), params("cal-1"));

    const [url, init] = vi.mocked(fetchUpstream).mock.calls[0];
    expect(url).toBe(`${API_URL}/api/calendar/calendars/cal-1/connect-google`);
    expect(init?.method).toBe("POST");
    expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer user-token");
  });

  it("passes the backend's body through with a 200", async () => {
    upstreamAnswers({ url: "https://accounts.example/consent" });

    const res = await POST(request(), params("cal-1"));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ url: "https://accounts.example/consent" });
  });

  it("keeps the backend's own error body and status when it refuses", async () => {
    upstreamAnswers({ error: "Calendar not found" }, 404);

    const res = await POST(request(), params("cal-1"));

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Calendar not found" });
  });

  it("falls back to a plain message when the backend's error is not JSON", async () => {
    upstreamAnswers("<html>bad gateway</html>", 500);

    const res = await POST(request(), params("cal-1"));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Failed to connect Google Calendar" });
  });

  it("answers 502 when the backend is unreachable and 504 when it times out", async () => {
    vi.mocked(fetchUpstream).mockResolvedValueOnce({ ok: false, cause: "unreachable", message: "refused" });
    expect((await POST(request(), params("cal-1"))).status).toBe(502);

    vi.mocked(fetchUpstream).mockResolvedValueOnce({ ok: false, cause: "timeout", message: "slow" });
    expect((await POST(request(), params("cal-1"))).status).toBe(504);
  });

  it("rejects an id that would climb out of the path, without calling the backend", async () => {
    const res = await POST(request(), params("../secret"));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid identifier" });
    expect(fetchUpstream).not.toHaveBeenCalled();
  });
});
