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
import { GET, POST, PATCH, DELETE } from "./route";

const ctx = (path?: string[]) => ({ params: Promise.resolve({ path }) });

const upstreamAnswers = (body: unknown, status = 200) =>
  vi.mocked(fetchUpstream).mockResolvedValue({
    ok: true,
    response: new Response(
      body === null ? null : typeof body === "string" ? body : JSON.stringify(body),
      { status },
    ),
  });

/** The url and init of the one request the route sent upstream. */
function sentUpstream() {
  expect(fetchUpstream).toHaveBeenCalledTimes(1);
  const [url, init] = vi.mocked(fetchUpstream).mock.calls[0];
  return { url, init: init ?? {}, headers: (init?.headers ?? {}) as Record<string, string> };
}

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

describe("/api/budget proxy", () => {
  it("answers a signed-out caller with 401 and never calls the backend", async () => {
    vi.mocked(auth0.getAccessToken).mockRejectedValue(
      new AccessTokenError(AccessTokenErrorCode.MISSING_SESSION, "no session"),
    );

    const res = await GET(new NextRequest("http://localhost/api/budget"), ctx());

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Not authenticated" });
    expect(fetchUpstream).not.toHaveBeenCalled();
  });

  it("forwards the bare route to /api/budgets with the caller's own token", async () => {
    upstreamAnswers({ budgets: [] });

    const res = await GET(new NextRequest("http://localhost/api/budget"), ctx());

    const { url, init, headers } = sentUpstream();
    expect(url).toBe(`${API_URL}/api/budgets`);
    expect(init.method).toBe("GET");
    expect(headers.Authorization).toBe("Bearer tok");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ budgets: [] });
  });

  it("maps the nested path onto the backend's /api/budgets and keeps the query string", async () => {
    upstreamAnswers({ entries: [] });

    await GET(
      new NextRequest("http://localhost/api/budget/3f2a-91/entries?month=2026-04&limit=5"),
      ctx(["3f2a-91", "entries"]),
    );

    expect(sentUpstream().url).toBe(
      `${API_URL}/api/budgets/3f2a-91/entries?month=2026-04&limit=5`,
    );
  });

  it.each([
    ["POST", POST],
    ["PATCH", PATCH],
  ] as const)("sends the %s body as JSON, untouched", async (method, handler) => {
    upstreamAnswers({ ok: true }, 201);
    const payload = JSON.stringify({ name: "Groceries", limitCents: 40000 });

    await handler(
      new NextRequest("http://localhost/api/budget/abc", { method, body: payload }),
      ctx(["abc"]),
    );

    const { init, headers } = sentUpstream();
    expect(init.method).toBe(method);
    expect(init.body).toBe(payload);
    expect(headers["Content-Type"]).toBe("application/json");
  });

  it("sends no body and no content type for a DELETE", async () => {
    upstreamAnswers({}, 200);

    await DELETE(
      new NextRequest("http://localhost/api/budget/abc", { method: "DELETE" }),
      ctx(["abc"]),
    );

    const { init, headers } = sentUpstream();
    expect(init.method).toBe("DELETE");
    expect(init.body).toBeUndefined();
    expect(headers["Content-Type"]).toBeUndefined();
  });

  it("leaves the body off a POST that sent none", async () => {
    upstreamAnswers({}, 200);

    await POST(new NextRequest("http://localhost/api/budget/abc/archive", { method: "POST" }), ctx(["abc", "archive"]));

    expect(sentUpstream().init.body).toBeUndefined();
  });

  it.each([
    ["a traversal segment", [".."]],
    ["a segment with a dot in it", ["a.b"]],
    ["a segment with an encoded slash", ["a%2Fb"]],
    ["a segment with a space", ["a b"]],
    ["an empty segment", [""]],
  ])("rejects %s with 400 instead of forwarding it", async (_label, path) => {
    const res = await GET(new NextRequest("http://localhost/api/budget/x"), ctx(path));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid path" });
    expect(fetchUpstream).not.toHaveBeenCalled();
  });

  it.each([201, 404, 409, 422])("passes the backend's %i through with its body", async (status) => {
    upstreamAnswers({ error: "the backend's words" }, status);

    const res = await POST(
      new NextRequest("http://localhost/api/budget", { method: "POST", body: "{}" }),
      ctx(),
    );

    expect(res.status).toBe(status);
    expect(await res.json()).toEqual({ error: "the backend's words" });
  });

  it("answers an empty object when the backend's reply has no JSON body", async () => {
    upstreamAnswers("", 200);

    const res = await DELETE(
      new NextRequest("http://localhost/api/budget/abc", { method: "DELETE" }),
      ctx(["abc"]),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({});
  });

  // Known bug: NextResponse.json({}, { status: 204 }) throws, because a 204 can't carry a
  // body, so a backend that answers a delete with 204 reaches the page as a 502
  // "Backend unavailable". Recorded as a finding, not fixed here.
  it.fails("passes a 204 from the backend through as a 204", async () => {
    upstreamAnswers(null, 204);

    const res = await DELETE(
      new NextRequest("http://localhost/api/budget/abc", { method: "DELETE" }),
      ctx(["abc"]),
    );

    expect(res.status).toBe(204);
  });

  it("answers 504 when the backend times out and 502 when it can't be reached", async () => {
    vi.mocked(fetchUpstream).mockResolvedValueOnce({ ok: false, cause: "timeout", message: "slow" });
    const slow = await GET(new NextRequest("http://localhost/api/budget"), ctx());
    expect(slow.status).toBe(504);

    vi.mocked(fetchUpstream).mockResolvedValueOnce({ ok: false, cause: "unreachable", message: "down" });
    const down = await GET(new NextRequest("http://localhost/api/budget"), ctx());
    expect(down.status).toBe(502);
  });
});
