import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth0", () => ({
  auth0: { getAccessToken: vi.fn() },
}));

import { auth0 } from "@/lib/auth0";
import { server } from "@/test/server";
import { API_URL } from "@/lib/apiUrl";
import { GET, PUT, DELETE } from "./route";

const EVENT_URL = `${API_URL}/api/calendar/events/evt-1`;
const params = (id: string) => ({ params: Promise.resolve({ id }) });
const plainRequest = () => new NextRequest("http://localhost/x");
const putRequest = (body: unknown) =>
  new NextRequest("http://localhost/x", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

type Seen = { authorization: string | null; body: unknown };

/** Registers one upstream handler and returns what it was sent. */
function upstream(
  method: "get" | "put" | "delete",
  respond: () => Response,
): Seen[] {
  const seen: Seen[] = [];
  server.use(
    http[method](EVENT_URL, async ({ request }) => {
      seen.push({
        authorization: request.headers.get("authorization"),
        body: method === "put" ? await request.json() : undefined,
      });
      return respond();
    }),
  );
  return seen;
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

describe("GET /api/calendar/events/:id", () => {
  it("fetches that event with the visitor's token and returns it untouched", async () => {
    const event = { id: "evt-1", title: "Dentist", allDay: false };
    const seen = upstream("get", () => HttpResponse.json(event));

    const res = await GET(plainRequest(), params("evt-1"));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(event);
    expect(seen).toEqual([{ authorization: "Bearer visitor-token", body: undefined }]);
  });

  it("answers 401 without calling the backend when nobody is signed in", async () => {
    vi.mocked(auth0.getAccessToken).mockRejectedValue(new Error("no session"));
    const seen = upstream("get", () => HttpResponse.json({}));

    const res = await GET(plainRequest(), params("evt-1"));

    expect(res.status).toBe(401);
    expect(seen).toEqual([]);
  });

  it("keeps the backend's status but replaces its body with a fixed message", async () => {
    upstream("get", () => HttpResponse.json({ error: "internal detail: row 42" }, { status: 404 }));

    const res = await GET(plainRequest(), params("evt-1"));

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Failed to fetch event" });
  });

  it("answers 502 when the backend cannot be reached", async () => {
    server.use(http.get(EVENT_URL, () => HttpResponse.error()));

    const res = await GET(plainRequest(), params("evt-1"));

    expect(res.status).toBe(502);
    expect(await res.json()).toMatchObject({ cause: "unreachable" });
  });

  it("rejects a path-traversal id with 400 and never calls the backend", async () => {
    const seen = upstream("get", () => HttpResponse.json({}));

    const res = await GET(plainRequest(), params("../admin"));

    expect(res.status).toBe(400);
    expect(seen).toEqual([]);
  });
});

describe("a path-traversal id on the write routes", () => {
  it("is rejected with 400 on PUT and DELETE before anything is sent upstream", async () => {
    const putSeen = upstream("put", () => HttpResponse.json({}));
    const deleteSeen = upstream("delete", () => new HttpResponse(null, { status: 204 }));

    const put = await PUT(putRequest({ title: "x" }), params("../admin"));
    const del = await DELETE(plainRequest(), params("../admin"));

    expect([put.status, del.status]).toEqual([400, 400]);
    expect(putSeen).toEqual([]);
    expect(deleteSeen).toEqual([]);
  });
});

describe("PUT /api/calendar/events/:id", () => {
  it("forwards the validated update to that event and returns the result", async () => {
    const seen = upstream("put", () => HttpResponse.json({ id: "evt-1", title: "Moved" }));

    const res = await PUT(putRequest({ title: "Moved", allDay: true }), params("evt-1"));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: "evt-1", title: "Moved" });
    expect(seen).toEqual([
      { authorization: "Bearer visitor-token", body: { title: "Moved", allDay: true } },
    ]);
  });

  it("strips fields the schema does not know before they reach the backend", async () => {
    const seen = upstream("put", () => HttpResponse.json({ id: "evt-1" }));

    await PUT(putRequest({ title: "Moved", ownerSub: "someone-else" }), params("evt-1"));

    expect(seen[0].body).toEqual({ title: "Moved" });
  });

  it.each([
    { name: "an empty title", body: { title: "" } },
    { name: "a non-boolean allDay", body: { allDay: "yes" } },
  ])("rejects $name with 400 before calling the backend", async ({ body }) => {
    const seen = upstream("put", () => HttpResponse.json({}));

    const res = await PUT(putRequest(body), params("evt-1"));

    expect(res.status).toBe(400);
    expect(seen).toEqual([]);
  });

  it("answers 401 when nobody is signed in", async () => {
    vi.mocked(auth0.getAccessToken).mockRejectedValue(new Error("no session"));
    const seen = upstream("put", () => HttpResponse.json({}));

    const res = await PUT(putRequest({ title: "x" }), params("evt-1"));

    expect(res.status).toBe(401);
    expect(seen).toEqual([]);
  });

  it("passes the backend's refusal through with its status", async () => {
    upstream("put", () => HttpResponse.json({ error: "Not your event" }, { status: 403 }));

    const res = await PUT(putRequest({ title: "x" }), params("evt-1"));

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Not your event" });
  });

  it("falls back to its own message when the refusal has no JSON body", async () => {
    upstream("put", () => new HttpResponse("boom", { status: 500 }));

    const res = await PUT(putRequest({ title: "x" }), params("evt-1"));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Failed to update event" });
  });

  it("answers 502 when the backend cannot be reached", async () => {
    server.use(http.put(EVENT_URL, () => HttpResponse.error()));

    const res = await PUT(putRequest({ title: "x" }), params("evt-1"));

    expect(res.status).toBe(502);
    expect(await res.json()).toMatchObject({ cause: "unreachable" });
  });
});

describe("DELETE /api/calendar/events/:id", () => {
  it("deletes that event with the visitor's token and answers 204 with no body", async () => {
    const seen = upstream("delete", () => new HttpResponse(null, { status: 204 }));

    const res = await DELETE(plainRequest(), params("evt-1"));

    expect(res.status).toBe(204);
    expect(await res.text()).toBe("");
    expect(seen).toEqual([{ authorization: "Bearer visitor-token", body: undefined }]);
  });

  it("answers 401 when nobody is signed in", async () => {
    vi.mocked(auth0.getAccessToken).mockRejectedValue(new Error("no session"));
    const seen = upstream("delete", () => new HttpResponse(null, { status: 204 }));

    const res = await DELETE(plainRequest(), params("evt-1"));

    expect(res.status).toBe(401);
    expect(seen).toEqual([]);
  });

  it("passes the backend's refusal through with its status", async () => {
    upstream("delete", () => HttpResponse.json({ error: "Not your event" }, { status: 403 }));

    const res = await DELETE(plainRequest(), params("evt-1"));

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Not your event" });
  });

  it("falls back to its own message when the refusal has no JSON body", async () => {
    upstream("delete", () => new HttpResponse("boom", { status: 500 }));

    const res = await DELETE(plainRequest(), params("evt-1"));

    expect(await res.json()).toEqual({ error: "Failed to delete event" });
  });

  it("answers 502 when the backend cannot be reached", async () => {
    server.use(http.delete(EVENT_URL, () => HttpResponse.error()));

    const res = await DELETE(plainRequest(), params("evt-1"));

    expect(res.status).toBe(502);
    expect(await res.json()).toMatchObject({ cause: "unreachable" });
  });
});
