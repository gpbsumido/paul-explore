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

describe("GET /api/zeroproof/admin/bets", () => {
  it("returns every user's bets for an admin", async () => {
    asAdmin();
    vi.mocked(fetchUpstream).mockResolvedValue(upstream({ bets: [{ id: "b1" }] }));
    const { GET } = await import("./route");
    const res = await GET(new NextRequest("http://localhost/api/zeroproof/admin/bets"), {});
    expect(res.status).toBe(200);
    expect((await res.json()).bets).toHaveLength(1);
  });

  it("forwards the ?q= search term to the backend", async () => {
    asAdmin();
    vi.mocked(fetchUpstream).mockResolvedValue(upstream({ bets: [] }));
    const { GET } = await import("./route");
    await GET(new NextRequest("http://localhost/api/zeroproof/admin/bets?q=greg"), {});
    expect(vi.mocked(fetchUpstream).mock.calls[0][0]).toContain("q=greg");
  });

  it("404s a non-admin (reads as absent)", async () => {
    vi.mocked(auth0.getSession).mockResolvedValue(nonAdmin);
    const { GET } = await import("./route");
    const res = await GET(new NextRequest("http://localhost/api/zeroproof/admin/bets"), {});
    expect(res.status).toBe(404);
  });
});
