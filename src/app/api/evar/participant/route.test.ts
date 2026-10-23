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
import { GET, PUT, DELETE } from "./route";

const upstream = (status: number, body?: unknown) =>
  ({
    ok: true as const,
    response: new Response(body === undefined ? null : JSON.stringify(body), {
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

describe("evar participant proxy", () => {
  it("reads the caller's participant with their token", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue(upstream(200, { participant: null }));
    const res = await GET(new NextRequest("http://localhost/api/evar/participant"), undefined);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ participant: null });
    const [url, init] = vi.mocked(fetchUpstream).mock.calls[0];
    expect(url).toBe(`${API_URL}/api/evar/participant`);
    expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer t");
  });

  it("passes a join through, status and all", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue(upstream(400, { error: "bad" }));
    const res = await PUT(
      new NextRequest("http://localhost/api/evar/participant", {
        method: "PUT",
        body: JSON.stringify({ consentVersion: "v" }),
      }),
      undefined,
    );
    expect(res.status).toBe(400);
    const [, init] = vi.mocked(fetchUpstream).mock.calls[0];
    expect(init?.method).toBe("PUT");
    expect(init?.body).toBe(JSON.stringify({ consentVersion: "v" }));
  });

  it("withdraws with an empty 204", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue(upstream(204));
    const res = await DELETE(new NextRequest("http://localhost/api/evar/participant", { method: "DELETE" }), undefined);
    expect(res.status).toBe(204);
    expect(vi.mocked(fetchUpstream).mock.calls[0][1]?.method).toBe("DELETE");
  });

  it("is 401 for a signed-out caller, without calling upstream", async () => {
    vi.mocked(auth0.getAccessToken).mockRejectedValue(new Error("no session"));
    const res = await GET(new NextRequest("http://localhost/api/evar/participant"), undefined);
    expect(res.status).toBe(401);
    expect(fetchUpstream).not.toHaveBeenCalled();
  });
});
