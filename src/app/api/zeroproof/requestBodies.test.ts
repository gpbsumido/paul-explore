import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/upstream", async () => {
  const actual = await vi.importActual<typeof import("@/lib/upstream")>("@/lib/upstream");
  return { ...actual, fetchUpstream: vi.fn() };
});

vi.mock("@/lib/auth0", () => ({
  auth0: { getAccessToken: vi.fn().mockResolvedValue({ token: "tok" }) },
}));

import { NextRequest } from "next/server";
import { fetchUpstream } from "@/lib/upstream";

const ok = () =>
  ({
    ok: true as const,
    response: new Response("{}", { status: 200, headers: { "content-type": "application/json" } }),
  }) as unknown as Awaited<ReturnType<typeof fetchUpstream>>;

const leagueParams = { params: Promise.resolve({ id: "lg-1" }) };

/**
 * Five zeroproof writes forwarded whatever JSON arrived, so a malformed body
 * cost a backend round trip and a typo'd field went through silently. Each now
 * parses against a copy of the backend's own schema (portfolio_api
 * src/modules/zeroproof/schemas.ts) before anything leaves the BFF.
 */
const ROUTES = [
  {
    name: "place bet",
    call: async (body: unknown) => (await import("./bets/route")).POST(post("/api/zeroproof/bets", body), {}),
    valid: { walletId: "w1", eventId: "e1", market: "h2h", selection: "Raptors", stakeCents: 500 },
    invalid: { walletId: "w1", eventId: "e1", market: "moneyline", selection: "Raptors", stakeCents: 500 },
  },
  {
    name: "open wallet",
    call: async (body: unknown) => (await import("./wallets/route")).POST(post("/api/zeroproof/wallets", body), {}),
    valid: { mode: "season", depositCents: 2000 },
    invalid: { mode: "season", depositCents: 20.5 },
  },
  {
    name: "create league",
    call: async (body: unknown) => (await import("./leagues/route")).POST(post("/api/zeroproof/leagues", body), {}),
    valid: { name: "Friday", visibility: "public", startingBankrollCents: 10000, maxMembers: 8, winCondition: "threshold", thresholdCents: 20000 },
    invalid: { name: "", visibility: "public", startingBankrollCents: 10000, maxMembers: 8, winCondition: "threshold" },
  },
  {
    name: "join league",
    call: async (body: unknown) =>
      (await import("./leagues/[id]/join/route")).POST(post("/api/zeroproof/leagues/lg-1/join", body), leagueParams),
    valid: { joinCode: "ABC234" },
    invalid: { joinCode: "" },
  },
  {
    name: "add a league's ESPN league",
    call: async (body: unknown) =>
      (await import("./leagues/[id]/espn-leagues/route")).POST(post("/api/zeroproof/leagues/lg-1/espn-leagues", body), leagueParams),
    valid: { game: "fba", leagueId: "449389534", season: "2026" },
    invalid: { game: "basketball", leagueId: "449389534", season: "2026" },
  },
];

function post(path: string, body: unknown) {
  return new NextRequest(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

afterEach(() => vi.clearAllMocks());

describe("zeroproof write bodies", () => {
  it.each(ROUTES)("$name: rejects a body the backend would refuse, without calling it", async ({ call, invalid }) => {
    const res = await call(invalid);
    expect(res.status).toBe(400);
    expect(fetchUpstream).not.toHaveBeenCalled();
  });

  it.each(ROUTES)("$name: rejects a body that isn't JSON at all", async ({ call }) => {
    const res = await call("{not json");
    expect(res.status).toBe(400);
    expect(fetchUpstream).not.toHaveBeenCalled();
  });

  it.each(ROUTES)("$name: forwards a valid body, minus fields the backend doesn't take", async ({ call, valid }) => {
    vi.mocked(fetchUpstream).mockResolvedValue(ok());
    await call({ ...valid, isAdmin: true });
    const init = vi.mocked(fetchUpstream).mock.calls[0][1];
    expect(JSON.parse(String(init?.body))).toEqual(valid);
  });
});
