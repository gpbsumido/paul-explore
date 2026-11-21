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

const getRequest = () => new NextRequest("http://localhost/api/check-in/sites");
const postRequest = (body: string) =>
  new NextRequest("http://localhost/api/check-in/sites", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.mocked(auth0.getAccessToken).mockResolvedValue({
    token: "organizer-token",
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

describe("GET /api/check-in/sites", () => {
  it("answers 401 without calling the backend when nobody is signed in", async () => {
    signedOut();

    const res = await GET(getRequest(), undefined);

    expect(res.status).toBe(401);
    expect(fetchUpstream).not.toHaveBeenCalled();
  });

  it("asks the backend for the organizer's sites, uncached, with their bearer token", async () => {
    upstreamAnswers({ sites: [] });

    await GET(getRequest(), undefined);

    const [url, init] = vi.mocked(fetchUpstream).mock.calls[0];
    expect(url).toBe(`${API_URL}/api/check-in/sites`);
    expect(init?.cache).toBe("no-store");
    expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer organizer-token");
  });

  it("passes the backend's list and status through", async () => {
    upstreamAnswers({ sites: [{ id: "s1", name: "Front desk" }] });

    const res = await GET(getRequest(), undefined);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ sites: [{ id: "s1", name: "Front desk" }] });
  });

  it("passes a backend refusal through with its own status and body", async () => {
    upstreamAnswers({ error: "Forbidden" }, 403);

    const res = await GET(getRequest(), undefined);

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Forbidden" });
  });

  it("answers 502 when the backend is unreachable and 504 on a timeout", async () => {
    vi.mocked(fetchUpstream).mockResolvedValueOnce({ ok: false, cause: "unreachable", message: "refused" });
    expect((await GET(getRequest(), undefined)).status).toBe(502);

    vi.mocked(fetchUpstream).mockResolvedValueOnce({ ok: false, cause: "timeout", message: "slow" });
    expect((await GET(getRequest(), undefined)).status).toBe(504);
  });

  it("answers 502 rather than crashing when the backend's body is not JSON", async () => {
    upstreamAnswers("<html>proxy error</html>", 200);

    const res = await GET(getRequest(), undefined);

    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: "Backend unavailable" });
  });
});

describe("POST /api/check-in/sites", () => {
  const body = JSON.stringify({ name: "Front desk", slug: "front-desk" });

  it("answers 401 without calling the backend when nobody is signed in", async () => {
    signedOut();

    const res = await POST(postRequest(body), undefined);

    expect(res.status).toBe(401);
    expect(fetchUpstream).not.toHaveBeenCalled();
  });

  it("forwards the request body untouched, as JSON, with the organizer's bearer token", async () => {
    upstreamAnswers({ id: "s1" }, 201);

    await POST(postRequest(body), undefined);

    const [url, init] = vi.mocked(fetchUpstream).mock.calls[0];
    expect(url).toBe(`${API_URL}/api/check-in/sites`);
    expect(init?.method).toBe("POST");
    expect(init?.body).toBe(body);
    expect(init?.headers).toMatchObject({
      Authorization: "Bearer organizer-token",
      "Content-Type": "application/json",
    });
  });

  it("passes the created site and its 201 through", async () => {
    upstreamAnswers({ id: "s1", name: "Front desk" }, 201);

    const res = await POST(postRequest(body), undefined);

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ id: "s1", name: "Front desk" });
  });

  it("passes a validation refusal through with its own status and body", async () => {
    upstreamAnswers({ error: "slug already taken" }, 409);

    const res = await POST(postRequest(body), undefined);

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "slug already taken" });
  });

  it("answers 502 when the backend is unreachable", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue({ ok: false, cause: "unreachable", message: "refused" });

    expect((await POST(postRequest(body), undefined)).status).toBe(502);
  });
});
