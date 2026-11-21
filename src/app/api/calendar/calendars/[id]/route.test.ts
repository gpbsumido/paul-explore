import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

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
import { PUT, DELETE } from "./route";

/** A JSON PUT request, the way the client sends it. */
const putRequest = (body: unknown) =>
  new NextRequest("http://localhost/x", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

const params = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.mocked(auth0.getAccessToken).mockResolvedValue({
    token: "t",
    expiresAt: Date.now() / 1000 + 3600,
    scope: "openid",
  } as Awaited<ReturnType<typeof auth0.getAccessToken>>);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("calendar calendars/:id proxy", () => {
  it("rejects a malformed id with 400 and never calls the backend", async () => {
    // A path separator in the id used to slip through to the outer catch and be
    // reported as a 502 backend outage; withBackend now maps it to a 400.
    const res = await DELETE(
      new NextRequest("http://localhost/x"),
      params("../secret"),
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid identifier" });
    expect(fetchUpstream).not.toHaveBeenCalled();
  });

  it("forwards a well-formed request to the backend and returns its result", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue({
      ok: true,
      response: new Response(JSON.stringify({ id: "cal-1", name: "Home" }), {
        status: 200,
      }),
    });

    const req = new NextRequest("http://localhost/x", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Home" }),
    });
    const res = await PUT(req, params("cal-1"));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: "cal-1", name: "Home" });
    expect(fetchUpstream).toHaveBeenCalledTimes(1);
    expect(vi.mocked(fetchUpstream).mock.calls[0][0]).toContain(
      "/api/calendar/calendars/cal-1",
    );
  });

  it("sends the session token and the validated body to the backend", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue({
      ok: true,
      response: new Response(JSON.stringify({ id: "cal-1" }), { status: 200 }),
    });

    await PUT(putRequest({ name: "Home" }), params("cal-1"));

    const [, init] = vi.mocked(fetchUpstream).mock.calls[0];
    expect(init?.method).toBe("PUT");
    expect(init?.headers).toMatchObject({ Authorization: "Bearer t" });
    expect(JSON.parse(String(init?.body))).toEqual({ name: "Home" });
  });

  it("rejects an invalid body with 400 and never calls the backend", async () => {
    const res = await PUT(putRequest({ name: "" }), params("cal-1"));

    expect(res.status).toBe(400);
    expect(fetchUpstream).not.toHaveBeenCalled();
  });

  it("rejects a malformed id on PUT too", async () => {
    const res = await PUT(putRequest({ name: "Home" }), params("../secret"));

    expect(res.status).toBe(400);
    expect(fetchUpstream).not.toHaveBeenCalled();
  });

  it("passes a backend failure through with its status and message", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue({
      ok: true,
      response: new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
      }),
    });

    const res = await PUT(putRequest({ name: "Home" }), params("cal-1"));

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Forbidden" });
  });

  it("answers DELETE with an empty 204 when the backend accepts it", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue({
      ok: true,
      response: new Response(null, { status: 204 }),
    });

    const res = await DELETE(new NextRequest("http://localhost/x"), params("cal-1"));

    expect(res.status).toBe(204);
    const [url, init] = vi.mocked(fetchUpstream).mock.calls[0];
    expect(url).toContain("/api/calendar/calendars/cal-1");
    expect(init?.method).toBe("DELETE");
    expect(init?.headers).toMatchObject({ Authorization: "Bearer t" });
  });

  it("passes a failed DELETE through instead of reporting 204", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue({
      ok: true,
      response: new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
      }),
    });

    const res = await DELETE(new NextRequest("http://localhost/x"), params("cal-1"));

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Not found" });
  });

  it("answers 401 without touching the backend when there is no session", async () => {
    vi.mocked(auth0.getAccessToken).mockRejectedValue(new Error("no session"));

    const res = await DELETE(new NextRequest("http://localhost/x"), params("cal-1"));

    expect(res.status).toBe(401);
    expect(fetchUpstream).not.toHaveBeenCalled();
  });

  it("answers 502 when the backend cannot be reached", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue({
      ok: false,
      cause: "unreachable",
      message: "ECONNREFUSED",
    });

    const res = await DELETE(new NextRequest("http://localhost/x"), params("cal-1"));

    expect(res.status).toBe(502);
    expect(await res.json()).toMatchObject({ cause: "unreachable" });
  });

  it("answers 504 when the backend times out", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue({
      ok: false,
      cause: "timeout",
      message: "timed out",
    });

    const res = await DELETE(new NextRequest("http://localhost/x"), params("cal-1"));

    expect(res.status).toBe(504);
    expect(await res.json()).toMatchObject({ cause: "timeout" });
  });
});
