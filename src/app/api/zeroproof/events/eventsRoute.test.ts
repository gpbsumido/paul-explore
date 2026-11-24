import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/upstream", async () => {
  const actual = await vi.importActual<typeof import("@/lib/upstream")>("@/lib/upstream");
  return { ...actual, fetchUpstream: vi.fn() };
});
vi.mock("@/lib/auth0", () => ({
  auth0: { getSession: vi.fn(), getAccessToken: vi.fn() },
}));

import { fetchUpstream } from "@/lib/upstream";
import { auth0 } from "@/lib/auth0";

const upstream = (body: unknown) =>
  ({
    ok: true as const,
    response: new Response(JSON.stringify(body), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  }) as unknown as Awaited<ReturnType<typeof fetchUpstream>>;

const calledUrl = () => vi.mocked(fetchUpstream).mock.calls[0][0] as string;

beforeEach(() => {
  vi.mocked(auth0.getAccessToken).mockResolvedValue({ token: "tok" } as never);
  vi.mocked(fetchUpstream).mockResolvedValue(upstream({ events: [] }));
});
afterEach(() => vi.clearAllMocks());

describe("GET /api/zeroproof/events", () => {
  it("forwards include=past and the pastDays window to the backend", async () => {
    const { GET } = await import("./route");
    const res = await GET(
      new Request("http://localhost/api/zeroproof/events?include=past&pastDays=14"),
    );
    expect(res.status).toBe(200);
    // The window the frontend widens as you scroll back must reach the backend,
    // or "load earlier" is a no-op and the past query serves the wrong span.
    expect(calledUrl()).toContain("include=past");
    expect(calledUrl()).toContain("pastDays=14");
  });

  it("asks only for upcoming events by default", async () => {
    const { GET } = await import("./route");
    await GET(new Request("http://localhost/api/zeroproof/events"));
    expect(calledUrl()).not.toContain("include=past");
    expect(calledUrl()).not.toContain("pastDays");
  });

  it("forwards how far ahead the board wants, so the backend stops at that cap", async () => {
    const { GET } = await import("./route");
    await GET(new Request("http://localhost/api/zeroproof/events?aheadDays=30"));
    expect(calledUrl()).toContain("aheadDays=30");
  });

  it("forwards the ahead cap alongside the past window", async () => {
    const { GET } = await import("./route");
    await GET(
      new Request("http://localhost/api/zeroproof/events?include=past&pastDays=14&aheadDays=30"),
    );
    expect(calledUrl()).toContain("pastDays=14");
    expect(calledUrl()).toContain("aheadDays=30");
  });

  it("only treats include=past as a request for finished fixtures", async () => {
    const { GET } = await import("./route");
    await GET(new Request("http://localhost/api/zeroproof/events?include=future"));
    expect(calledUrl()).not.toContain("include");
  });

  it("ignores pastDays unless the past was asked for", async () => {
    const { GET } = await import("./route");
    await GET(new Request("http://localhost/api/zeroproof/events?pastDays=14"));
    expect(calledUrl()).not.toContain("pastDays");
  });

  it("serves the slate to a signed-out visitor, with no token on the request", async () => {
    vi.mocked(auth0.getAccessToken).mockRejectedValue(new Error("no session"));
    const { GET } = await import("./route");
    const res = await GET(new Request("http://localhost/api/zeroproof/events"));
    expect(res.status).toBe(200);
    expect(vi.mocked(fetchUpstream).mock.calls[0][1]?.headers).toBeUndefined();
  });

  it("sends a signed-in visitor's token along", async () => {
    const { GET } = await import("./route");
    await GET(new Request("http://localhost/api/zeroproof/events"));
    expect(vi.mocked(fetchUpstream).mock.calls[0][1]?.headers).toEqual({
      Authorization: "Bearer tok",
    });
  });

  it("returns only the events list, defaulting to empty", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue(upstream({ events: [{ id: "e1" }], extra: 1 }));
    const { GET } = await import("./route");
    expect(await (await GET(new Request("http://localhost/api/zeroproof/events"))).json()).toEqual({
      events: [{ id: "e1" }],
    });

    vi.mocked(fetchUpstream).mockResolvedValue(upstream({}));
    expect(await (await GET(new Request("http://localhost/api/zeroproof/events"))).json()).toEqual({
      events: [],
    });
  });

  it("passes a backend failure through with the events label", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(fetchUpstream).mockResolvedValue({
      ok: true,
      response: new Response("nope", { status: 503 }),
    });
    const { GET } = await import("./route");
    const res = await GET(new Request("http://localhost/api/zeroproof/events"));
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "Failed to fetch events" });
  });
});
