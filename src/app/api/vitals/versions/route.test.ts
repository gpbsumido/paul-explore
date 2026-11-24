import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/auth0", () => ({
  auth0: { getAccessToken: vi.fn(), getSession: vi.fn() },
}));

import { auth0 } from "@/lib/auth0";
import { GET } from "./route";

const fetchMock = vi.fn();

const upstreamHeaders = () => fetchMock.mock.calls[0][1]?.headers as Record<string, string> | undefined;

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.mocked(auth0.getAccessToken).mockResolvedValue({
    token: "user-token",
    expiresAt: Date.now() / 1000 + 3600,
    scope: "openid",
    // The mock only has to carry what the route reads.
  } as Awaited<ReturnType<typeof auth0.getAccessToken>>);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  fetchMock.mockReset();
});

describe("GET /api/vitals/versions", () => {
  it("returns the version list from the API", async () => {
    fetchMock.mockResolvedValue(Response.json({ versions: ["9.2.15", "9.2.14"], extra: "dropped" }));

    const res = await GET();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ versions: ["9.2.15", "9.2.14"] });
    expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/api\/vitals\/versions$/);
  });

  it("sends the visitor's token when they have one", async () => {
    fetchMock.mockResolvedValue(Response.json({ versions: [] }));

    await GET();

    expect(upstreamHeaders()).toEqual({ Authorization: "Bearer user-token" });
  });

  it("still answers for a visitor with no session, without a token", async () => {
    vi.mocked(auth0.getAccessToken).mockRejectedValue(new Error("no session"));
    fetchMock.mockResolvedValue(Response.json({ versions: ["9.2.15"] }));

    const res = await GET();

    expect(await res.json()).toEqual({ versions: ["9.2.15"] });
    expect(upstreamHeaders()).toBeUndefined();
  });

  it("returns an empty list rather than undefined when the API leaves the field out", async () => {
    fetchMock.mockResolvedValue(Response.json({}));

    const res = await GET();

    expect(await res.json()).toEqual({ versions: [] });
  });

  it("keeps the API's status under its own label when it refuses", async () => {
    fetchMock.mockResolvedValue(new Response("nope", { status: 403 }));

    const res = await GET();

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Failed to fetch versions" });
  });

  it("answers 502 when the API can't be reached", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));

    const res = await GET();

    expect(res.status).toBe(502);
  });

  it("answers 502 when the API's body isn't JSON", async () => {
    fetchMock.mockResolvedValue(new Response("<html>", { status: 200 }));

    const res = await GET();

    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: "Backend unavailable" });
  });
});
