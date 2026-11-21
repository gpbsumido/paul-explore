import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth0", () => ({
  auth0: { getAccessToken: vi.fn() },
}));

import { auth0 } from "@/lib/auth0";
import { server } from "@/test/server";
import { API_URL } from "@/lib/apiUrl";
import { GET, POST } from "./route";

const MEMBERS_URL = `${API_URL}/api/calendar/calendars/cal-1/members`;
const params = (id: string) => ({ params: Promise.resolve({ id }) });

const postRequest = (body: unknown) =>
  new NextRequest("http://localhost/x", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

/** What the upstream saw, so a test can assert on the request not just the reply. */
type Seen = { authorization: string | null; contentType: string | null; body: unknown };

function recordMembers(
  method: "get" | "post",
  respond: () => Response,
): { seen: Seen[] } {
  const seen: Seen[] = [];
  server.use(
    http[method](MEMBERS_URL, async ({ request }) => {
      seen.push({
        authorization: request.headers.get("authorization"),
        contentType: request.headers.get("content-type"),
        body: method === "post" ? await request.json() : undefined,
      });
      return respond();
    }),
  );
  return { seen };
}

beforeEach(() => {
  vi.mocked(auth0.getAccessToken).mockResolvedValue({
    token: "visitor-token",
    expiresAt: Date.now() / 1000 + 3600,
    scope: "openid",
  } as Awaited<ReturnType<typeof auth0.getAccessToken>>);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("GET /api/calendar/calendars/:id/members", () => {
  it("answers 401 without calling the backend when nobody is signed in", async () => {
    vi.mocked(auth0.getAccessToken).mockRejectedValue(new Error("no session"));
    const { seen } = recordMembers("get", () => HttpResponse.json({ members: [] }));

    const res = await GET(new NextRequest("http://localhost/x"), params("cal-1"));

    expect(res.status).toBe(401);
    expect(seen).toEqual([]);
  });

  it("asks the backend for that calendar's members with the visitor's token and returns its body", async () => {
    const members = [{ id: "m1", email: "sam@example.com", role: "editor" }];
    const { seen } = recordMembers("get", () => HttpResponse.json({ members }));

    const res = await GET(new NextRequest("http://localhost/x"), params("cal-1"));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ members });
    expect(seen).toHaveLength(1);
    expect(seen[0].authorization).toBe("Bearer visitor-token");
  });

  it("passes a backend error body and status straight through", async () => {
    recordMembers("get", () => HttpResponse.json({ error: "Owner only" }, { status: 403 }));

    const res = await GET(new NextRequest("http://localhost/x"), params("cal-1"));

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Owner only" });
  });

  it("falls back to its own message when the backend error has no JSON body", async () => {
    recordMembers("get", () => new HttpResponse("<html>bad gateway</html>", { status: 500 }));

    const res = await GET(new NextRequest("http://localhost/x"), params("cal-1"));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Failed to fetch members" });
  });

  it("answers 502 when the backend cannot be reached", async () => {
    server.use(http.get(MEMBERS_URL, () => HttpResponse.error()));

    const res = await GET(new NextRequest("http://localhost/x"), params("cal-1"));

    expect(res.status).toBe(502);
    expect(await res.json()).toMatchObject({ cause: "unreachable" });
  });

  it("rejects a path-traversal id with 400 and never calls the backend", async () => {
    const { seen } = recordMembers("get", () => HttpResponse.json({ members: [] }));

    const res = await GET(new NextRequest("http://localhost/x"), params("../secret"));

    expect(res.status).toBe(400);
    expect(seen).toEqual([]);
  });
});

describe("POST /api/calendar/calendars/:id/members", () => {
  it("forwards a valid invite as JSON with the visitor's token and answers 201", async () => {
    const member = { id: "m2", email: "sam@example.com", role: "viewer" };
    const { seen } = recordMembers("post", () => HttpResponse.json({ member }, { status: 200 }));

    const res = await POST(
      postRequest({ email: "sam@example.com", role: "viewer" }),
      params("cal-1"),
    );

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ member });
    expect(seen).toEqual([
      {
        authorization: "Bearer visitor-token",
        contentType: "application/json",
        body: { email: "sam@example.com", role: "viewer" },
      },
    ]);
  });

  it.each([
    { name: "a malformed email", body: { email: "not-an-email", role: "editor" } },
    { name: "an unknown role", body: { email: "sam@example.com", role: "owner" } },
    { name: "no role", body: { email: "sam@example.com" } },
  ])("rejects $name with 400 before calling the backend", async ({ body }) => {
    const { seen } = recordMembers("post", () => HttpResponse.json({ member: {} }));

    const res = await POST(postRequest(body), params("cal-1"));

    expect(res.status).toBe(400);
    expect(seen).toEqual([]);
  });

  it("answers 401 when nobody is signed in, before reading the body", async () => {
    vi.mocked(auth0.getAccessToken).mockRejectedValue(new Error("no session"));
    const { seen } = recordMembers("post", () => HttpResponse.json({ member: {} }));

    const res = await POST(postRequest({ email: "sam@example.com", role: "editor" }), params("cal-1"));

    expect(res.status).toBe(401);
    expect(seen).toEqual([]);
  });

  it("passes the backend's refusal through with its status", async () => {
    recordMembers("post", () => HttpResponse.json({ error: "Already a member" }, { status: 409 }));

    const res = await POST(postRequest({ email: "sam@example.com", role: "editor" }), params("cal-1"));

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "Already a member" });
  });

  it("falls back to its own message when the refusal has no JSON body", async () => {
    recordMembers("post", () => new HttpResponse("nope", { status: 500 }));

    const res = await POST(postRequest({ email: "sam@example.com", role: "editor" }), params("cal-1"));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Failed to invite member" });
  });

  it("answers 502 when the backend cannot be reached", async () => {
    server.use(http.post(MEMBERS_URL, () => HttpResponse.error()));

    const res = await POST(postRequest({ email: "sam@example.com", role: "editor" }), params("cal-1"));

    expect(res.status).toBe(502);
    expect(await res.json()).toMatchObject({ cause: "unreachable" });
  });
});
