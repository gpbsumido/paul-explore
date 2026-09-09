import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/upstream", async () => {
  const actual = await vi.importActual<typeof import("@/lib/upstream")>("@/lib/upstream");
  return { ...actual, fetchUpstream: vi.fn() };
});

vi.mock("@/lib/auth0", () => ({
  auth0: { getAccessToken: vi.fn() },
}));

import { NextRequest } from "next/server";
import { fetchUpstream } from "@/lib/upstream";
import { auth0 } from "@/lib/auth0";

const upstream = (body: unknown, status = 200) =>
  ({
    ok: true as const,
    response: new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    }),
  }) as unknown as Awaited<ReturnType<typeof fetchUpstream>>;

const timedOut = { ok: false, cause: "timeout", message: "deadline" } as Awaited<
  ReturnType<typeof fetchUpstream>
>;

const signedOut = () => vi.mocked(auth0.getAccessToken).mockRejectedValue(new Error("no session"));
const signedIn = () =>
  vi.mocked(auth0.getAccessToken).mockResolvedValue({ token: "tok" } as never);

afterEach(() => vi.clearAllMocks());

describe("GET /api/zeroproof/leagues", () => {
  it("forwards the search query and unwraps to { leagues }", async () => {
    signedOut();
    vi.mocked(fetchUpstream).mockResolvedValue(upstream({ leagues: [{ id: "lg-1" }] }));
    const { GET } = await import("./route");

    const res = await GET(new NextRequest("http://localhost/api/zeroproof/leagues?q=friday"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(vi.mocked(fetchUpstream).mock.calls[0][0]).toContain("/api/zeroproof/leagues?q=friday");
    expect(body.leagues).toHaveLength(1);
  });

  it("returns { leagues: [] } when the backend omits the key", async () => {
    signedOut();
    vi.mocked(fetchUpstream).mockResolvedValue(upstream({}));
    const { GET } = await import("./route");

    const body = await (await GET(new NextRequest("http://localhost/api/zeroproof/leagues"))).json();
    expect(body.leagues).toEqual([]);
  });

  it("surfaces a transport failure (a timeout maps to 504)", async () => {
    signedOut();
    vi.mocked(fetchUpstream).mockResolvedValue(timedOut);
    const { GET } = await import("./route");

    const res = await GET(new NextRequest("http://localhost/api/zeroproof/leagues"));
    expect(res.status).toBe(504);
  });
});

describe("POST /api/zeroproof/leagues", () => {
  it("creates a league and preserves the backend 201", async () => {
    signedIn();
    vi.mocked(fetchUpstream).mockResolvedValue(upstream({ league: { id: "lg-1" } }, 201));
    const { POST } = await import("./route");

    const res = await POST(
      new NextRequest("http://localhost/api/zeroproof/leagues", {
        method: "POST",
        body: JSON.stringify({ name: "Friday", visibility: "public" }),
      }),
      {},
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.league.id).toBe("lg-1");
  });

  it("401s without a session", async () => {
    signedOut();
    const { POST } = await import("./route");

    const res = await POST(
      new NextRequest("http://localhost/api/zeroproof/leagues", {
        method: "POST",
        body: JSON.stringify({}),
      }),
      {},
    );
    expect(res.status).toBe(401);
  });
});

describe("GET /api/zeroproof/leagues/:id", () => {
  it("returns the detail body at the backend status, signed out", async () => {
    signedOut();
    vi.mocked(fetchUpstream).mockResolvedValue(upstream({ league: { id: "lg-1" }, isMember: false }));
    const { GET } = await import("./[id]/route");

    const res = await GET(new NextRequest("http://localhost/api/zeroproof/leagues/lg-1"), {
      params: Promise.resolve({ id: "lg-1" }),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.isMember).toBe(false);
  });
});

describe("POST /api/zeroproof/leagues/:id/join", () => {
  it("forwards the join and preserves the backend status", async () => {
    signedIn();
    vi.mocked(fetchUpstream).mockResolvedValue(upstream({ walletId: "w-1" }, 200));
    const { POST } = await import("./[id]/join/route");

    const res = await POST(
      new NextRequest("http://localhost/api/zeroproof/leagues/lg-1/join", {
        method: "POST",
        body: JSON.stringify({ joinCode: "ABC234" }),
      }),
      { params: Promise.resolve({ id: "lg-1" }) },
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.walletId).toBe("w-1");
    expect(vi.mocked(fetchUpstream).mock.calls[0][0]).toContain("/api/zeroproof/leagues/lg-1/join");
  });

  it("401s without a session", async () => {
    signedOut();
    const { POST } = await import("./[id]/join/route");
    const res = await POST(
      new NextRequest("http://localhost/api/zeroproof/leagues/lg-1/join", {
        method: "POST",
        body: JSON.stringify({}),
      }),
      { params: Promise.resolve({ id: "lg-1" }) },
    );
    expect(res.status).toBe(401);
  });
});

describe("GET /api/zeroproof/leagues/mine", () => {
  it("returns the caller's leagues", async () => {
    signedIn();
    vi.mocked(fetchUpstream).mockResolvedValue(upstream({ leagues: [{ id: "lg-1", joinCode: "ABC234" }] }));
    const { GET } = await import("./mine/route");

    const body = await (
      await GET(new NextRequest("http://localhost/api/zeroproof/leagues/mine"), {})
    ).json();
    expect(body.leagues[0].joinCode).toBe("ABC234");
  });

  it("401s without a session", async () => {
    signedOut();
    const { GET } = await import("./mine/route");
    const res = await GET(new NextRequest("http://localhost/api/zeroproof/leagues/mine"), {});
    expect(res.status).toBe(401);
  });
});
