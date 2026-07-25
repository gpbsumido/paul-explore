import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse, type NextRequest } from "next/server";

vi.mock("@/lib/auth0", () => ({
  auth0: { getAccessToken: vi.fn() },
}));

import { auth0 } from "@/lib/auth0";
import { withBackend } from "./backendFetch";

const getAccessToken = auth0.getAccessToken as unknown as ReturnType<
  typeof vi.fn
>;
const req = () =>
  new Request("http://localhost/api/x") as unknown as NextRequest;

describe("withBackend", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when the backend token can't be resolved", async () => {
    getAccessToken.mockRejectedValue(new Error("no session"));
    const route = withBackend("x", async () => NextResponse.json({ ok: true }));
    const res = await route(req(), undefined);
    expect(res.status).toBe(401);
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
});
