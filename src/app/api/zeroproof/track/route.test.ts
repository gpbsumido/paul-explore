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

    const statuses: number[] = [];
    for (let i = 0; i < 62; i++) {
      statuses.push((await POST(post({ events: [event()] }, ip))).status);
    }
    expect(statuses.slice(0, 60).every((status) => status === 202)).toBe(true);
    expect(statuses.slice(60)).toEqual([429, 429]);
  });

  it("counts each IP on its own, so one flooder does not block everyone", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue(upstreamOk({ accepted: 1, deduped: 0 }));
    const { POST } = await import("./route");

    for (let i = 0; i < 61; i++) await POST(post({ events: [event()] }, "198.51.100.7"));
    const other = await POST(post({ events: [event()] }, "198.51.100.8"));

    expect(other.status).toBe(202);
  });

  it("does not call the backend for a request it rate-limited", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue(upstreamOk({ accepted: 1, deduped: 0 }));
    const { POST } = await import("./route");
    for (let i = 0; i < 60; i++) await POST(post({ events: [event()] }, "198.51.100.20"));
    vi.mocked(fetchUpstream).mockClear();

    await POST(post({ events: [event()] }, "198.51.100.20"));

    expect(fetchUpstream).not.toHaveBeenCalled();
  });

  it("sends the validated events on to the backend as JSON", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue(upstreamOk({ accepted: 1, deduped: 0 }));
    const { POST } = await import("./route");

    await POST(post({ events: [event({ seq: 7 })] }, "198.51.100.30"));

    const [, init] = vi.mocked(fetchUpstream).mock.calls[0];
    expect(init?.headers).toEqual({ "Content-Type": "application/json" });
    expect(JSON.parse(String(init?.body)).events[0]).toMatchObject({
      eventUuid: "11111111-1111-4111-8111-111111111111",
      seq: 7,
    });
  });

  it("refuses a body over 64 KB without calling the backend", async () => {
    const { POST } = await import("./route");
    const request = new NextRequest("http://localhost:3000/api/zeroproof/track", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "content-length": "70000",
        "x-forwarded-for": "198.51.100.40",
      },
      body: JSON.stringify({ events: [event()] }),
    });

    const res = await POST(request);

    expect(res.status).toBe(413);
    expect(fetchUpstream).not.toHaveBeenCalled();
  });

  it("passes the backend's status through", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue(upstreamOk({ error: "bad" }, 422));
    const { POST } = await import("./route");

    const res = await POST(post({ events: [event()] }, "198.51.100.50"));

    expect(res.status).toBe(422);
  });

  it("answers 502 when the backend cannot be reached", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue({
      ok: false,
      cause: "unreachable",
      message: "down",
    });
    const { POST } = await import("./route");

    const res = await POST(post({ events: [event()] }, "198.51.100.60"));

    expect(res.status).toBe(502);
    expect(await res.json()).toMatchObject({ cause: "unreachable" });
  });
});
