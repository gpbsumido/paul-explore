import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth0", () => ({
  auth0: { getAccessToken: vi.fn() },
}));

import { auth0 } from "@/lib/auth0";
import { server } from "@/test/server";
import { API_URL } from "@/lib/apiUrl";
import { GET } from "./route";

const ME_URL = `${API_URL}/api/zeroproof/me`;
const request = () => new NextRequest("http://localhost/api/zeroproof/me");

beforeEach(() => {
  vi.mocked(auth0.getAccessToken).mockResolvedValue({
    token: "player-token",
    expiresAt: Date.now() / 1000 + 3600,
    scope: "openid",
  } as Awaited<ReturnType<typeof auth0.getAccessToken>>);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("GET /api/zeroproof/me", () => {
  it("fetches the profile with the player's own token and returns it untouched", async () => {
    const profile = { stats: { wins: 3 }, wallets: ["0xabc"], accolades: [] };
    let authorization: string | null = null;
    server.use(
      http.get(ME_URL, ({ request: upstreamRequest }) => {
        authorization = upstreamRequest.headers.get("authorization");
        return HttpResponse.json(profile);
      }),
    );

    const res = await GET(request(), undefined);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(profile);
    expect(authorization).toBe("Bearer player-token");
  });

  it("answers 401 without calling the backend when nobody is signed in", async () => {
    vi.mocked(auth0.getAccessToken).mockRejectedValue(new Error("no session"));
    let called = false;
    server.use(
      http.get(ME_URL, () => {
        called = true;
        return HttpResponse.json({});
      }),
    );

    const res = await GET(request(), undefined);

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Not authenticated" });
    expect(called).toBe(false);
  });

  it("keeps the backend's status but answers with its own message", async () => {
    server.use(
      http.get(ME_URL, () => HttpResponse.json({ error: "row lock timeout" }, { status: 500 })),
    );

    const res = await GET(request(), undefined);

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Failed to load profile" });
  });

  it("passes a 404 for a player with no profile through as a 404", async () => {
    server.use(http.get(ME_URL, () => HttpResponse.json({}, { status: 404 })));

    const res = await GET(request(), undefined);

    expect(res.status).toBe(404);
  });

  it("answers 502 when the backend cannot be reached", async () => {
    server.use(http.get(ME_URL, () => HttpResponse.error()));

    const res = await GET(request(), undefined);

    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: "Backend unavailable", cause: "unreachable" });
  });

  it("answers 504 when the backend is too slow", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(
      Object.assign(new Error("deadline"), { name: "TimeoutError" }),
    );

    const res = await GET(request(), undefined);

    expect(res.status).toBe(504);
    expect(await res.json()).toEqual({ error: "Upstream timed out", cause: "timeout" });
  });
});
