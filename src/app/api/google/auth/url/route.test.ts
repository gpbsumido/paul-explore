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

import { GET } from "./route";

const upstreamAnswers = (body: unknown, status = 200) =>
  vi.mocked(fetchUpstream).mockResolvedValue({
    ok: true,
    response: new Response(JSON.stringify(body), { status }),
  });

const ask = (query = "") => GET(new NextRequest(`http://localhost/api/google/auth/url${query}`), undefined);

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

describe("GET /api/google/auth/url", () => {
  it("answers a signed-out caller with 401 and never calls the backend", async () => {
    vi.mocked(auth0.getAccessToken).mockRejectedValue(
      new AccessTokenError(AccessTokenErrorCode.MISSING_SESSION, "no session"),
    );

    const res = await ask();

    expect(res.status).toBe(401);
    expect(fetchUpstream).not.toHaveBeenCalled();
  });

  it("asks the backend for the url with the caller's token and returns what it says", async () => {
    upstreamAnswers({ url: "https://accounts.google.com/o/oauth2/auth?x=1" });

    const res = await ask();

    expect(fetchUpstream).toHaveBeenCalledTimes(1);
    const [url, init] = vi.mocked(fetchUpstream).mock.calls[0];
    expect(url).toBe(`${API_URL}/api/google/auth/url`);
    expect(init?.headers).toEqual({ Authorization: "Bearer tok" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ url: "https://accounts.google.com/o/oauth2/auth?x=1" });
  });

  it("forwards a valid origin so the backend can send the caller back to it", async () => {
    upstreamAnswers({ url: "u" });

    await ask("?origin=" + encodeURIComponent("https://paulsumido.com"));

    const [url] = vi.mocked(fetchUpstream).mock.calls[0];
    expect(new URL(String(url)).searchParams.get("origin")).toBe("https://paulsumido.com");
  });

  it("accepts a local http origin for development", async () => {
    upstreamAnswers({ url: "u" });

    const res = await ask("?origin=" + encodeURIComponent("http://localhost:3000"));

    expect(res.status).toBe(200);
  });

  it.each([
    ["isn't a url", "not a url"],
    ["is an empty string", ""],
    ["is a javascript: url", "javascript:alert(1)"],
    ["is a data: url", "data:text/html,hi"],
    ["is an ftp url", "ftp://example.com"],
  ])("answers 400 when the origin %s, without calling the backend", async (_label, origin) => {
    const res = await ask("?origin=" + encodeURIComponent(origin));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid origin" });
    expect(fetchUpstream).not.toHaveBeenCalled();
  });

  it("passes the backend's error status through with its own message, not the backend's", async () => {
    upstreamAnswers({ error: "google client secret missing" }, 503);

    const res = await ask();

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "Failed to generate URL" });
  });

  it("answers 504 when the backend times out and 502 when it can't be reached", async () => {
    vi.mocked(fetchUpstream).mockResolvedValueOnce({ ok: false, cause: "timeout", message: "slow" });
    expect((await ask()).status).toBe(504);

    vi.mocked(fetchUpstream).mockResolvedValueOnce({ ok: false, cause: "unreachable", message: "down" });
    expect((await ask()).status).toBe(502);
  });
});
