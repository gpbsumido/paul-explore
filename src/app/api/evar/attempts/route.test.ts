import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth0", () => ({
  auth0: { getAccessToken: vi.fn() },
}));

vi.mock("@/lib/upstream", async () => {
  const actual = await vi.importActual<typeof import("@/lib/upstream")>("@/lib/upstream");
  return { ...actual, fetchUpstream: vi.fn() };
});

import { auth0 } from "@/lib/auth0";
import { fetchUpstream } from "@/lib/upstream";
import { API_URL } from "@/lib/backendFetch";
import { GET, POST } from "./route";

const upstream = (status: number, body: unknown) =>
  ({
    ok: true as const,
    response: new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    }),
  }) as unknown as Awaited<ReturnType<typeof fetchUpstream>>;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(auth0.getAccessToken).mockResolvedValue({
    token: "t",
    expiresAt: Date.now() / 1000 + 3600,
    scope: "openid",
  } as Awaited<ReturnType<typeof auth0.getAccessToken>>);
});

describe("evar attempts proxy", () => {
  it("lists the caller's attempts", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue(upstream(200, { attempts: [] }));
    const res = await GET(new NextRequest("http://localhost/api/evar/attempts"), undefined);
    expect(await res.json()).toEqual({ attempts: [] });
    expect(vi.mocked(fetchUpstream).mock.calls[0][0]).toBe(`${API_URL}/api/evar/attempts`);
  });

  it("records one, keeping the upstream status so a resend reads as 200", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue(upstream(200, { attempt: { id: "a" } }));
    const res = await POST(
      new NextRequest("http://localhost/api/evar/attempts", { method: "POST", body: '{"caseId":"x"}' }),
      undefined,
    );
    expect(res.status).toBe(200);
    const [, init] = vi.mocked(fetchUpstream).mock.calls[0];
    expect(init?.method).toBe("POST");
    expect(init?.body).toBe('{"caseId":"x"}');
  });

  it("passes the no-consent 403 straight through", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue(upstream(403, { error: "Join the study first" }));
    const res = await POST(
      new NextRequest("http://localhost/api/evar/attempts", { method: "POST", body: "{}" }),
      undefined,
    );
    expect(res.status).toBe(403);
  });
});
