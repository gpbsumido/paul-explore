import { describe, it, expect, vi, afterEach } from "vitest";

vi.mock("@/lib/upstream", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/upstream")>("@/lib/upstream");
  return { ...actual, fetchUpstream: vi.fn() };
});

vi.mock("@/lib/auth0", () => ({
  auth0: { getAccessToken: vi.fn().mockRejectedValue(new Error("no session")) },
}));

import { NextRequest } from "next/server";
import { fetchUpstream } from "@/lib/upstream";

const ok = (body: unknown) =>
  ({
    ok: true as const,
    response: new Response(JSON.stringify(body), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  }) as unknown as Awaited<ReturnType<typeof fetchUpstream>>;

const timedOut = {
  ok: false,
  cause: "timeout",
  message: "deadline",
} as Awaited<ReturnType<typeof fetchUpstream>>;

const req = () => new NextRequest("http://localhost:3000/api/vitals");

afterEach(() => vi.clearAllMocks());

describe("GET /api/vitals", () => {
  it("goes through the bounded fetchUpstream, not a raw fetch, so a slow backend cannot hang the route", async () => {
    vi.mocked(fetchUpstream).mockImplementation(async (url: string) =>
      url.includes("/by-page")
        ? ok({ byPage: [{ page: "/", total: 1, metrics: {} }] })
        : ok({ summary: { LCP: { p75: 1200 } } }),
    );
    const { GET } = await import("./route");

    const res = await GET(req());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(fetchUpstream).toHaveBeenCalledTimes(2);
    expect(body.summary).toEqual({ LCP: { p75: 1200 } });
    expect(body.byPage).toHaveLength(1);
  });

  it("returns 502 when a bounded upstream call fails (a timeout no longer hangs)", async () => {
    vi.mocked(fetchUpstream).mockImplementation(async (url: string) =>
      url.includes("/by-page") ? ok({ byPage: [] }) : timedOut,
    );
    const { GET } = await import("./route");

    const res = await GET(req());

    expect(res.status).toBe(502);
  });
});
