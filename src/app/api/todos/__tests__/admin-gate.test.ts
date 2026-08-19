import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth0", () => ({
  auth0: { getSession: vi.fn(), getAccessToken: vi.fn() },
}));

vi.mock("@/lib/upstream", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/upstream")>("@/lib/upstream");
  return { ...actual, fetchUpstream: vi.fn() };
});

import { auth0 } from "@/lib/auth0";
import { fetchUpstream } from "@/lib/upstream";

type Session = Awaited<ReturnType<typeof auth0.getSession>>;

/** On the allowlist below, provider-verified: the admin. */
const admin = {
  user: { sub: "auth0|1", email: "admin@example.com", email_verified: true },
} as Session;

/** Signed in and verified, but not on the allowlist. */
const nonAdmin = {
  user: { sub: "auth0|2", email: "someone@example.com", email_verified: true },
} as Session;

const req = () => new NextRequest("http://localhost/api/todos");

beforeEach(() => {
  vi.stubEnv("FLAG_ADMIN_ALLOWED_EMAILS", "admin@example.com");
  vi.mocked(auth0.getAccessToken).mockResolvedValue({
    token: "user-token",
    expiresAt: Date.now() / 1000 + 3600,
    scope: "openid",
  } as Awaited<ReturnType<typeof auth0.getAccessToken>>);
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("todos BFF admin gate", () => {
  it("hides the endpoint from a signed-in non-admin (404) and never calls upstream", async () => {
    vi.mocked(auth0.getSession).mockResolvedValue(nonAdmin);
    const { GET } = await import("@/app/api/todos/route");

    const res = await GET(req(), undefined);

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Not found" });
    expect(fetchUpstream).not.toHaveBeenCalled();
  });

  it("blocks a signed-out caller (404) without touching upstream", async () => {
    vi.mocked(auth0.getSession).mockResolvedValue(null);
    const { GET } = await import("@/app/api/todos/route");

    const res = await GET(req(), undefined);

    expect(res.status).toBe(404);
    expect(fetchUpstream).not.toHaveBeenCalled();
  });

  it("blocks an allowlisted address the provider has not verified (404)", async () => {
    vi.mocked(auth0.getSession).mockResolvedValue({
      user: { sub: "auth0|3", email: "admin@example.com", email_verified: false },
    } as Session);
    const { GET } = await import("@/app/api/todos/route");

    const res = await GET(req(), undefined);

    expect(res.status).toBe(404);
    expect(fetchUpstream).not.toHaveBeenCalled();
  });

  it("lets an admin through to the (mocked) upstream and forwards their token", async () => {
    vi.mocked(auth0.getSession).mockResolvedValue(admin);
    vi.mocked(fetchUpstream).mockResolvedValue({
      ok: true,
      response: new Response(JSON.stringify([{ id: "t1" }]), { status: 200 }),
    });
    const { GET } = await import("@/app/api/todos/route");

    const res = await GET(req(), undefined);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ id: "t1" }]);
    expect(fetchUpstream).toHaveBeenCalledTimes(1);
    const [, init] = vi.mocked(fetchUpstream).mock.calls[0];
    expect(
      (init?.headers as Record<string, string>)?.Authorization,
    ).toBe("Bearer user-token");
  });
});
