import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/upstream", async () => {
  const actual = await vi.importActual<typeof import("@/lib/upstream")>("@/lib/upstream");
  return { ...actual, fetchUpstream: vi.fn() };
});

import { NextRequest } from "next/server";
import { fetchUpstream } from "@/lib/upstream";

const upstreamOk = (body: unknown, status = 202) =>
  ({
    ok: true as const,
    response: new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    }),
  }) as unknown as Awaited<ReturnType<typeof fetchUpstream>>;

const event = (overrides: Record<string, unknown> = {}) => ({
  eventUuid: "11111111-1111-4111-8111-111111111111",
  name: "page_view",
  page: "/zeroproof",
  seq: 1,
  sessionId: "sess-1",
  anonId: "anon-hash",
  clientTs: "2026-09-29T00:00:00.000Z",
  appVersion: "7.9.3",
  ...overrides,
});

const post = (body: unknown, ip = "203.0.113.1") =>
  new NextRequest("http://localhost:3000/api/zeroproof/track", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });

afterEach(() => vi.clearAllMocks());

describe("POST /api/zeroproof/track", () => {
  it("forwards a valid batch to the backend and returns its status", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue(upstreamOk({ accepted: 1, deduped: 0 }));
    const { POST } = await import("./route");

    const res = await POST(post({ events: [event()] }, "203.0.113.10"));
    const body = await res.json();

    expect(res.status).toBe(202);
    expect(body).toEqual({ accepted: 1, deduped: 0 });
    expect(fetchUpstream).toHaveBeenCalledTimes(1);
    expect(fetchUpstream).toHaveBeenCalledWith(
      expect.stringContaining("/api/zeroproof/track"),
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("rejects a malformed batch without touching the backend", async () => {
    const { POST } = await import("./route");

    const res = await POST(post({ events: [{ name: "page_view" }] }, "203.0.113.11"));

    expect(res.status).toBe(400);
    expect(fetchUpstream).not.toHaveBeenCalled();
  });

  it("rejects an empty batch", async () => {
    const { POST } = await import("./route");
    const res = await POST(post({ events: [] }, "203.0.113.12"));
    expect(res.status).toBe(400);
    expect(fetchUpstream).not.toHaveBeenCalled();
  });

  it("rate-limits a flood from one IP", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue(upstreamOk({ accepted: 1, deduped: 0 }));
    const { POST } = await import("./route");
    const ip = "203.0.113.99";

    let last = 0;
    for (let i = 0; i < 65; i++) {
      last = (await POST(post({ events: [event()] }, ip))).status;
    }
    expect(last).toBe(429);
  });
});
