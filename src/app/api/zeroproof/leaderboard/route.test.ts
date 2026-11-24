import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/upstream", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/upstream")>("@/lib/upstream");
  return { ...actual, fetchUpstream: vi.fn() };
});
vi.mock("@/lib/auth0", () => ({
  auth0: { getSession: vi.fn(), getAccessToken: vi.fn() },
}));

import { fetchUpstream } from "@/lib/upstream";
import { auth0 } from "@/lib/auth0";
import { GET } from "./route";

const upstream = (body: unknown, status = 200) =>
  ({
    ok: true as const,
    response: new Response(JSON.stringify(body), { status }),
  }) as unknown as Awaited<ReturnType<typeof fetchUpstream>>;

const calledUrl = () => String(vi.mocked(fetchUpstream).mock.calls[0][0]);

beforeEach(() => {
  vi.mocked(auth0.getAccessToken).mockResolvedValue({ token: "tok" } as never);
  vi.mocked(fetchUpstream).mockResolvedValue(
    upstream({ board: "sharp", entries: [{ rank: 1 }] }),
  );
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("GET /api/zeroproof/leaderboard", () => {
  it("ranks the sharp board when no board is named", async () => {
    await GET(new Request("http://localhost/api/zeroproof/leaderboard"));
    expect(calledUrl()).toContain("/api/zeroproof/leaderboard?board=sharp");
  });

  it("ranks by return when the roi board is asked for", async () => {
    await GET(new Request("http://localhost/api/zeroproof/leaderboard?board=roi"));
    expect(calledUrl()).toContain("?board=roi");
  });

  it("does not pass an unknown board name on to the backend", async () => {
    await GET(
      new Request("http://localhost/api/zeroproof/leaderboard?board=../admin"),
    );
    expect(calledUrl()).toContain("?board=sharp");
    expect(calledUrl()).not.toContain("admin");
  });

  it("returns just the entries, not the backend's wrapper", async () => {
    const res = await GET(
      new Request("http://localhost/api/zeroproof/leaderboard"),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ entries: [{ rank: 1 }] });
  });

  it("is public: it still answers for a signed-out visitor, without a token", async () => {
    vi.mocked(auth0.getAccessToken).mockRejectedValue(new Error("no session"));

    const res = await GET(
      new Request("http://localhost/api/zeroproof/leaderboard"),
    );

    expect(res.status).toBe(200);
    const [, init] = vi.mocked(fetchUpstream).mock.calls[0];
    expect(init?.headers).toBeUndefined();
  });

  it("sends the visitor's token along when they have one", async () => {
    await GET(new Request("http://localhost/api/zeroproof/leaderboard"));
    const [, init] = vi.mocked(fetchUpstream).mock.calls[0];
    expect(init?.headers).toEqual({ Authorization: "Bearer tok" });
  });

  it("passes a backend error through with its status and the labelled message", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue(upstream({}, 503));

    const res = await GET(
      new Request("http://localhost/api/zeroproof/leaderboard"),
    );

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "Failed to fetch leaderboard" });
  });

  it("answers an empty list when the backend sends no entries", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue(upstream({ board: "sharp" }));

    const res = await GET(
      new Request("http://localhost/api/zeroproof/leaderboard"),
    );

    expect(await res.json()).toEqual({ entries: [] });
  });
});
