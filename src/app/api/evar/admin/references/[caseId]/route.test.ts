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
import { PUT, DELETE } from "./route";

type Session = Awaited<ReturnType<typeof auth0.getSession>>;

const session = (email: string) => ({ user: { sub: "auth0|1", email, email_verified: true } }) as Session;

const upstream = (body: unknown, status = 200) =>
  ({
    ok: true as const,
    response: new Response(body === null ? null : JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    }),
  }) as unknown as Awaited<ReturnType<typeof fetchUpstream>>;

const ctx = (caseId: string) => ({ params: Promise.resolve({ caseId }) });
const url = "http://localhost/api/evar/admin/references/long-neck";

beforeEach(() => {
  vi.stubEnv("FLAG_ADMIN_ALLOWED_EMAILS", "admin@example.com");
  vi.mocked(auth0.getSession).mockResolvedValue(session("admin@example.com"));
  vi.mocked(auth0.getAccessToken).mockResolvedValue({ token: "tok" } as never);
});
afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("evar reference admin proxy", () => {
  it("saves a case's reference values for an admin", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue(upstream({ reference: { caseId: "long-neck" } }));
    const body = '{"neckDiameter":24,"neckLength":30,"maxSac":60,"rightCia":13,"leftCia":13}';
    const res = await PUT(new NextRequest(url, { method: "PUT", body }), ctx("long-neck"));
    expect(res.status).toBe(200);
    const [target, init] = vi.mocked(fetchUpstream).mock.calls[0];
    expect(target).toBe(`${API_URL}/api/evar/admin/references/long-neck`);
    expect(init?.method).toBe("PUT");
    expect(init?.body).toBe(body);
  });

  it("resets a case, passing the empty 204 on", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue(upstream(null, 204));
    const res = await DELETE(new NextRequest(url, { method: "DELETE" }), ctx("long-neck"));
    expect(res.status).toBe(204);
    expect(vi.mocked(fetchUpstream).mock.calls[0][1]?.method).toBe("DELETE");
  });

  it("404s a non-admin without calling upstream", async () => {
    vi.mocked(auth0.getSession).mockResolvedValue(session("nope@example.com"));
    const res = await PUT(new NextRequest(url, { method: "PUT", body: "{}" }), ctx("long-neck"));
    expect(res.status).toBe(404);
    expect(fetchUpstream).not.toHaveBeenCalled();
  });

  it("rejects a case id that would change the upstream path", async () => {
    const res = await DELETE(new NextRequest(url, { method: "DELETE" }), ctx("../participant"));
    expect(res.status).toBe(400);
    expect(fetchUpstream).not.toHaveBeenCalled();
  });
});
