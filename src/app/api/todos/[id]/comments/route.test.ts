import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth0", () => ({
  auth0: { getSession: vi.fn(), getAccessToken: vi.fn() },
}));

import { auth0 } from "@/lib/auth0";
import { server } from "@/test/server";
import { API_URL } from "@/lib/apiUrl";
import { GET, POST } from "./route";

type Session = Awaited<ReturnType<typeof auth0.getSession>>;

const COMMENTS_URL = `${API_URL}/api/todos/todo-1/comments`;
const params = (id: string) => ({ params: Promise.resolve({ id }) });
const getRequest = () => new NextRequest("http://localhost/x");
const postRequest = (body: unknown) =>
  new NextRequest("http://localhost/x", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

const admin = {
  user: { sub: "auth0|1", email: "admin@example.com", email_verified: true },
} as Session;

type Seen = { authorization: string | null; body: unknown };

/** Registers one upstream handler and returns what it was sent. */
function upstream(method: "get" | "post", respond: () => Response): Seen[] {
  const seen: Seen[] = [];
  server.use(
    http[method](COMMENTS_URL, async ({ request }) => {
      seen.push({
        authorization: request.headers.get("authorization"),
        body: method === "post" ? await request.json() : undefined,
      });
      return respond();
    }),
  );
  return seen;
}

beforeEach(() => {
  vi.stubEnv("FLAG_ADMIN_ALLOWED_EMAILS", "admin@example.com");
  vi.mocked(auth0.getSession).mockResolvedValue(admin);
  vi.mocked(auth0.getAccessToken).mockResolvedValue({
    token: "admin-token",
    expiresAt: Date.now() / 1000 + 3600,
    scope: "openid",
  } as Awaited<ReturnType<typeof auth0.getAccessToken>>);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("GET /api/todos/:id/comments", () => {
  it("reads that item's comments with the admin's own token and returns them as sent", async () => {
    const comments = [{ id: "c1", body: "first", createdAt: "2026-11-01T00:00:00.000Z" }];
    const seen = upstream("get", () => HttpResponse.json({ comments }));

    const res = await GET(getRequest(), params("todo-1"));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ comments });
    expect(seen).toEqual([{ authorization: "Bearer admin-token", body: undefined }]);
  });

  it.each([
    { name: "a signed-out caller", session: null },
    {
      name: "a signed-in non-admin",
      session: { user: { sub: "auth0|2", email: "someone@example.com", email_verified: true } } as Session,
    },
    {
      name: "an unverified allowlisted address",
      session: { user: { sub: "auth0|3", email: "admin@example.com", email_verified: false } } as Session,
    },
  ])("hides the endpoint from $name with a 404 and never calls the backend", async ({ session }) => {
    vi.mocked(auth0.getSession).mockResolvedValue(session);
    const seen = upstream("get", () => HttpResponse.json({ comments: [] }));

    const res = await GET(getRequest(), params("todo-1"));

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Not found" });
    expect(seen).toEqual([]);
  });

  it("answers 401 when the admin's token cannot be resolved", async () => {
    vi.mocked(auth0.getAccessToken).mockRejectedValue(new Error("no session"));
    const seen = upstream("get", () => HttpResponse.json({ comments: [] }));

    const res = await GET(getRequest(), params("todo-1"));

    expect(res.status).toBe(401);
    expect(seen).toEqual([]);
  });

  it("keeps the backend's status but replaces its body with a fixed message", async () => {
    upstream("get", () => HttpResponse.json({ error: "no such todo: row 9" }, { status: 404 }));

    const res = await GET(getRequest(), params("todo-1"));

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Failed to load comments" });
  });

  it("answers 502 when the backend cannot be reached", async () => {
    server.use(http.get(COMMENTS_URL, () => HttpResponse.error()));

    const res = await GET(getRequest(), params("todo-1"));

    expect(res.status).toBe(502);
    expect(await res.json()).toMatchObject({ cause: "unreachable" });
  });

  it("rejects a path-traversal id with 400 and never calls the backend", async () => {
    const seen = upstream("get", () => HttpResponse.json({ comments: [] }));

    const res = await GET(getRequest(), params("../admin"));

    expect(res.status).toBe(400);
    expect(seen).toEqual([]);
  });
});

describe("POST /api/todos/:id/comments", () => {
  it("forwards the trimmed comment to that item and answers 201 with the stored comment", async () => {
    const stored = { id: "c2", body: "needs a test" };
    const seen = upstream("post", () => HttpResponse.json(stored));

    const res = await POST(postRequest({ body: "  needs a test  " }), params("todo-1"));

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual(stored);
    expect(seen).toEqual([{ authorization: "Bearer admin-token", body: { body: "needs a test" } }]);
  });

  it.each([
    { name: "an empty comment", body: { body: "" } },
    { name: "a whitespace-only comment", body: { body: "   " } },
    { name: "a comment over 4000 characters", body: { body: "x".repeat(4001) } },
    { name: "a missing body field", body: {} },
  ])("rejects $name with 400 before calling the backend", async ({ body }) => {
    const seen = upstream("post", () => HttpResponse.json({}));

    const res = await POST(postRequest(body), params("todo-1"));

    expect(res.status).toBe(400);
    expect(seen).toEqual([]);
  });

  it("accepts a comment of exactly 4000 characters", async () => {
    const seen = upstream("post", () => HttpResponse.json({ id: "c3" }));

    const res = await POST(postRequest({ body: "x".repeat(4000) }), params("todo-1"));

    expect(res.status).toBe(201);
    expect(seen).toHaveLength(1);
  });

  it("hides the endpoint from a non-admin with a 404 before reading the body", async () => {
    vi.mocked(auth0.getSession).mockResolvedValue({
      user: { sub: "auth0|2", email: "someone@example.com", email_verified: true },
    } as Session);
    const seen = upstream("post", () => HttpResponse.json({}));

    const res = await POST(postRequest({ body: "hello" }), params("todo-1"));

    expect(res.status).toBe(404);
    expect(seen).toEqual([]);
  });

  it("keeps the backend's status but replaces its body with a fixed message", async () => {
    upstream("post", () => HttpResponse.json({ error: "db constraint" }, { status: 409 }));

    const res = await POST(postRequest({ body: "hello" }), params("todo-1"));

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "Failed to add comment" });
  });

  it("answers 502 when the backend cannot be reached", async () => {
    server.use(http.post(COMMENTS_URL, () => HttpResponse.error()));

    const res = await POST(postRequest({ body: "hello" }), params("todo-1"));

    expect(res.status).toBe(502);
    expect(await res.json()).toMatchObject({ cause: "unreachable" });
  });

  it("rejects a path-traversal id with 400 and never calls the backend", async () => {
    const seen = upstream("post", () => HttpResponse.json({}));

    const res = await POST(postRequest({ body: "hello" }), params("../admin"));

    expect(res.status).toBe(400);
    expect(seen).toEqual([]);
  });
});
