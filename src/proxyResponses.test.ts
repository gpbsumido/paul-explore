import { describe, it, expect, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { proxy } from "./proxy";
import type { SessionData } from "@auth0/nextjs-auth0/types";
import { auth0 } from "@/lib/auth0";
import { SESSION_ABSOLUTE_SECONDS, SESSION_MARKER_COOKIE } from "@/lib/authSession";
import { CONSENT_ACCEPTED, CONSENT_COOKIE } from "@/lib/consent";
import { LOGIN_PROMPT_COOKIE } from "@/lib/loginReturnTo";
import { SESSION_PROTECTED_PREFIXES } from "@/lib/protectedPaths";
import { VISITOR_COOKIE } from "@/lib/visitor";
import { forgiveUnexpectedOutput } from "@/test/unexpectedOutput";

vi.mock("@/lib/auth0", () => ({
  auth0: { getSession: vi.fn(), middleware: vi.fn() },
}));

const getSession = vi.mocked(auth0.getSession);
const middleware = vi.mocked(auth0.middleware);

const session: SessionData = {
  user: { sub: "auth0|paul", name: "Paul", email: "paul@example.com" },
  tokenSet: { accessToken: "access-token", expiresAt: 1_900_000_000 },
  internal: { sid: "session-id", createdAt: 1_800_000_000 },
};

/**
 * Sets up the mocked Auth0 SDK for one test: who is signed in, and whether its
 * middleware lets the request through or throws.
 */
function stubAuth0({ signedIn, middlewareError }: { signedIn: SessionData | null; middlewareError?: Error }) {
  getSession.mockReset();
  getSession.mockResolvedValue(signedIn);
  middleware.mockReset();
  middleware.mockImplementation(async () => {
    if (middlewareError) throw middlewareError;
    return NextResponse.next();
  });
}

function request(path: string, cookies: Record<string, string> = {}) {
  const req = new NextRequest(new URL(path, "https://paulsumido.com"));
  Object.entries(cookies).forEach(([name, value]) => req.cookies.set(name, value));
  return req;
}

const PROTECTED = SESSION_PROTECTED_PREFIXES[0];

/**
 * Every page the proxy lets through carries the CSP, and every signed-in one
 * rolls the session marker. The proxy has seven ways out, and each one used to
 * set the header by hand, so these pin all of them in one place.
 */
describe("proxy: what every pass-through carries", () => {
  it.each([
    ["a returning visitor", "/thoughts", { [VISITOR_COOKIE]: "v-1" }],
    ["a visitor who hasn't accepted cookies", "/thoughts", {}],
    ["a visitor who just accepted cookies", "/thoughts", { [CONSENT_COOKIE]: CONSENT_ACCEPTED }],
    ["the landing page, signed out", "/", {}],
  ])("sets the CSP for %s", async (_label, path, cookies) => {
    stubAuth0({ signedIn: null });

    const res = await proxy(request(path, cookies));

    expect(res.headers.get("Content-Security-Policy")).toContain("default-src");
    expect(res.cookies.get(SESSION_MARKER_COOKIE)).toBeUndefined();
  });

  it.each([
    ["the landing page", "/"],
    ["a protected feature", PROTECTED],
    ["any other page", "/thoughts"],
  ])("sets the CSP and rolls the session on %s when signed in", async (_label, path) => {
    stubAuth0({ signedIn: session });

    const res = await proxy(request(path));

    expect(middleware).toHaveBeenCalledOnce();
    expect(res.headers.get("Content-Security-Policy")).toContain("default-src");
    expect(res.cookies.get(SESSION_MARKER_COOKIE)).toMatchObject({
      value: "1",
      path: "/",
      maxAge: SESSION_ABSOLUTE_SECONDS,
      httpOnly: true,
      sameSite: "lax",
      secure: true,
    });
  });

  it("still sets the CSP when the auth SDK throws", async () => {
    stubAuth0({ signedIn: null, middlewareError: new Error("missing AUTH0_DOMAIN") });

    const res = await proxy(request("/auth/profile"));

    expect(res.headers.get("Content-Security-Policy")).toContain("default-src");
    expect(forgiveUnexpectedOutput()).toEqual([
      "[proxy] auth0.middleware() failed on /auth/profile Error: missing AUTH0_DOMAIN",
    ]);
  });

  it("arms a fresh login prompt and clears the marker when a session times out", async () => {
    stubAuth0({ signedIn: null });

    const res = await proxy(request(PROTECTED, { [SESSION_MARKER_COOKIE]: "1" }));

    expect(res.headers.get("location")).toBe("https://paulsumido.com/?authError=timeout");
    expect(res.cookies.get(LOGIN_PROMPT_COOKIE)).toMatchObject({
      value: "login",
      path: "/",
      maxAge: 600,
      httpOnly: true,
      sameSite: "lax",
      secure: true,
    });
    expect(res.cookies.get(SESSION_MARKER_COOKIE)).toMatchObject({ value: "", expires: new Date(0) });
  });
});
