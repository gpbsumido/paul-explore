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
import { API_URL } from "@/lib/backendFetch";
import { GET } from "./route";

type Session = Awaited<ReturnType<typeof auth0.getSession>>;

const session = (email: string) => ({ user: { sub: "auth0|1", email, email_verified: true } }) as Session;

const upstream = (body: unknown, status = 200) =>
  ({
    ok: true as const,
    response: new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } }),
  }) as unknown as Awaited<ReturnType<typeof fetchUpstream>>;

const request = () => new NextRequest("http://localhost/api/evar/admin/export");

beforeEach(() => {
  vi.stubEnv("FLAG_ADMIN_ALLOWED_EMAILS", "admin@example.com");
  vi.mocked(auth0.getSession).mockResolvedValue(session("admin@example.com"));
  vi.mocked(auth0.getAccessToken).mockResolvedValue({ token: "tok" } as never);
});
afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("evar study export proxy", () => {
  it("forwards an admin's request with their token, uncached", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue(upstream({ participants: [], attempts: [] }));
    const res = await GET(request(), undefined);
    expect(await res.json()).toEqual({ participants: [], attempts: [] });
    const [url, init] = vi.mocked(fetchUpstream).mock.calls[0];
    expect(url).toBe(`${API_URL}/api/evar/admin/export`);
    expect(new Headers(init?.headers).get("authorization")).toBe("Bearer tok");
    expect(init?.cache).toBe("no-store");
  });

  it("404s a non-admin without calling upstream", async () => {
    vi.mocked(auth0.getSession).mockResolvedValue(session("nope@example.com"));
    const res = await GET(request(), undefined);
    expect(res.status).toBe(404);
    expect(fetchUpstream).not.toHaveBeenCalled();
  });

  it("keeps the upstream status", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue(upstream({ error: "Forbidden" }, 403));
    const res = await GET(request(), undefined);
    expect(res.status).toBe(403);
  });
});
