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
    // 0.001 dollars rounds to 0 cents.
    explained: [{ walletId: "w1", eventId: "e1", market: "h2h", selection: "Raptors", stakeCents: 0 }, "Stake must be more than 0"],
  },
  {
    name: "open wallet",
    call: async (body: unknown) => (await import("./wallets/route")).POST(post("/api/zeroproof/wallets", body), {}),
    valid: { mode: "season", depositCents: 2000 },
    invalid: { mode: "season", depositCents: 20.5 },
    explained: [{ mode: "season", depositCents: 20.5 }, "Deposit must be a whole number"],
  },
  {
    name: "create league",
    call: async (body: unknown) => (await import("./leagues/route")).POST(post("/api/zeroproof/leagues", body), {}),
    valid: { name: "Friday", visibility: "public", startingBankrollCents: 10000, maxMembers: 8, winCondition: "threshold", thresholdCents: 20000 },
    invalid: { name: "", visibility: "public", startingBankrollCents: 10000, maxMembers: 8, winCondition: "threshold" },
    // A cleared Max members input is sent as null.
    explained: [{ name: "Friday", visibility: "public", startingBankrollCents: 10000, maxMembers: null, winCondition: "threshold" }, "Max members must be a number"],
  },
  {
    name: "join league",
    call: async (body: unknown) =>
      (await import("./leagues/[id]/join/route")).POST(post("/api/zeroproof/leagues/lg-1/join", body), leagueParams),
    valid: { joinCode: "ABC234" },
    invalid: { joinCode: "" },
    explained: [{ joinCode: "" }, "Join code can't be empty"],
  },
  {
    name: "add a league's ESPN league",
    call: async (body: unknown) =>
      (await import("./leagues/[id]/espn-leagues/route")).POST(post("/api/zeroproof/leagues/lg-1/espn-leagues", body), leagueParams),
    valid: { game: "fba", leagueId: "449389534", season: "2026" },
    invalid: { game: "basketball", leagueId: "449389534", season: "2026" },
    explained: [{ game: "fba", leagueId: "449389534", season: "26" }, "Season isn't in the right format"],
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

  // These forms show the route's { error } on screen, so it has to name the
  // field in words a person can act on. It can't be the helper's own "Invalid
  // request body" label either: responseError swaps that for a generic fallback.
  it.each(ROUTES)("$name: says which field was wrong, in a sentence", async ({ call, explained: [body, sentence] }) => {
    const res = await call(body);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe(sentence);
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
