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
import { auth0 } from "@/lib/auth0";
import { forgiveUnexpectedOutput } from "@/test/unexpectedOutput";

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
    expect(forgiveUnexpectedOutput()).toEqual(["[vitals BFF] GET — backend error on summary"]);
  });

  it("forwards a signed-in visitor's token to both aggregate calls", async () => {
    vi.mocked(auth0.getAccessToken).mockResolvedValueOnce({
      token: "visitor-token",
      expiresAt: 0,
    });
    vi.mocked(fetchUpstream).mockImplementation(async (url: string) =>
      url.includes("/by-page") ? ok({ byPage: [] }) : ok({ summary: {} }),
    );
    const { GET } = await import("./route");

    await GET(req());

    for (const [, init] of vi.mocked(fetchUpstream).mock.calls) {
      expect(init?.headers).toEqual({ Authorization: "Bearer visitor-token" });
    }
  });

  it("goes through unauthenticated for a signed-out visitor", async () => {
    vi.mocked(fetchUpstream).mockImplementation(async (url: string) =>
      url.includes("/by-page") ? ok({ byPage: [] }) : ok({ summary: {} }),
    );
    const { GET } = await import("./route");

    const res = await GET(req());

    expect(res.status).toBe(200);
    for (const [, init] of vi.mocked(fetchUpstream).mock.calls) {
      expect(init?.headers).toBeUndefined();
    }
  });

  it("passes the app version filter on to both aggregate calls, encoded", async () => {
    vi.mocked(fetchUpstream).mockImplementation(async (url: string) =>
      url.includes("/by-page") ? ok({ byPage: [] }) : ok({ summary: {} }),
    );
    const { GET } = await import("./route");

    await GET(new NextRequest("http://localhost:3000/api/vitals?v=5.3.0%20beta"));

    const urls = vi.mocked(fetchUpstream).mock.calls.map(([url]) => url);
    expect(urls).toHaveLength(2);
    for (const url of urls) expect(url).toMatch(/\?v=5\.3\.0%20beta$/);
  });

  it("returns 502 when an aggregate answers with an error status", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(fetchUpstream).mockImplementation(async (url: string) =>
      url.includes("/by-page")
        ? ({
            ok: true,
            response: new Response("{}", { status: 500 }),
          } as Awaited<ReturnType<typeof fetchUpstream>>)
        : ok({ summary: {} }),
    );
    const { GET } = await import("./route");

    const res = await GET(req());

    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: "Failed to fetch vitals" });
  });
});

describe("POST /api/vitals", () => {
  const beacon = {
    metric: "LCP",
    value: 1800,
    rating: "good",
    page: "/",
    nav_type: "navigate",
    app_version: "5.3.0",
  };
  const send = (body: unknown) =>
    new NextRequest("http://localhost:3000/api/vitals", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

  it("forwards a valid beacon, version and navigation type included", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue(ok({ ok: true }));
    const { POST } = await import("./route");

    const res = await POST(send(beacon));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    const [url, init] = vi.mocked(fetchUpstream).mock.calls[0];
    expect(url).toMatch(/\/api\/vitals$/);
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual(beacon);
  });

  it("does not forward fields the backend never asked for", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue(ok({}));
    const { POST } = await import("./route");

    await POST(send({ ...beacon, user_email: "someone@example.com" }));

    const [, init] = vi.mocked(fetchUpstream).mock.calls[0];
    expect(JSON.parse(String(init?.body))).not.toHaveProperty("user_email");
  });

  it.each([
    ["an unknown metric", { ...beacon, metric: "FID" }],
    ["a value sent as text", { ...beacon, value: "1800" }],
    ["a missing page", { ...beacon, page: undefined }],
    ["a missing app version", { ...beacon, app_version: undefined }],
  ])("rejects %s with 400 and never calls the backend", async (_label, body) => {
    const { POST } = await import("./route");

    const res = await POST(send(body));

    expect(res.status).toBe(400);
    expect(fetchUpstream).not.toHaveBeenCalled();
  });

  it("refuses a beacon larger than 4 KB", async () => {
    const { POST } = await import("./route");

    const res = await POST(send({ ...beacon, page: "/" + "x".repeat(5000) }));

    expect(res.status).toBe(413);
    expect(fetchUpstream).not.toHaveBeenCalled();
  });

  it("passes the backend's status through", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue({
      ok: true,
      response: new Response(JSON.stringify({ error: "slow down" }), { status: 429 }),
    });
    const { POST } = await import("./route");

    const res = await POST(send(beacon));

    expect(res.status).toBe(429);
  });

  it("answers 504 when the backend times out", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue(timedOut);
    const { POST } = await import("./route");

    const res = await POST(send(beacon));

    expect(res.status).toBe(504);
  });
});
