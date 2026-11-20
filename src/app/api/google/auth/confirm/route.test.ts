import { describe, it, expect, vi, afterEach } from "vitest";

vi.mock("@/lib/upstream", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/upstream")>("@/lib/upstream");
  return { ...actual, fetchUpstream: vi.fn() };
});

vi.mock("@/lib/auth0", () => ({
  auth0: { getAccessToken: vi.fn().mockResolvedValue({ token: "access-token" }) },
}));

import { NextRequest } from "next/server";
import { fetchUpstream } from "@/lib/upstream";

const upstream = (status: number, body: unknown) =>
  ({
    ok: true as const,
    response: new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    }),
  }) as unknown as Awaited<ReturnType<typeof fetchUpstream>>;

const confirm = (body: unknown) =>
  new NextRequest("http://localhost:3000/api/google/auth/confirm", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

afterEach(() => vi.clearAllMocks());

describe("POST /api/google/auth/confirm", () => {
  it("forwards the code and state to the API as the signed-in user", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue(upstream(200, { connected: true }));
    const { POST } = await import("./route");

    const res = await POST(confirm({ code: "the-code", state: "the-state" }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ connected: true });
    const [url, init] = vi.mocked(fetchUpstream).mock.calls[0];
    expect(url).toMatch(/\/api\/google\/auth\/confirm$/);
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual({ code: "the-code", state: "the-state" });
    expect(new Headers(init?.headers).get("authorization")).toBe("Bearer access-token");
  });

  it("refuses a body without a code before calling the API", async () => {
    const { POST } = await import("./route");

    const res = await POST(confirm({ state: "the-state" }));

    expect(res.status).toBe(400);
    expect(fetchUpstream).not.toHaveBeenCalled();
  });

  it("passes the API's refusal through, so the page can explain it", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue(
      upstream(403, { error: "This Google connection was started by a different account" }),
    );
    const { POST } = await import("./route");

    const res = await POST(confirm({ code: "the-code", state: "someone-elses" }));

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({
      error: "This Google connection was started by a different account",
    });
  });
});
