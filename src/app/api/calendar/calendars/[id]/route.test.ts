import { describe, it, expect, vi, beforeEach } from "vitest";
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

const params = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(auth0.getAccessToken).mockResolvedValue({
    token: "t",
    expiresAt: Date.now() / 1000 + 3600,
    scope: "openid",
  } as Awaited<ReturnType<typeof auth0.getAccessToken>>);
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
});
