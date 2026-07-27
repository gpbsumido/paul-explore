import { describe, it, expect, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { FlagsApiError } from "@/lib/flags-client";

vi.mock("@/lib/flags-client", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/flags-client")>(
      "@/lib/flags-client",
    );
  return {
    ...actual,
    fetchFlagsFromApi: vi.fn(),
    fetchAuditFromApi: vi.fn(),
    patchFlagOnApi: vi.fn(),
  };
});

vi.mock("@/lib/auth0", () => ({
  auth0: { getSession: vi.fn() },
}));

import {
  fetchFlagsFromApi,
  fetchAuditFromApi,
  patchFlagOnApi,
} from "@/lib/flags-client";
import { auth0 } from "@/lib/auth0";

type Session = Awaited<ReturnType<typeof auth0.getSession>>;
const signedIn = { user: { sub: "auth0|123" } } as Session;

function patchRequest(body: unknown, headers?: Record<string, string>) {
  return new NextRequest("http://localhost:3000/api/flags/new-checkout", {
    method: "PATCH",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

const params = (flagKey: string) => ({ params: Promise.resolve({ flagKey }) });

afterEach(() => vi.clearAllMocks());

describe("GET /api/flags", () => {
  it("falls back to the seeded fleet when the API is down", async () => {
    vi.mocked(fetchFlagsFromApi).mockRejectedValue(new Error("down"));
    const { GET } = await import("@/app/api/flags/route");

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.flags.length).toBeGreaterThan(0);
    expect(body.environments).toContain("production");
  });
});

describe("GET /api/flags/audit", () => {
  it("falls back to the seeded audit when the API is down", async () => {
    vi.mocked(fetchAuditFromApi).mockRejectedValue(new Error("down"));
    const { GET } = await import("@/app/api/flags/audit/route");

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(body.audit)).toBe(true);
  });
});

describe("POST /api/flags/evaluate", () => {
  it("evaluates the seeded fleet when the API is down", async () => {
    vi.mocked(fetchFlagsFromApi).mockRejectedValue(new Error("down"));
    const { POST } = await import("@/app/api/flags/evaluate/route");

    const req = new NextRequest("http://localhost:3000/api/flags/evaluate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        environment: "production",
        context: { key: "user-1", attributes: {} },
      }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.results.length).toBeGreaterThan(0);
  });
});

describe("PATCH /api/flags/:flagKey", () => {
  it("propagates a signed-out 401 from the API with a sign-in message", async () => {
    vi.mocked(patchFlagOnApi).mockRejectedValue(new FlagsApiError(401));
    const { PATCH } = await import("@/app/api/flags/[flagKey]/route");

    const res = await PATCH(
      patchRequest({ environment: "production", enabled: false }),
      params("new-checkout"),
    );
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toMatch(/sign in/i);
  });

  it("forwards the visitor's bearer token to the API", async () => {
    vi.mocked(patchFlagOnApi).mockRejectedValue(new FlagsApiError(404));
    const { PATCH } = await import("@/app/api/flags/[flagKey]/route");

    await PATCH(
      patchRequest(
        { environment: "production", enabled: false },
        { authorization: "Bearer tok-abc" },
      ),
      params("new-checkout"),
    );

    expect(patchFlagOnApi).toHaveBeenCalledWith(
      "new-checkout",
      { environment: "production", enabled: false },
      "tok-abc",
    );
  });

  it("falls back to the seed store when the API is unreachable", async () => {
    vi.mocked(patchFlagOnApi).mockRejectedValue(new Error("ECONNREFUSED"));
    const { PATCH } = await import("@/app/api/flags/[flagKey]/route");

    const res = await PATCH(
      patchRequest({ environment: "production", enabled: false }),
      params("new-checkout"),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.flag.key).toBe("new-checkout");
  });

  it("rejects an invalid body with 400", async () => {
    const { PATCH } = await import("@/app/api/flags/[flagKey]/route");

    const res = await PATCH(patchRequest({}), params("new-checkout"));

    expect(res.status).toBe(400);
  });

  it("blocks changing the real flag when signed out", async () => {
    vi.mocked(auth0.getSession).mockResolvedValue(null);
    const { PATCH } = await import("@/app/api/flags/[flagKey]/route");

    const res = await PATCH(
      patchRequest({ environment: "production", enabled: false }),
      params("pocket-tcg"),
    );
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toMatch(/sign in/i);
    // The real flag is gated before any backend write is attempted.
    expect(patchFlagOnApi).not.toHaveBeenCalled();
  });

  it("lets a signed-in user change the real flag", async () => {
    vi.mocked(auth0.getSession).mockResolvedValue(signedIn);
    vi.mocked(patchFlagOnApi).mockRejectedValue(new Error("ECONNREFUSED"));
    const { PATCH } = await import("@/app/api/flags/[flagKey]/route");

    const res = await PATCH(
      patchRequest({ environment: "production", enabled: false }),
      params("pocket-tcg"),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.flag.key).toBe("pocket-tcg");
  });

  it("lets anyone change a demo flag while signed out, without an auth check", async () => {
    vi.mocked(patchFlagOnApi).mockRejectedValue(new Error("ECONNREFUSED"));
    const { PATCH } = await import("@/app/api/flags/[flagKey]/route");

    const res = await PATCH(
      patchRequest({ environment: "production", enabled: false }),
      params("new-checkout"),
    );

    expect(res.status).toBe(200);
    expect(auth0.getSession).not.toHaveBeenCalled();
  });
});
