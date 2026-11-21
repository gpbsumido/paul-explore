import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth0", () => ({
  auth0: { getSession: vi.fn(), getAccessToken: vi.fn() },
}));

vi.mock("@/lib/upstream", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/upstream")>("@/lib/upstream");
  return { ...actual, fetchUpstream: vi.fn() };
});

import { auth0 } from "@/lib/auth0";
import { fetchUpstream } from "@/lib/upstream";
import { API_URL } from "@/lib/backendFetch";
import { PATCH, DELETE } from "./route";

type Session = Awaited<ReturnType<typeof auth0.getSession>>;

const admin = {
  user: { sub: "auth0|1", email: "admin@example.com", email_verified: true },
} as Session;

const params = (id: string) => ({ params: Promise.resolve({ id }) });

const patchRequest = (body: unknown) =>
  new NextRequest("http://localhost/api/todos/t1", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
const deleteRequest = () => new NextRequest("http://localhost/api/todos/t1", { method: "DELETE" });

const upstreamAnswers = (body: unknown, status = 200) =>
  vi.mocked(fetchUpstream).mockResolvedValue({
    ok: true,
    response: new Response(JSON.stringify(body), { status }),
  });

beforeEach(() => {
  vi.stubEnv("FLAG_ADMIN_ALLOWED_EMAILS", "admin@example.com");
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.mocked(auth0.getSession).mockResolvedValue(admin);
  vi.mocked(auth0.getAccessToken).mockResolvedValue({
    token: "admin-token",
    expiresAt: Date.now() / 1000 + 3600,
    scope: "openid",
  } as Awaited<ReturnType<typeof auth0.getAccessToken>>);
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("the admin gate on /api/todos/:id", () => {
  const callers: [string, Session][] = [
    ["a signed-out caller", null],
    [
      "a signed-in non-admin",
      { user: { sub: "auth0|2", email: "someone@example.com", email_verified: true } } as Session,
    ],
    [
      "an allowlisted address the provider has not verified",
      { user: { sub: "auth0|3", email: "admin@example.com", email_verified: false } } as Session,
    ],
  ];

  it.each(callers)("hides PATCH from %s with a 404 and never calls the backend", async (_who, session) => {
    vi.mocked(auth0.getSession).mockResolvedValue(session);

    const res = await PATCH(patchRequest({ done: true }), params("t1"));

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Not found" });
    expect(fetchUpstream).not.toHaveBeenCalled();
  });

  it.each(callers)("hides DELETE from %s with a 404 and never calls the backend", async (_who, session) => {
    vi.mocked(auth0.getSession).mockResolvedValue(session);

    const res = await DELETE(deleteRequest(), params("t1"));

    expect(res.status).toBe(404);
    expect(fetchUpstream).not.toHaveBeenCalled();
  });
});

describe("PATCH /api/todos/:id", () => {
  it("refuses an empty patch, an out-of-range phase and a blank title, without calling the backend", async () => {
    const empty = await PATCH(patchRequest({}), params("t1"));
    const badPhase = await PATCH(patchRequest({ phase: 9 }), params("t1"));
    const blankTitle = await PATCH(patchRequest({ title: "   " }), params("t1"));
    const notJson = await PATCH(patchRequest("{nope"), params("t1"));

    expect([empty.status, badPhase.status, blankTitle.status, notJson.status]).toEqual([400, 400, 400, 400]);
    expect(fetchUpstream).not.toHaveBeenCalled();
  });

  it("sends the validated patch to the item's path with the admin's own bearer token", async () => {
    upstreamAnswers({ id: "t1", done: true });

    await PATCH(patchRequest({ done: true, position: 3 }), params("t1"));

    const [url, init] = vi.mocked(fetchUpstream).mock.calls[0];
    expect(url).toBe(`${API_URL}/api/todos/t1`);
    expect(init?.method).toBe("PATCH");
    expect(init?.headers).toMatchObject({
      Authorization: "Bearer admin-token",
      "Content-Type": "application/json",
    });
    // position is the server's to assign, so it never travels upstream.
    expect(JSON.parse(String(init?.body))).toEqual({ done: true });
  });

  it("passes the updated item through", async () => {
    upstreamAnswers({ id: "t1", done: true, title: "Ship it" });

    const res = await PATCH(patchRequest({ done: true }), params("t1"));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: "t1", done: true, title: "Ship it" });
  });

  it("keeps the backend's status but not its body when it refuses", async () => {
    upstreamAnswers({ error: "internal detail" }, 404);

    const res = await PATCH(patchRequest({ done: true }), params("t1"));

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Failed to update todo" });
  });

  it("answers 502 when the backend is unreachable and 504 on a timeout", async () => {
    vi.mocked(fetchUpstream).mockResolvedValueOnce({ ok: false, cause: "unreachable", message: "refused" });
    expect((await PATCH(patchRequest({ done: true }), params("t1"))).status).toBe(502);

    vi.mocked(fetchUpstream).mockResolvedValueOnce({ ok: false, cause: "timeout", message: "slow" });
    expect((await PATCH(patchRequest({ done: true }), params("t1"))).status).toBe(504);
  });

  it("rejects an id that would climb out of the path, without calling the backend", async () => {
    const res = await PATCH(patchRequest({ done: true }), params("../secret"));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid identifier" });
    expect(fetchUpstream).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/todos/:id", () => {
  it("deletes the item at its path with the admin's own bearer token", async () => {
    upstreamAnswers({ id: "t1", deleted: true });

    await DELETE(deleteRequest(), params("t1"));

    const [url, init] = vi.mocked(fetchUpstream).mock.calls[0];
    expect(url).toBe(`${API_URL}/api/todos/t1`);
    expect(init?.method).toBe("DELETE");
    expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer admin-token");
  });

  it("passes the backend's answer through", async () => {
    upstreamAnswers({ id: "t1", deleted: true });

    const res = await DELETE(deleteRequest(), params("t1"));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: "t1", deleted: true });
  });

  it("answers 404 for an item that is already gone, as the backend does", async () => {
    upstreamAnswers({ error: "already deleted" }, 404);

    const res = await DELETE(deleteRequest(), params("t1"));

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Failed to remove todo" });
  });

  it("answers 502 when the backend is unreachable", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue({ ok: false, cause: "unreachable", message: "refused" });

    expect((await DELETE(deleteRequest(), params("t1"))).status).toBe(502);
  });

  it("rejects an id that would climb out of the path, without calling the backend", async () => {
    const res = await DELETE(deleteRequest(), params("a/b"));

    expect(res.status).toBe(400);
    expect(fetchUpstream).not.toHaveBeenCalled();
  });
});
