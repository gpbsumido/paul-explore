import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";
import { auth0 } from "@/lib/auth0";
import { SESSION_MARKER_COOKIE } from "@/lib/authSession";

vi.mock("@/lib/auth0", () => ({
  auth0: { getSession: vi.fn(), middleware: vi.fn() },
}));

const getSession = vi.mocked(auth0.getSession);
const middleware = vi.mocked(auth0.middleware);

const request = (url: string) =>
  new NextRequest(new URL(url, "https://paulsumido.com"));

const session = { user: { name: "Paul", email: "paul@example.com" } };

describe("proxy: the landing history lives at /discover", () => {
  beforeEach(async () => {
    getSession.mockReset();
    getSession.mockResolvedValue(null);
    middleware.mockReset();
    const { NextResponse } = await import("next/server");
    middleware.mockImplementation(async () => NextResponse.next());
  });

  it("sends an old ?version= bookmark on to /discover", async () => {
    const res = await proxy(request("/?version=v2"));

    expect(res.status).toBe(308);
    expect(res.headers.get("location")).toBe(
      "https://paulsumido.com/discover?version=v2",
    );
  });

  it("leaves the landing page alone when no version is asked for", async () => {
    const res = await proxy(request("/"));

    expect(res.headers.get("location")).toBeNull();
  });

  it("redirects before it does any session work", async () => {
    // A bookmark should not depend on being signed in to still resolve.
    getSession.mockResolvedValue(
      session as unknown as Awaited<ReturnType<typeof auth0.getSession>>,
    );

    const res = await proxy(request("/?version=v1"));

    expect(res.headers.get("location")).toBe(
      "https://paulsumido.com/discover?version=v1",
    );
  });

  it("keeps a signed-in visitor's session rolling on /discover", async () => {
    getSession.mockResolvedValue(
      session as unknown as Awaited<ReturnType<typeof auth0.getSession>>,
    );

    const res = await proxy(request("/discover"));

    expect(res.cookies.get(SESSION_MARKER_COOKIE)?.value).toBe("1");
    expect(res.headers.get("Content-Security-Policy")).toContain("default-src");
  });

  it("bounces a timed-out visitor off /discover so the toast can show", async () => {
    const req = request("/discover");
    req.cookies.set(SESSION_MARKER_COOKIE, "1");

    const res = await proxy(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(
      "https://paulsumido.com/?authError=timeout",
    );
  });
});
