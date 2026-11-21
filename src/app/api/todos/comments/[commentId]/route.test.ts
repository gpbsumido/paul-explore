import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/upstream", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/upstream")>("@/lib/upstream");
  return { ...actual, fetchUpstream: vi.fn() };
});
vi.mock("@/lib/auth0", () => ({
  auth0: { getSession: vi.fn(), getAccessToken: vi.fn() },
}));

import { API_URL } from "@/lib/apiUrl";
import { fetchUpstream } from "@/lib/upstream";
import { auth0 } from "@/lib/auth0";
import { PATCH, DELETE } from "./route";

type Session = Awaited<ReturnType<typeof auth0.getSession>>;

const admin = {
  user: { sub: "auth0|1", email: "admin@example.com", email_verified: true },
} as Session;
const nonAdmin = {
  user: { sub: "auth0|2", email: "someone@example.com", email_verified: true },
} as Session;

const upstream = (body: unknown, status = 200) =>
  ({
    ok: true as const,
    response: new Response(JSON.stringify(body), { status }),
  }) as unknown as Awaited<ReturnType<typeof fetchUpstream>>;

const params = (commentId: string) => ({
  params: Promise.resolve({ commentId }),
});

function patchRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/todos/comments/c-1", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const deleteRequest = () =>
  new NextRequest("http://localhost/api/todos/comments/c-1", {
    method: "DELETE",
  });

function upstreamCall(): { url: string; init: RequestInit } {
  const [url, init] = vi.mocked(fetchUpstream).mock.calls[0];
  return { url: String(url), init: init ?? {} };
}

beforeEach(() => {
  vi.stubEnv("FLAG_ADMIN_ALLOWED_EMAILS", "admin@example.com");
  vi.mocked(auth0.getSession).mockResolvedValue(admin);
  vi.mocked(auth0.getAccessToken).mockResolvedValue({ token: "tok" } as never);
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("PATCH /api/todos/comments/[commentId]", () => {
  it("sends the trimmed text to the backend for that comment", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue(upstream({ id: "c-1", body: "edited" }));

    const res = await PATCH(patchRequest({ body: "  edited  " }), params("c-1"));

    const { url, init } = upstreamCall();
    expect(url).toBe(`${API_URL}/api/todos/comments/c-1`);
    expect(init.method).toBe("PATCH");
    expect(init.headers).toMatchObject({
      Authorization: "Bearer tok",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init.body))).toEqual({ body: "edited" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: "c-1", body: "edited" });
  });

  it.each([
    ["an empty comment", { body: "" }],
    ["a comment of only spaces", { body: "   " }],
    ["a comment over 4000 characters", { body: "x".repeat(4001) }],
    ["no body at all", {}],
  ])("rejects %s with a 400 and never calls the backend", async (_name, payload) => {
    const res = await PATCH(patchRequest(payload), params("c-1"));

    expect(res.status).toBe(400);
    expect(fetchUpstream).not.toHaveBeenCalled();
  });

  it("keeps the backend's status but answers with a fixed message", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue(
      upstream({ error: "row 7 locked by tx 9" }, 404),
    );

    const res = await PATCH(patchRequest({ body: "edited" }), params("c-1"));

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Failed to edit comment" });
  });

  it("answers 502 when the backend is unreachable", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue({
      ok: false,
      cause: "unreachable",
      message: "ECONNREFUSED",
    });

    const res = await PATCH(patchRequest({ body: "edited" }), params("c-1"));

    expect(res.status).toBe(502);
  });

  it("hides the route from someone who is not the admin", async () => {
    vi.mocked(auth0.getSession).mockResolvedValue(nonAdmin);

    const res = await PATCH(patchRequest({ body: "edited" }), params("c-1"));

    expect(res.status).toBe(404);
    expect(fetchUpstream).not.toHaveBeenCalled();
  });

  it("rejects an id that tries to climb out of the path", async () => {
    const res = await PATCH(patchRequest({ body: "edited" }), params("../todos"));

    expect(res.status).toBe(400);
    expect(fetchUpstream).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/todos/comments/[commentId]", () => {
  it("asks the backend to remove that comment", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue(upstream({ removed: true }));

    const res = await DELETE(deleteRequest(), params("c-1"));

    const { url, init } = upstreamCall();
    expect(url).toBe(`${API_URL}/api/todos/comments/c-1`);
    expect(init.method).toBe("DELETE");
    expect(init.headers).toMatchObject({ Authorization: "Bearer tok" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ removed: true });
  });

  it("keeps the backend's status but answers with a fixed message", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue(
      upstream({ error: "row 7 locked by tx 9" }, 403),
    );

    const res = await DELETE(deleteRequest(), params("c-1"));

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Failed to remove comment" });
  });

  it("hides the route from someone who is not the admin", async () => {
    vi.mocked(auth0.getSession).mockResolvedValue(nonAdmin);

    const res = await DELETE(deleteRequest(), params("c-1"));

    expect(res.status).toBe(404);
    expect(fetchUpstream).not.toHaveBeenCalled();
  });

  it("rejects an id that tries to climb out of the path", async () => {
    const res = await DELETE(deleteRequest(), params("a/b"));

    expect(res.status).toBe(400);
    expect(fetchUpstream).not.toHaveBeenCalled();
  });
});
