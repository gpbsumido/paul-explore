import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth0", () => ({
  auth0: { getAccessToken: vi.fn() },
}));

vi.mock("@/lib/upstream", async () => {
  const actual = await vi.importActual<typeof import("@/lib/upstream")>("@/lib/upstream");
  return { ...actual, fetchUpstream: vi.fn() };
});

import { auth0 } from "@/lib/auth0";
import { fetchUpstream } from "@/lib/upstream";
import { GET, PUT, POST } from "./[[...path]]/route";

const params = (...path: string[]) => ({ params: Promise.resolve({ path }) });

const upstreamReturns = (body: unknown) =>
  vi.mocked(fetchUpstream).mockResolvedValue({
    ok: true,
    response: new Response(JSON.stringify(body), { status: 200 }),
  });

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(auth0.getAccessToken).mockResolvedValue({
    token: "t",
    expiresAt: Date.now() / 1000 + 3600,
    scope: "openid",
  } as Awaited<ReturnType<typeof auth0.getAccessToken>>);
});

describe("practice proxy", () => {
  it("reads the caller's reviews from the backend", async () => {
    upstreamReturns({ reviews: [] });

    const res = await GET(new NextRequest("http://localhost/api/practice/reviews"), params("reviews"));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ reviews: [] });
    expect(vi.mocked(fetchUpstream).mock.calls[0][0]).toMatch(/\/api\/practice\/reviews$/);
  });

  it("forwards a saved review with its body", async () => {
    upstreamReturns({ review: { kind: "problem", itemId: "two-sum" } });
    const body = JSON.stringify({ step: 0, dueAt: "2026-11-05T00:00:00.000Z", lastReviewedAt: "2026-11-04T00:00:00.000Z", reviews: 1 });

    const res = await PUT(
      new NextRequest("http://localhost/x", { method: "PUT", body }),
      params("reviews", "problem", "two-sum"),
    );

    expect(res.status).toBe(200);
    const [url, init] = vi.mocked(fetchUpstream).mock.calls[0];
    expect(url).toMatch(/\/api\/practice\/reviews\/problem\/two-sum$/);
    expect(init).toMatchObject({ method: "PUT", body });
  });

  it("forwards an import with its body", async () => {
    upstreamReturns({ reviews: [] });
    const body = JSON.stringify({ reviews: [] });

    await POST(new NextRequest("http://localhost/x", { method: "POST", body }), params("reviews", "import"));

    expect(vi.mocked(fetchUpstream).mock.calls[0][1]).toMatchObject({ method: "POST", body });
  });

  it("rejects a path segment that isn't a slug and never calls the backend", async () => {
    const res = await GET(new NextRequest("http://localhost/x"), params("reviews", ".."));

    expect(res.status).toBe(400);
    expect(fetchUpstream).not.toHaveBeenCalled();
  });

  it("answers 401 when nobody is signed in, so the page keeps its local progress", async () => {
    vi.mocked(auth0.getAccessToken).mockRejectedValue(new Error("no session"));

    const res = await GET(new NextRequest("http://localhost/x"), params("reviews"));

    expect(res.status).toBe(401);
    expect(fetchUpstream).not.toHaveBeenCalled();
  });
});
