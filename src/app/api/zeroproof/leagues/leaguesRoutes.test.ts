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
import { forgiveUnexpectedOutput } from "@/test/unexpectedOutput";

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

  it("passes on only the search and invite-code parameters", async () => {
    signedOut();
    vi.mocked(fetchUpstream).mockResolvedValue(upstream({ leagues: [] }));
    const { GET } = await import("./route");

    await GET(
      new NextRequest("http://localhost/api/zeroproof/leagues?q=friday&code=ABC234&admin=true"),
    );

    const url = new URL(String(vi.mocked(fetchUpstream).mock.calls[0][0]));
    expect([...url.searchParams.keys()].sort()).toEqual(["code", "q"]);
    expect(url.searchParams.get("code")).toBe("ABC234");
  });

  it("sends a signed-in visitor's token, and nothing for a signed-out one", async () => {
    // A fresh Response per call: a body can be read once, so handing the same
    // one to both requests made the second throw "Body has already been read"
    // and the route quietly answered 502, which this test never looked at.
    vi.mocked(fetchUpstream).mockImplementation(async () => upstream({ leagues: [] }));
    const { GET } = await import("./route");

    signedIn();
    await GET(new NextRequest("http://localhost/api/zeroproof/leagues"));
    signedOut();
    await GET(new NextRequest("http://localhost/api/zeroproof/leagues"));

    expect(vi.mocked(fetchUpstream).mock.calls[0][1]?.headers).toEqual({ Authorization: "Bearer tok" });
    expect(vi.mocked(fetchUpstream).mock.calls[1][1]?.headers).toBeUndefined();
  });

  it("passes a backend failure through as a labelled error", async () => {
    signedOut();
    vi.mocked(fetchUpstream).mockResolvedValue(upstream({ error: "x" }, 503));
    const { GET } = await import("./route");

    const res = await GET(new NextRequest("http://localhost/api/zeroproof/leagues"));

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "Failed to load leagues" });
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
    const [, init] = vi.mocked(fetchUpstream).mock.calls[0];
    expect(init?.method).toBe("POST");
    expect(init?.headers).toEqual({
      Authorization: "Bearer tok",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init?.body))).toEqual({ name: "Friday", visibility: "public" });
  });

  it("passes the backend's validation error through with its status", async () => {
    signedIn();
    vi.mocked(fetchUpstream).mockResolvedValue(upstream({ error: "name is required" }, 400));
    const { POST } = await import("./route");

    const res = await POST(
      new NextRequest("http://localhost/api/zeroproof/leagues", {
        method: "POST",
        body: JSON.stringify({}),
      }),
      {},
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "name is required" });
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
    expect(fetchUpstream).not.toHaveBeenCalled();
    expect(forgiveUnexpectedOutput()).toEqual([
      "[zeroproof create league] auth failed: Error: no session",
    ]);
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

describe("GET /api/zeroproof/leagues/:id edge cases", () => {
  const ask = async (id: string) => {
    const { GET } = await import("./[id]/route");
    return GET(new NextRequest("http://localhost/api/zeroproof/leagues/x"), {
      params: Promise.resolve({ id }),
    });
  };

  it("passes a missing league through as the backend's 404", async () => {
    signedOut();
    vi.mocked(fetchUpstream).mockResolvedValue(upstream({ error: "League not found" }, 404));

    const res = await ask("nope");

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "League not found" });
  });

  it("sends a signed-in caller's token so they get their own membership", async () => {
    signedIn();
    vi.mocked(fetchUpstream).mockResolvedValue(upstream({ league: { id: "lg-1" }, isMember: true }));

    await ask("lg-1");

    expect(vi.mocked(fetchUpstream).mock.calls[0][1]?.headers).toEqual({ Authorization: "Bearer tok" });
  });

  it("answers 400, not an outage, for an id that is a path", async () => {
    signedOut();

    const res = await ask("..");

    expect(res.status).toBe(400);
    expect(fetchUpstream).not.toHaveBeenCalled();
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
    const [, init] = vi.mocked(fetchUpstream).mock.calls[0];
    expect(init?.method).toBe("POST");
    expect(init?.headers).toMatchObject({ Authorization: "Bearer tok" });
    expect(JSON.parse(String(init?.body))).toEqual({ joinCode: "ABC234" });
  });

  it("passes a wrong invite code through as the backend's refusal", async () => {
    signedIn();
    vi.mocked(fetchUpstream).mockResolvedValue(upstream({ error: "Wrong join code" }, 403));
    const { POST } = await import("./[id]/join/route");

    const res = await POST(
      new NextRequest("http://localhost/api/zeroproof/leagues/lg-1/join", {
        method: "POST",
        body: JSON.stringify({ joinCode: "NOPE" }),
      }),
      { params: Promise.resolve({ id: "lg-1" }) },
    );

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Wrong join code" });
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
    expect(fetchUpstream).not.toHaveBeenCalled();
    expect(forgiveUnexpectedOutput()).toEqual([
      "[zeroproof join league] auth failed: Error: no session",
    ]);
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
    expect(fetchUpstream).not.toHaveBeenCalled();
    expect(forgiveUnexpectedOutput()).toEqual([
      "[zeroproof my leagues] auth failed: Error: no session",
    ]);
  });

  it("sends the caller's token and passes a failure through as a labelled error", async () => {
    signedIn();
    vi.mocked(fetchUpstream).mockResolvedValue(upstream({ error: "x" }, 403));
    const { GET } = await import("./mine/route");
    const res = await GET(new NextRequest("http://localhost/api/zeroproof/leagues/mine"), {});
    expect(vi.mocked(fetchUpstream).mock.calls[0][1]?.headers).toMatchObject({
      Authorization: "Bearer tok",
    });
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Failed to load your leagues" });
  });
});
