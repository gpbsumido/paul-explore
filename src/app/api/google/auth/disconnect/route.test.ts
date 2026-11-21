import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth0", () => ({
  auth0: { getAccessToken: vi.fn() },
}));

import { auth0 } from "@/lib/auth0";
import { server } from "@/test/server";
import { API_URL } from "@/lib/apiUrl";
import { DELETE } from "./route";

const DISCONNECT_URL = `${API_URL}/api/google/auth/disconnect`;
const request = () => new NextRequest("http://localhost/api/google/auth/disconnect", { method: "DELETE" });

beforeEach(() => {
  vi.mocked(auth0.getAccessToken).mockResolvedValue({
    token: "visitor-token",
    expiresAt: Date.now() / 1000 + 3600,
    scope: "openid",
  } as Awaited<ReturnType<typeof auth0.getAccessToken>>);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("DELETE /api/google/auth/disconnect", () => {
  it("sends a DELETE with the visitor's token and answers 204 with no body", async () => {
    const seen: { method: string; authorization: string | null }[] = [];
    server.use(
      http.delete(DISCONNECT_URL, ({ request: upstreamRequest }) => {
        seen.push({
          method: upstreamRequest.method,
          authorization: upstreamRequest.headers.get("authorization"),
        });
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const res = await DELETE(request(), undefined);

    expect(res.status).toBe(204);
    expect(await res.text()).toBe("");
    expect(seen).toEqual([{ method: "DELETE", authorization: "Bearer visitor-token" }]);
  });

  it("answers 401 without touching the backend when nobody is signed in", async () => {
    vi.mocked(auth0.getAccessToken).mockRejectedValue(new Error("no session"));
    let called = false;
    server.use(
      http.delete(DISCONNECT_URL, () => {
        called = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const res = await DELETE(request(), undefined);

    expect(res.status).toBe(401);
    expect(called).toBe(false);
  });

  it("keeps the backend's status but replaces its body with a fixed message", async () => {
    server.use(
      http.delete(DISCONNECT_URL, () =>
        HttpResponse.json({ error: "token store down: host db-3" }, { status: 503 }),
      ),
    );

    const res = await DELETE(request(), undefined);

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "Failed to disconnect" });
  });

  it("answers 502 when the backend cannot be reached", async () => {
    server.use(http.delete(DISCONNECT_URL, () => HttpResponse.error()));

    const res = await DELETE(request(), undefined);

    expect(res.status).toBe(502);
    expect(await res.json()).toMatchObject({ error: "Backend unavailable", cause: "unreachable" });
  });
});
