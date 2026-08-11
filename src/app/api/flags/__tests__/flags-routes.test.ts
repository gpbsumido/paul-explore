import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
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
  auth0: { getSession: vi.fn(), getAccessToken: vi.fn() },
}));

import {
  fetchFlagsFromApi,
  fetchAuditFromApi,
  patchFlagOnApi,
} from "@/lib/flags-client";
import { auth0 } from "@/lib/auth0";

type Session = Awaited<ReturnType<typeof auth0.getSession>>;

/** An admin: on the allowlist set below, with a provider-verified address. */
const signedIn = {
  user: {
    sub: "auth0|123",
    email: "admin@example.com",
    email_verified: true,
  },
} as Session;

/** Signed in, verified, but not on the allowlist. */
const nonAdmin = {
  user: {
    sub: "auth0|456",
    email: "someone-else@example.com",
    email_verified: true,
  },
} as Session;

function patchRequest(body: unknown, headers?: Record<string, string>) {
  return new NextRequest("http://localhost:3000/api/flags/new-checkout", {
    method: "PATCH",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

const params = (flagKey: string) => ({ params: Promise.resolve({ flagKey }) });

beforeEach(() => {
  vi.stubEnv("FLAG_ADMIN_ALLOWED_EMAILS", "admin@example.com");
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

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
    vi.mocked(auth0.getSession).mockResolvedValue(nonAdmin);
    vi.mocked(auth0.getAccessToken).mockResolvedValue({
      token: "server-token",
      expiresAt: Date.now() / 1000 + 3600,
      scope: "openid profile email",
    });
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

  it("ignores a caller-supplied bearer token on a demo flag", async () => {
    vi.mocked(auth0.getSession).mockResolvedValue(nonAdmin);
    vi.mocked(auth0.getAccessToken).mockResolvedValue({
      token: "server-token",
      expiresAt: Date.now() / 1000 + 3600,
      scope: "openid profile email",
    });
    vi.mocked(patchFlagOnApi).mockRejectedValue(new FlagsApiError(404));
    const { PATCH } = await import("@/app/api/flags/[flagKey]/route");

    await PATCH(
      patchRequest(
        { environment: "production", enabled: false },
        { authorization: "Bearer tok-abc" },
      ),
      params("new-checkout"),
    );

    // The forwarded token comes from the session, never from the header the
    // caller sent -- otherwise the audit trail's actor is whoever they named.
    expect(patchFlagOnApi).toHaveBeenCalledWith(
      "new-checkout",
      { environment: "production", enabled: false },
      "server-token",
    );
  });

  it("falls back to the seed store when the API is unreachable", async () => {
    vi.mocked(auth0.getSession).mockResolvedValue(nonAdmin);
    vi.mocked(auth0.getAccessToken).mockResolvedValue({
      token: "server-token",
      expiresAt: Date.now() / 1000 + 3600,
      scope: "openid profile email",
    });
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
    vi.mocked(auth0.getSession).mockResolvedValue(nonAdmin);
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

  it("lets an admin change the real flag", async () => {
    vi.mocked(auth0.getSession).mockResolvedValue(signedIn);
    vi.mocked(auth0.getAccessToken).mockResolvedValue({
      token: "server-token",
      expiresAt: Date.now() / 1000 + 3600,
      scope: "openid profile email",
    });
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

  it("blocks a signed-in non-admin from changing the real flag", async () => {
    vi.mocked(auth0.getSession).mockResolvedValue(nonAdmin);
    const { PATCH } = await import("@/app/api/flags/[flagKey]/route");

    const res = await PATCH(
      patchRequest({ environment: "production", enabled: false }),
      params("pocket-tcg"),
    );
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toMatch(/site owner/i);
    // Rejected before any write is attempted.
    expect(patchFlagOnApi).not.toHaveBeenCalled();
  });

  it("blocks an admin address the provider has not verified", async () => {
    vi.mocked(auth0.getSession).mockResolvedValue({
      user: {
        sub: "auth0|789",
        email: "admin@example.com",
        email_verified: false,
      },
    } as Session);
    const { PATCH } = await import("@/app/api/flags/[flagKey]/route");

    const res = await PATCH(
      patchRequest({ environment: "production", enabled: false }),
      params("pocket-tcg"),
    );

    expect(res.status).toBe(403);
    expect(patchFlagOnApi).not.toHaveBeenCalled();
  });

  it("sends the server-resolved token, never a caller-supplied Authorization header", async () => {
    vi.mocked(auth0.getSession).mockResolvedValue(signedIn);
    vi.mocked(auth0.getAccessToken).mockResolvedValue({
      token: "server-token",
      expiresAt: Date.now() / 1000 + 3600,
      scope: "openid profile email",
    });
    vi.mocked(patchFlagOnApi).mockRejectedValue(new Error("ECONNREFUSED"));
    const { PATCH } = await import("@/app/api/flags/[flagKey]/route");

    await PATCH(
      patchRequest(
        { environment: "production", enabled: false },
        { authorization: "Bearer forged-token" },
      ),
      params("pocket-tcg"),
    );

    // Whoever the write is attributed to must come from the verified session,
    // not from a header the caller controls.
    expect(patchFlagOnApi).toHaveBeenCalledWith(
      "pocket-tcg",
      expect.anything(),
      "server-token",
    );
  });

  it("locks everyone out of the real flag when no allowlist is configured", async () => {
    vi.stubEnv("FLAG_ADMIN_ALLOWED_EMAILS", "");
    vi.mocked(auth0.getSession).mockResolvedValue(signedIn);
    const { PATCH } = await import("@/app/api/flags/[flagKey]/route");

    const res = await PATCH(
      patchRequest({ environment: "production", enabled: false }),
      params("pocket-tcg"),
    );

    // Misconfiguration fails closed: unset means nobody, not everybody.
    expect(res.status).toBe(403);
    expect(patchFlagOnApi).not.toHaveBeenCalled();
  });

  it("lets any signed-in user change a signed-in-tier demo flag", async () => {
    // The authed tier is the middle rung: an account, nothing more.
    vi.mocked(auth0.getSession).mockResolvedValue(nonAdmin);
    vi.mocked(auth0.getAccessToken).mockResolvedValue({
      token: "server-token",
      expiresAt: Date.now() / 1000 + 3600,
      scope: "openid profile email",
    });
    vi.mocked(patchFlagOnApi).mockRejectedValue(new Error("ECONNREFUSED"));
    const { PATCH } = await import("@/app/api/flags/[flagKey]/route");

    const res = await PATCH(
      patchRequest({ environment: "production", enabled: false }),
      params("new-checkout"),
    );

    expect(res.status).toBe(200);
  });

  it("blocks a signed-in-tier flag from someone signed out", async () => {
    vi.mocked(auth0.getSession).mockResolvedValue(null);
    const { PATCH } = await import("@/app/api/flags/[flagKey]/route");

    const res = await PATCH(
      patchRequest({ environment: "production", enabled: false }),
      params("new-checkout"),
    );
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toMatch(/sign in/i);
    expect(patchFlagOnApi).not.toHaveBeenCalled();
  });

  it("writes an open flag with the service token, so an anonymous change persists", async () => {
    // The API authorizes every write on a token, so without one an anonymous
    // change reaches only the in-memory store and springs back on the next
    // read -- the exact revert this console already got caught by once. The
    // server holds a token of its own for this tier.
    vi.stubEnv("FLAGS_SERVICE_TOKEN", "svc-token");
    vi.mocked(auth0.getSession).mockResolvedValue(null);
    vi.mocked(patchFlagOnApi).mockRejectedValue(new Error("ECONNREFUSED"));
    const { PATCH } = await import("@/app/api/flags/[flagKey]/route");

    const res = await PATCH(
      patchRequest({ environment: "production", enabled: false }),
      params("dark-mode"),
    );

    expect(res.status).toBe(200);
    expect(patchFlagOnApi).toHaveBeenCalledWith(
      "dark-mode",
      { environment: "production", enabled: false },
      "svc-token",
    );
    // Never the visitor's session -- there isn't one.
    expect(auth0.getAccessToken).not.toHaveBeenCalled();
  });

  it("still lets an open flag be changed when no service token is configured", async () => {
    // Local dev and CI have no token. The tier must not break there, so it
    // falls back to the in-memory store rather than failing the write.
    vi.stubEnv("FLAGS_SERVICE_TOKEN", "");
    vi.mocked(auth0.getSession).mockResolvedValue(null);
    const { PATCH } = await import("@/app/api/flags/[flagKey]/route");

    const res = await PATCH(
      patchRequest({ environment: "production", enabled: false }),
      params("dark-mode"),
    );

    expect(res.status).toBe(200);
    expect(patchFlagOnApi).not.toHaveBeenCalled();
  });

  it("never sends the service token for a flag that needs a real identity", async () => {
    // Using it above the open tier would attribute every write to the server
    // and make the allowlist pointless.
    vi.stubEnv("FLAGS_SERVICE_TOKEN", "svc-token");
    vi.mocked(auth0.getSession).mockResolvedValue(signedIn);
    vi.mocked(auth0.getAccessToken).mockResolvedValue({
      token: "user-token",
      expiresAt: Date.now() / 1000 + 3600,
      scope: "openid profile email",
    });
    vi.mocked(patchFlagOnApi).mockRejectedValue(new Error("ECONNREFUSED"));
    const { PATCH } = await import("@/app/api/flags/[flagKey]/route");

    await PATCH(
      patchRequest({ environment: "production", enabled: false }),
      params("pocket-tcg"),
    );

    expect(patchFlagOnApi).toHaveBeenCalledWith(
      "pocket-tcg",
      expect.anything(),
      "user-token",
    );
  });

  it("tells a signed-in non-admin they lack permission rather than sending them to a login", async () => {
    // 401 here would bounce someone who is already signed in to a login screen
    // that cannot help them.
    vi.mocked(auth0.getSession).mockResolvedValue(nonAdmin);
    const { PATCH } = await import("@/app/api/flags/[flagKey]/route");

    const res = await PATCH(
      patchRequest({ environment: "production", enabled: false }),
      params("pocket-tcg"),
    );
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).not.toMatch(/sign in/i);
  });

  it("reads the session before the body, so auth0 never sees a consumed request", async () => {
    // Reversing these throws "Response body object should not be disturbed or
    // locked" and the write 500s, which from the console is indistinguishable
    // from being rejected.
    vi.mocked(auth0.getSession).mockResolvedValue(signedIn);
    vi.mocked(auth0.getAccessToken).mockResolvedValue({
      token: "server-token",
      expiresAt: Date.now() / 1000 + 3600,
      scope: "openid profile email",
    });
    vi.mocked(patchFlagOnApi).mockRejectedValue(new Error("ECONNREFUSED"));
    const { PATCH } = await import("@/app/api/flags/[flagKey]/route");

    const request = patchRequest({ environment: "production", enabled: false });
    vi.mocked(auth0.getSession).mockImplementation(async (req) => {
      // Whatever auth0 is handed, its body must still be readable.
      expect((req as Request).bodyUsed).toBe(false);
      return signedIn;
    });

    const res = await PATCH(request, params("pocket-tcg"));

    expect(res.status).toBe(200);
  });
});
