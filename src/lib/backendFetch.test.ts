import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { NextResponse, type NextRequest } from "next/server";

vi.mock("@/lib/auth0", () => ({
  auth0: { getAccessToken: vi.fn(), getSession: vi.fn() },
}));

import { AccessTokenError, AccessTokenErrorCode } from "@auth0/nextjs-auth0/errors";
import { auth0 } from "@/lib/auth0";
import { server } from "@/test/server";
import { InvalidSegmentError } from "@/lib/safeSegment";
import {
  API_URL,
  buildHeaders,
  proxyPublicList,
  withAdminBackend,
  withBackend,
} from "./backendFetch";

const getAccessToken = auth0.getAccessToken as unknown as ReturnType<
  typeof vi.fn
>;
const getSession = auth0.getSession as unknown as ReturnType<typeof vi.fn>;
const req = () =>
  new Request("http://localhost/api/x") as unknown as NextRequest;

describe("withBackend", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it("returns 401 when the backend token can't be resolved", async () => {
    getAccessToken.mockRejectedValue(new Error("no session"));
    const route = withBackend("x", async () => NextResponse.json({ ok: true }));
    const res = await route(req(), undefined);
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Not authenticated" });
  });

  it("never runs the handler when there is no token", async () => {
    getAccessToken.mockRejectedValue(new Error("no session"));
    const handler = vi.fn();
    const route = withBackend("x", handler);

    await route(req(), undefined);

    expect(handler).not.toHaveBeenCalled();
  });

  it("turns a thrown backend/network error into a clean 502", async () => {
    getAccessToken.mockResolvedValue({ token: "t" });
    const route = withBackend("x", async () => {
      throw new Error("ECONNREFUSED");
    });
    const res = await route(req(), undefined);
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: "Backend unavailable" });
  });

  it("passes the auth context through and returns the handler's response", async () => {
    getAccessToken.mockResolvedValue({ token: "abc" });
    let seenToken: string | undefined;
    const route = withBackend("x", async ({ token }) => {
      seenToken = token;
      return NextResponse.json({ ok: true }, { status: 201 });
    });
    const res = await route(req(), undefined);
    expect(res.status).toBe(201);
    expect(seenToken).toBe("abc");
  });

  it("hands the handler the request and the route context untouched", async () => {
    getAccessToken.mockResolvedValue({ token: "abc" });
    const request = req();
    const routeCtx = { params: Promise.resolve({ id: "42" }) };
    const handler = vi.fn(async () => NextResponse.json({ ok: true }));
    const route = withBackend("x", handler);

    await route(request, routeCtx);

    expect(handler).toHaveBeenCalledWith(
      { token: "abc", email: null },
      request,
      routeCtx,
    );
  });

  it("answers a rejected path segment with 400, not a 502 that pages someone", async () => {
    getAccessToken.mockResolvedValue({ token: "t" });
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    const route = withBackend("x", async () => {
      throw new InvalidSegmentError("bad id");
    });

    const res = await route(req(), undefined);

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid identifier" });
    expect(logged).not.toHaveBeenCalled();
  });

  it("logs the label and the cause when the handler throws", async () => {
    getAccessToken.mockResolvedValue({ token: "t" });
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    const boom = new Error("ECONNREFUSED");
    const route = withBackend("calendars GET", async () => {
      throw boom;
    });

    await route(req(), undefined);

    expect(logged).toHaveBeenCalledWith("[calendars GET] backend unavailable:", boom);
  });

  it("answers a guest with a 401 without logging an error", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    getAccessToken.mockRejectedValue(
      new AccessTokenError(AccessTokenErrorCode.MISSING_SESSION, "The user does not have an active session."),
    );
    const route = withBackend("x", async () => NextResponse.json({ ok: true }));

    const res = await route(req(), undefined);

    expect(res.status).toBe(401);
    expect(logged).not.toHaveBeenCalled();
  });

  it("still logs a token failure for someone who is signed in", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    getAccessToken.mockRejectedValue(
      new AccessTokenError(AccessTokenErrorCode.FAILED_TO_REFRESH_TOKEN, "refresh failed"),
    );
    const route = withBackend("x", async () => NextResponse.json({ ok: true }));

    const res = await route(req(), undefined);

    expect(res.status).toBe(401);
    expect(logged).toHaveBeenCalledOnce();
  });
});

describe("withAdminBackend", () => {
  const handlerThatReplies = () =>
    vi.fn(async () => NextResponse.json({ ok: true }, { status: 201 }));

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("FLAG_ADMIN_ALLOWED_EMAILS", "me@example.com");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("hands a signed-out caller a 404 and never asks for a token", async () => {
    getSession.mockResolvedValue(null);
    const handler = handlerThatReplies();

    const res = await withAdminBackend("x", handler)(req(), undefined);

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Not found" });
    expect(getAccessToken).not.toHaveBeenCalled();
    expect(handler).not.toHaveBeenCalled();
  });

  it("hands a signed-in non-admin a 404, not a 403 that confirms the route exists", async () => {
    getSession.mockResolvedValue({
      user: { email: "stranger@example.com", email_verified: true },
    });
    const handler = handlerThatReplies();

    const res = await withAdminBackend("x", handler)(req(), undefined);

    expect(res.status).toBe(404);
    expect(handler).not.toHaveBeenCalled();
  });

  it("refuses an allowlisted address the provider has not verified", async () => {
    getSession.mockResolvedValue({
      user: { email: "me@example.com", email_verified: false },
    });
    const handler = handlerThatReplies();

    const res = await withAdminBackend("x", handler)(req(), undefined);

    expect(res.status).toBe(404);
    expect(handler).not.toHaveBeenCalled();
  });

  it("refuses everyone when the allowlist env var is unset", async () => {
    vi.stubEnv("FLAG_ADMIN_ALLOWED_EMAILS", "");
    getSession.mockResolvedValue({
      user: { email: "me@example.com", email_verified: true },
    });

    const res = await withAdminBackend("x", handlerThatReplies())(req(), undefined);

    expect(res.status).toBe(404);
  });

  it("lets a verified admin through with their own token", async () => {
    getSession.mockResolvedValue({
      user: { email: "Me@Example.com", email_verified: true },
    });
    getAccessToken.mockResolvedValue({ token: "admin-token" });
    const handler = handlerThatReplies();

    const res = await withAdminBackend("x", handler)(req(), undefined);

    expect(res.status).toBe(201);
    expect(handler).toHaveBeenCalledWith(
      { token: "admin-token", email: null },
      expect.anything(),
      undefined,
    );
  });

  it("still maps a backend failure to 502 for an admin", async () => {
    getSession.mockResolvedValue({
      user: { email: "me@example.com", email_verified: true },
    });
    getAccessToken.mockResolvedValue({ token: "t" });
    vi.spyOn(console, "error").mockImplementation(() => {});
    const route = withAdminBackend("x", async () => {
      throw new Error("down");
    });

    const res = await route(req(), undefined);

    expect(res.status).toBe(502);
  });
});

describe("proxyPublicList", () => {
  const listPath = "/api/vitals/by-version";
  const listUrl = `${API_URL}${listPath}`;
  const options = { errorLabel: "Failed to fetch version metrics", key: "byVersion" };

  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it("forwards the visitor's token to the upstream path it was given", async () => {
    getAccessToken.mockResolvedValue({ token: "visitor-token" });
    let sentAuthorization: string | null = null;
    server.use(
      http.get(listUrl, ({ request }) => {
        sentAuthorization = request.headers.get("authorization");
        return HttpResponse.json({ byVersion: [{ version: "1.0.0" }] });
      }),
    );

    const res = await proxyPublicList(listPath, options);

    expect(sentAuthorization).toBe("Bearer visitor-token");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ byVersion: [{ version: "1.0.0" }] });
  });

  it("still serves a guest, with no Authorization header", async () => {
    getAccessToken.mockRejectedValue(new Error("no session"));
    let sentAuthorization: string | null = "unset";
    server.use(
      http.get(listUrl, ({ request }) => {
        sentAuthorization = request.headers.get("authorization");
        return HttpResponse.json({ byVersion: [] });
      }),
    );

    const res = await proxyPublicList(listPath, options);

    expect(res.status).toBe(200);
    expect(sentAuthorization).toBeNull();
  });

  it("returns only the requested key and defaults a missing one to an empty list", async () => {
    getAccessToken.mockRejectedValue(new Error("no session"));
    server.use(
      http.get(listUrl, () => HttpResponse.json({ somethingElse: [1] })),
    );

    const res = await proxyPublicList(listPath, options);

    expect(await res.json()).toEqual({ byVersion: [] });
  });

  it("passes an upstream error status through under the route's own label", async () => {
    getAccessToken.mockRejectedValue(new Error("no session"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    server.use(
      http.get(listUrl, () =>
        HttpResponse.json({ error: "internal detail" }, { status: 503 }),
      ),
    );

    const res = await proxyPublicList(listPath, options);

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "Failed to fetch version metrics" });
  });

  it("maps an unreachable backend to 502", async () => {
    getAccessToken.mockRejectedValue(new Error("no session"));
    server.use(http.get(listUrl, () => HttpResponse.error()));

    const res = await proxyPublicList(listPath, options);

    expect(res.status).toBe(502);
    expect(await res.json()).toMatchObject({ cause: "unreachable" });
  });

  it("maps a deadline to 504", async () => {
    getAccessToken.mockRejectedValue(new Error("no session"));
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(
      Object.assign(new Error("too slow"), { name: "TimeoutError" }),
    );

    const res = await proxyPublicList(listPath, options);

    expect(res.status).toBe(504);
  });

  it("maps a malformed body to 502 instead of throwing", async () => {
    getAccessToken.mockRejectedValue(new Error("no session"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    server.use(
      http.get(listUrl, () => new HttpResponse("<html>not json</html>", { status: 200 })),
    );

    const res = await proxyPublicList(listPath, options);

    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: "Backend unavailable" });
  });
});

describe("buildHeaders", () => {
  it("sends the token as a Bearer header and ignores the email", () => {
    expect(buildHeaders("abc", "me@example.com")).toEqual({
      Authorization: "Bearer abc",
    });
  });

  it("lets the caller add headers alongside the Authorization one", () => {
    expect(buildHeaders("abc", null, { "Content-Type": "application/json" })).toEqual({
      Authorization: "Bearer abc",
      "Content-Type": "application/json",
    });
  });
});
