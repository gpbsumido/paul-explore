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

const params = (id: string, entryId: string) => ({
  params: Promise.resolve({ id, entryId }),
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(auth0.getAccessToken).mockResolvedValue({
    token: "t",
    expiresAt: Date.now() / 1000 + 3600,
    scope: "openid",
  } as Awaited<ReturnType<typeof auth0.getAccessToken>>);
});

describe("calendar events/:id/cards/:entryId proxy", () => {
  it("rejects a malformed event id with 400 and never calls the backend", async () => {
    // The separator in the id would previously reach the outer catch and read
    // as a 502 backend outage; withBackend now maps it to a 400 instead.
    const res = await DELETE(
      new NextRequest("http://localhost/x"),
      params("../secret", "entry-1"),
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid identifier" });
    expect(fetchUpstream).not.toHaveBeenCalled();
  });

  it("forwards a well-formed request to the backend and returns its result", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue({
      ok: true,
      response: new Response(
        JSON.stringify({ id: "entry-1", quantity: 2 }),
        { status: 200 },
      ),
    });

    const req = new NextRequest("http://localhost/x", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ quantity: 2 }),
    });
    const res = await PUT(req, params("ev-1", "entry-1"));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: "entry-1", quantity: 2 });
    expect(fetchUpstream).toHaveBeenCalledTimes(1);
    expect(vi.mocked(fetchUpstream).mock.calls[0][0]).toContain(
      "/api/calendar/events/ev-1/cards/entry-1",
    );
  });
});
