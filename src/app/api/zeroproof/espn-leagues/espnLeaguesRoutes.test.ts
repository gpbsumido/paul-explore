import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/upstream", async () => {
  const actual = await vi.importActual<typeof import("@/lib/upstream")>("@/lib/upstream");
  return { ...actual, fetchUpstream: vi.fn() };
});
vi.mock("@/lib/auth0", () => ({
  auth0: { getSession: vi.fn(), getAccessToken: vi.fn() },
}));

import { NextRequest } from "next/server";
import { fetchUpstream } from "@/lib/upstream";
import { auth0 } from "@/lib/auth0";

type Session = Awaited<ReturnType<typeof auth0.getSession>>;

const admin = {
  user: { sub: "auth0|1", email: "admin@example.com", email_verified: true },
} as Session;
const nonAdmin = {
  user: { sub: "auth0|2", email: "nope@example.com", email_verified: true },
} as Session;

const upstream = (body: unknown, status = 200) =>
  ({
    ok: true as const,
    response: new Response(body === null ? null : JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    }),
  }) as unknown as Awaited<ReturnType<typeof fetchUpstream>>;

const asAdmin = () => {
  vi.mocked(auth0.getSession).mockResolvedValue(admin);
  vi.mocked(auth0.getAccessToken).mockResolvedValue({ token: "tok" } as never);
};

beforeEach(() => {
  vi.stubEnv("FLAG_ADMIN_ALLOWED_EMAILS", "admin@example.com");
});
afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("GET/POST /api/zeroproof/espn-leagues", () => {
  it("lists the registry for an admin", async () => {
    asAdmin();
    vi.mocked(fetchUpstream).mockResolvedValue(upstream({ leagues: [{ id: "r1", game: "ffl" }] }));
    const { GET } = await import("./route");
    const res = await GET(new NextRequest("http://localhost/api/zeroproof/espn-leagues"), {});
    expect(res.status).toBe(200);
    expect((await res.json()).leagues).toHaveLength(1);
  });

  it("404s a non-admin (reads as absent) without calling the backend", async () => {
    vi.mocked(auth0.getSession).mockResolvedValue(nonAdmin);
    const { GET } = await import("./route");
    const res = await GET(new NextRequest("http://localhost/api/zeroproof/espn-leagues"), {});
    expect(res.status).toBe(404);
    expect(fetchUpstream).not.toHaveBeenCalled();
  });

  it("404s a non-admin trying to register a league", async () => {
    vi.mocked(auth0.getSession).mockResolvedValue(nonAdmin);
    const { POST } = await import("./route");
    const res = await POST(
      new NextRequest("http://localhost/api/zeroproof/espn-leagues", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ game: "ffl", leagueId: "836777691", season: "2026" }),
      }),
      {},
    );
    expect(res.status).toBe(404);
    expect(fetchUpstream).not.toHaveBeenCalled();
  });

  it("passes a failed list through as a labelled error", async () => {
    asAdmin();
    vi.mocked(fetchUpstream).mockResolvedValue(upstream({ error: "x" }, 403));
    const { GET } = await import("./route");
    const res = await GET(new NextRequest("http://localhost/api/zeroproof/espn-leagues"), {});
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Failed to load ESPN leagues" });
  });

  it("registers a league and preserves the backend 201", async () => {
    asAdmin();
    vi.mocked(fetchUpstream).mockResolvedValue(upstream({ league: { id: "r1" } }, 201));
    const { POST } = await import("./route");
    const res = await POST(
      new NextRequest("http://localhost/api/zeroproof/espn-leagues", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ game: "ffl", leagueId: "836777691", season: "2026" }),
      }),
      {},
    );
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ league: { id: "r1" } });
    const [, init] = vi.mocked(fetchUpstream).mock.calls[0];
    expect(init?.method).toBe("POST");
    expect(init?.headers).toMatchObject({ Authorization: "Bearer tok" });
    expect(JSON.parse(String(init?.body))).toEqual({
      game: "ffl",
      leagueId: "836777691",
      season: "2026",
    });
  });

  it("passes the backend's refusal of a registration through with its status", async () => {
    asAdmin();
    vi.mocked(fetchUpstream).mockResolvedValue(upstream({ error: "Already registered" }, 409));
    const { POST } = await import("./route");
    const res = await POST(
      new NextRequest("http://localhost/api/zeroproof/espn-leagues", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ game: "ffl", leagueId: "836777691", season: "2026" }),
      }),
      {},
    );
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "Already registered" });
  });

  it("still says something when the backend refuses a registration with no JSON", async () => {
    asAdmin();
    vi.mocked(fetchUpstream).mockResolvedValue({
      ok: true,
      response: new Response("<html>", { status: 500 }),
    });
    const { POST } = await import("./route");
    const res = await POST(
      new NextRequest("http://localhost/api/zeroproof/espn-leagues", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ game: "ffl", leagueId: "836777691", season: "2026" }),
      }),
      {},
    );
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Failed to add league" });
  });

  it("answers 502 when the backend cannot be reached for a registration", async () => {
    asAdmin();
    vi.mocked(fetchUpstream).mockResolvedValue({
      ok: false,
      cause: "unreachable",
      message: "down",
    });
    const { POST } = await import("./route");
    const res = await POST(
      new NextRequest("http://localhost/api/zeroproof/espn-leagues", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ game: "ffl", leagueId: "836777691", season: "2026" }),
      }),
      {},
    );
    expect(res.status).toBe(502);
    expect(await res.json()).toMatchObject({ cause: "unreachable" });
  });

  it("rejects a malformed body with 400 before hitting the backend", async () => {
    asAdmin();
    const { POST } = await import("./route");
    const res = await POST(
      new NextRequest("http://localhost/api/zeroproof/espn-leagues", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ game: "ffl", leagueId: "8", season: "nope" }),
      }),
      {},
    );
    expect(res.status).toBe(400);
    expect(fetchUpstream).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/zeroproof/espn-leagues/:id", () => {
  it("removes a league and returns 204", async () => {
    asAdmin();
    vi.mocked(fetchUpstream).mockResolvedValue(upstream(null, 204));
    const { DELETE } = await import("./[id]/route");
    const res = await DELETE(new NextRequest("http://localhost/api/zeroproof/espn-leagues/r1"), {
      params: Promise.resolve({ id: "r1" }),
    });
    expect(res.status).toBe(204);
    expect(vi.mocked(fetchUpstream).mock.calls[0][0]).toContain("/api/zeroproof/espn-leagues/r1");
  });

  it("404s a non-admin and never calls the backend", async () => {
    vi.mocked(auth0.getSession).mockResolvedValue(nonAdmin);
    const { DELETE } = await import("./[id]/route");
    const res = await DELETE(new NextRequest("http://localhost/api/zeroproof/espn-leagues/r1"), {
      params: Promise.resolve({ id: "r1" }),
    });
    expect(res.status).toBe(404);
    expect(fetchUpstream).not.toHaveBeenCalled();
  });

  it("passes a failed removal through instead of reporting 204", async () => {
    asAdmin();
    vi.mocked(fetchUpstream).mockResolvedValue(upstream({ error: "x" }, 403));
    const { DELETE } = await import("./[id]/route");
    const res = await DELETE(new NextRequest("http://localhost/api/zeroproof/espn-leagues/r1"), {
      params: Promise.resolve({ id: "r1" }),
    });
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Failed to remove league" });
  });

  it("uses the DELETE method with the admin's token", async () => {
    asAdmin();
    vi.mocked(fetchUpstream).mockResolvedValue(upstream(null, 204));
    const { DELETE } = await import("./[id]/route");
    await DELETE(new NextRequest("http://localhost/api/zeroproof/espn-leagues/r1"), {
      params: Promise.resolve({ id: "r1" }),
    });
    const [, init] = vi.mocked(fetchUpstream).mock.calls[0];
    expect(init?.method).toBe("DELETE");
    expect(init?.headers).toMatchObject({ Authorization: "Bearer tok" });
  });
});
