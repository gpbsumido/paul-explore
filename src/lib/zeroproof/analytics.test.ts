import { describe, it, expect } from "vitest";
import type { ZeroproofBet } from "./schemas";
import {
  netProfitTotalCents,
  winRatePct,
  recentForm,
  unseenWins,
} from "./analytics";

const bet = (over: Partial<ZeroproofBet> = {}): ZeroproofBet => ({
  id: "1",
  walletId: "w",
  eventId: "e",
  market: "h2h",
  selection: "Home",
  oddsAmerican: 100,
  lineValue: null,
  closingOddsAmerican: null,
  clv: null,
  stakeCents: 1000,
  status: "open",
  placedAt: "2026-01-01T00:00:00.000Z",
  settledAt: null,
  ...over,
});

describe("netProfitTotalCents", () => {
  it("sums wins and losses, ignoring pushes, voids, and open bets", () => {
    const bets = [
      bet({ id: "a", status: "won", oddsAmerican: 100, stakeCents: 1000 }), // +1000
      bet({ id: "b", status: "lost", stakeCents: 500 }), // -500
      bet({ id: "c", status: "push", stakeCents: 400 }), // 0
      bet({ id: "d", status: "void", stakeCents: 400 }), // 0
      bet({ id: "e", status: "open", stakeCents: 900 }), // 0
    ];
    expect(netProfitTotalCents(bets)).toBe(500);
  });

  it("pays a favourite less than the stake", () => {
    // -200 favourite, $100 stake → profit $50.
    expect(
      netProfitTotalCents([bet({ status: "won", oddsAmerican: -200, stakeCents: 10000 })]),
    ).toBe(5000);
  });
});

describe("winRatePct", () => {
  it("is wins over graded (wins + losses), which excludes pushes", () => {
    expect(winRatePct({ wins: 6, losses: 4 })).toBe(60);
  });

  it("is null with no graded bets, so the UI shows a dash not NaN", () => {
    expect(winRatePct({ wins: 0, losses: 0 })).toBeNull();
  });
});

describe("recentForm", () => {
  it("returns the most recent settled bets, newest first, capped at n", () => {
    const bets = [
      bet({ id: "old", status: "won", settledAt: "2026-01-01T00:00:00.000Z" }),
      bet({ id: "mid", status: "lost", settledAt: "2026-01-02T00:00:00.000Z" }),
      bet({ id: "new", status: "won", settledAt: "2026-01-03T00:00:00.000Z" }),
      bet({ id: "open", status: "open", settledAt: null }),
    ];
    expect(recentForm(bets, 2)).toEqual([
      { id: "new", status: "won" },
      { id: "mid", status: "lost" },
    ]);
  });
});

describe("unseenWins", () => {
  it("finds won bets whose ids aren't in the seen set, with their total profit", () => {
    const bets = [
      bet({ id: "seen", status: "won", oddsAmerican: 100, stakeCents: 1000 }),
      bet({ id: "fresh1", status: "won", oddsAmerican: 100, stakeCents: 2000 }), // +2000
      bet({ id: "fresh2", status: "won", oddsAmerican: -200, stakeCents: 10000 }), // +5000
      bet({ id: "lost", status: "lost", stakeCents: 1000 }),
    ];
    const result = unseenWins(bets, ["seen"]);
    expect(result.ids).toEqual(["fresh1", "fresh2"]);
    expect(result.count).toBe(2);
    expect(result.totalCents).toBe(7000);
  });

  it("is empty when every win has been seen", () => {
    const bets = [bet({ id: "a", status: "won" })];
    expect(unseenWins(bets, ["a"])).toEqual({ ids: [], count: 0, totalCents: 0 });
  });
});
