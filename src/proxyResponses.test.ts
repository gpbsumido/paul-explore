import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { proxy } from "./proxy";
import { auth0 } from "@/lib/auth0";
import { SESSION_MARKER_COOKIE } from "@/lib/authSession";
import { CONSENT_ACCEPTED, CONSENT_COOKIE } from "@/lib/consent";
import { LOGIN_PROMPT_COOKIE } from "@/lib/loginReturnTo";
import { SESSION_PROTECTED_PREFIXES } from "@/lib/protectedPaths";
import { VISITOR_COOKIE } from "@/lib/visitor";

vi.mock("@/lib/auth0", () => ({
  auth0: { getSession: vi.fn(), middleware: vi.fn() },
}));

const getSession = vi.mocked(auth0.getSession);
const middleware = vi.mocked(auth0.middleware);

const session = { user: { name: "Paul", email: "paul@example.com" } } as unknown as Awaited<
  ReturnType<typeof auth0.getSession>
>;

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
  beforeEach(() => {
    getSession.mockReset();
    getSession.mockResolvedValue(null);
    middleware.mockReset();
    middleware.mockImplementation(async () => NextResponse.next());
  });

  it.each([
    ["a returning visitor", "/thoughts", { [VISITOR_COOKIE]: "v-1" }],
    ["a visitor who hasn't accepted cookies", "/thoughts", {}],
    ["a visitor who just accepted cookies", "/thoughts", { [CONSENT_COOKIE]: CONSENT_ACCEPTED }],
    ["the landing page, signed out", "/", {}],
  ])("sets the CSP for %s", async (_label, path, cookies) => {
    const res = await proxy(request(path, cookies));

    expect(res.headers.get("Content-Security-Policy")).toContain("default-src");
    expect(res.cookies.get(SESSION_MARKER_COOKIE)).toBeUndefined();
  });

  it.each([
    ["the landing page", "/"],
    ["a protected feature", PROTECTED],
    ["any other page", "/thoughts"],
  ])("sets the CSP and rolls the session on %s when signed in", async (_label, path) => {
    getSession.mockResolvedValue(session);

    const res = await proxy(request(path));

    expect(middleware).toHaveBeenCalledOnce();
    expect(res.headers.get("Content-Security-Policy")).toContain("default-src");
    expect(res.cookies.get(SESSION_MARKER_COOKIE)?.value).toBe("1");
  });

  it("still sets the CSP when the auth SDK throws", async () => {
    middleware.mockRejectedValue(new Error("missing AUTH0_DOMAIN"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await proxy(request("/auth/profile"));

    expect(res.headers.get("Content-Security-Policy")).toContain("default-src");
  });

  it("arms a fresh login prompt when a session times out", async () => {
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
  });
});
