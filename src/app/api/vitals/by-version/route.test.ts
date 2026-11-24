import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { http, HttpResponse } from "msw";

vi.mock("@/lib/auth0", () => ({
  auth0: { getAccessToken: vi.fn() },
}));

import { auth0 } from "@/lib/auth0";
import { server } from "@/test/server";
import { API_URL } from "@/lib/apiUrl";
import { GET } from "./route";

const BY_VERSION_URL = `${API_URL}/api/vitals/by-version`;

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("GET /api/vitals/by-version", () => {
  it("serves a signed-out visitor from the by-version path with no Authorization header", async () => {
    vi.mocked(auth0.getAccessToken).mockRejectedValue(new Error("no session"));
    const byVersion = [{ version: "9.2.15", metrics: { LCP: { p75: 1800, total: 40 } } }];
    let authorization: string | null = "unset";
    server.use(
      http.get(BY_VERSION_URL, ({ request }) => {
        authorization = request.headers.get("authorization");
        return HttpResponse.json({ byVersion });
      }),
    );

    const res = await GET();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ byVersion });
    expect(authorization).toBeNull();
  });

  it("forwards a signed-in visitor's token", async () => {
    vi.mocked(auth0.getAccessToken).mockResolvedValue({
      token: "visitor-token",
      expiresAt: Date.now() / 1000 + 3600,
      scope: "openid",
    } as Awaited<ReturnType<typeof auth0.getAccessToken>>);
    let authorization: string | null = null;
    server.use(
      http.get(BY_VERSION_URL, ({ request }) => {
        authorization = request.headers.get("authorization");
        return HttpResponse.json({ byVersion: [] });
      }),
    );

    await GET();

    expect(authorization).toBe("Bearer visitor-token");
  });

  it("returns only the byVersion list, defaulting to empty when the backend omits it", async () => {
    vi.mocked(auth0.getAccessToken).mockRejectedValue(new Error("no session"));
    server.use(http.get(BY_VERSION_URL, () => HttpResponse.json({ unrelated: true })));

    const res = await GET();

    expect(await res.json()).toEqual({ byVersion: [] });
  });

  it("keeps the backend's status under this route's own error label", async () => {
    vi.mocked(auth0.getAccessToken).mockRejectedValue(new Error("no session"));
    server.use(http.get(BY_VERSION_URL, () => HttpResponse.json({ error: "x" }, { status: 500 })));

    const res = await GET();

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Failed to fetch version metrics" });
  });

  it("answers 502 when the backend cannot be reached", async () => {
    vi.mocked(auth0.getAccessToken).mockRejectedValue(new Error("no session"));
    server.use(http.get(BY_VERSION_URL, () => HttpResponse.error()));

    const res = await GET();

    expect(res.status).toBe(502);
  });
});
