import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth0", () => ({
  auth0: { getAccessToken: vi.fn() },
}));

vi.mock("@/lib/upstream", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/upstream")>("@/lib/upstream");
  return { ...actual, fetchUpstream: vi.fn() };
});

import { auth0 } from "@/lib/auth0";
import { fetchUpstream } from "@/lib/upstream";
import { GET as walletGET } from "./wallet/route";
import { POST as claimPOST } from "./wallet/claim/route";
import { GET as collectionGET } from "./collection/route";

const request = (method: "GET" | "POST") =>
  new NextRequest("http://localhost/api/card-lab/x", { method });

/** Each proxy: what it calls on the card API, and what it says when that fails. */
const routes = [
  {
    name: "GET wallet",
    call: () => walletGET(request("GET"), undefined),
    backendPath: "/api/tcg/wallet",
    method: "GET",
    failureLabel: "Failed to load wallet",
  },
  {
    name: "POST wallet/claim",
    call: () => claimPOST(request("POST"), undefined),
    backendPath: "/api/tcg/wallet/claim",
    method: "POST",
    failureLabel: "Failed to claim",
  },
  {
    name: "GET collection",
    call: () => collectionGET(request("GET"), undefined),
    backendPath: "/api/tcg/collection",
    method: "GET",
    failureLabel: "Failed to load collection",
  },
] as const;

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.mocked(auth0.getAccessToken).mockResolvedValue({
    token: "user-token",
    expiresAt: 0,
  });
});

afterEach(() => {
  vi.resetAllMocks();
});

describe.each(routes)("card lab $name", (route) => {
  it("asks the card API on the caller's behalf and returns what it says", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue({
      ok: true,
      response: new Response(JSON.stringify({ coins: 250 }), { status: 200 }),
    });

    const res = await route.call();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ coins: 250 });
    const [url, init] = vi.mocked(fetchUpstream).mock.calls[0];
    expect(url).toMatch(new RegExp(`${route.backendPath}$`));
    expect(init?.method ?? "GET").toBe(route.method);
    expect(init?.headers).toMatchObject({ Authorization: "Bearer user-token" });
  });

  it("answers 401 and never calls the card API without a session", async () => {
    vi.mocked(auth0.getAccessToken).mockRejectedValue(new Error("no session"));

    const res = await route.call();

    expect(res.status).toBe(401);
    expect(fetchUpstream).not.toHaveBeenCalled();
  });

  it("passes the card API's failure status through under its own label", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue({
      ok: true,
      response: new Response(JSON.stringify({ error: "x" }), { status: 403 }),
    });

    const res = await route.call();

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: route.failureLabel });
  });

  it("answers 502 with the cause when the card API cannot be reached", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue({
      ok: false,
      cause: "unreachable",
      message: "down",
    });

    const res = await route.call();

    expect(res.status).toBe(502);
    expect(await res.json()).toMatchObject({ cause: "unreachable" });
  });
});

describe("card lab POST wallet/claim", () => {
  it("sends JSON, since the claim has a body-less POST the API still parses", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue({
      ok: true,
      response: new Response("{}", { status: 200 }),
    });

    await claimPOST(request("POST"), undefined);

    expect(vi.mocked(fetchUpstream).mock.calls[0][1]?.headers).toMatchObject({
      "Content-Type": "application/json",
    });
  });
});
