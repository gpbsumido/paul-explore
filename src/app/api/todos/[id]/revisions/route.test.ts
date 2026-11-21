import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth0", () => ({
  auth0: { getSession: vi.fn(), getAccessToken: vi.fn() },
}));
vi.mock("@/lib/upstream", async () => {
  const actual = await vi.importActual<typeof import("@/lib/upstream")>("@/lib/upstream");
  return { ...actual, fetchUpstream: vi.fn() };
});

import { auth0 } from "@/lib/auth0";
import { fetchUpstream } from "@/lib/upstream";
import { API_URL } from "@/lib/apiUrl";
import { GET } from "./route";

type Session = Awaited<ReturnType<typeof auth0.getSession>>;

const ADMIN = "admin@example.com";
const sessionFor = (email: string, verified = true) =>
  ({ user: { sub: "auth0|1", email, email_verified: verified } }) as Session;

const params = (id: string) => ({ params: Promise.resolve({ id }) });
const ask = (id = "todo-1") => GET(new NextRequest(`http://localhost/api/todos/${id}/revisions`), params(id));

const upstreamAnswers = (body: unknown, status = 200) =>
  vi.mocked(fetchUpstream).mockResolvedValue({
    ok: true,
    response: new Response(JSON.stringify(body), { status }),
  });

beforeEach(() => {
  vi.stubEnv("FLAG_ADMIN_ALLOWED_EMAILS", ADMIN);
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.mocked(auth0.getSession).mockResolvedValue(sessionFor(ADMIN));
  vi.mocked(auth0.getAccessToken).mockResolvedValue({
    token: "tok",
    expiresAt: Date.now() / 1000 + 3600,
    scope: "openid",
  } as Awaited<ReturnType<typeof auth0.getAccessToken>>);
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("GET /api/todos/:id/revisions", () => {
  it("reads the item's history from the backend with the admin's own token", async () => {
    const revisions = [{ revision: 2, title: "Fix login" }, { revision: 1, title: "Fix log-in" }];
    upstreamAnswers({ revisions });

    const res = await ask("todo-1");

    expect(fetchUpstream).toHaveBeenCalledTimes(1);
    const [url, init] = vi.mocked(fetchUpstream).mock.calls[0];
    expect(url).toBe(`${API_URL}/api/todos/todo-1/revisions`);
    expect(init?.headers).toEqual({ Authorization: "Bearer tok" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ revisions });
  });

  it.each([
    ["a signed-in visitor off the allowlist", () => sessionFor("someone@else.com")],
    ["the admin's address when it isn't verified", () => sessionFor(ADMIN, false)],
    ["a visitor with no session", () => null],
  ])("answers 404 to %s, so the endpoint reads as absent, and never calls the backend", async (_label, session) => {
    vi.mocked(auth0.getSession).mockResolvedValue(session());

    const res = await ask();

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Not found" });
    expect(fetchUpstream).not.toHaveBeenCalled();
  });

  it("answers 404 to everyone when the allowlist isn't set", async () => {
    vi.stubEnv("FLAG_ADMIN_ALLOWED_EMAILS", "");

    const res = await ask();

    expect(res.status).toBe(404);
    expect(fetchUpstream).not.toHaveBeenCalled();
  });

  it("encodes the item id rather than letting it reshape the path", async () => {
    upstreamAnswers({ revisions: [] });

    await ask("a b");

    expect(vi.mocked(fetchUpstream).mock.calls[0][0]).toBe(`${API_URL}/api/todos/a%20b/revisions`);
  });

  it("answers 400 for an id that is a path traversal, without calling the backend", async () => {
    const res = await ask("..");

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid identifier" });
    expect(fetchUpstream).not.toHaveBeenCalled();
  });

  it("keeps the backend's status but replaces its message", async () => {
    upstreamAnswers({ error: "relation todo_revisions does not exist" }, 500);

    const res = await ask();

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Failed to load history" });
  });

  it("passes a 404 for an unknown item through", async () => {
    upstreamAnswers({ error: "no such item" }, 404);

    const res = await ask("missing");

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Failed to load history" });
  });

  it("answers 504 when the backend times out and 502 when it can't be reached", async () => {
    vi.mocked(fetchUpstream).mockResolvedValueOnce({ ok: false, cause: "timeout", message: "slow" });
    expect((await ask()).status).toBe(504);

    vi.mocked(fetchUpstream).mockResolvedValueOnce({ ok: false, cause: "unreachable", message: "down" });
    expect((await ask()).status).toBe(502);
  });

  it("answers 401 when the admin's token can't be fetched", async () => {
    vi.mocked(auth0.getAccessToken).mockRejectedValue(new Error("token expired"));

    const res = await ask();

    expect(res.status).toBe(401);
    expect(fetchUpstream).not.toHaveBeenCalled();
  });
});
