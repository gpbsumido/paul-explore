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
});
