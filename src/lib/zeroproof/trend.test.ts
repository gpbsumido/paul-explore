import { describe, it, expect } from "vitest";
import { bankrollTrend, netProfitCents } from "./trend";
import type { ZeroproofBet, ZeroproofWallet } from "./schemas";

const bet = (overrides: Partial<ZeroproofBet>): ZeroproofBet =>
  ({
    id: "b",
    walletId: "w-season",
    eventId: "e",
    market: "h2h",
    selection: "x",
    oddsAmerican: 100,
    lineValue: null,
    closingOddsAmerican: null,
    clv: null,
    stakeCents: 1000,
    status: "won",
    placedAt: "2026-09-01T00:00:00.000Z",
    settledAt: "2026-09-02T00:00:00.000Z",
    ...overrides,
  }) as ZeroproofBet;

const wallet = (id: string, mode: string): ZeroproofWallet =>
  ({
    id,
    mode,
    principalCents: 50000,
    balanceCents: 50000,
    lockStart: "2026-09-01T00:00:00.000Z",
    lockEnd: "2026-12-01T00:00:00.000Z",
    status: "active",
    createdAt: "2026-09-01T00:00:00.000Z",
  }) as ZeroproofWallet;

describe("netProfitCents", () => {
  it("pays a win the decimal profit, forfeits a loss, and washes a push", () => {
    expect(netProfitCents(bet({ status: "won", oddsAmerican: 100, stakeCents: 1000 }))).toBe(1000);
    expect(netProfitCents(bet({ status: "won", oddsAmerican: -200, stakeCents: 1000 }))).toBe(500);
    expect(netProfitCents(bet({ status: "lost", stakeCents: 1000 }))).toBe(-1000);
    expect(netProfitCents(bet({ status: "push", stakeCents: 1000 }))).toBe(0);
    expect(netProfitCents(bet({ status: "open", stakeCents: 1000 }))).toBe(0);
  });
});

describe("bankrollTrend", () => {
  it("builds cumulative overall and season curves in dollars, ordered by settle time", () => {
    const wallets = [wallet("w-season", "season"), wallet("w-chal", "challenge")];
    const bets = [
      bet({ id: "b2", walletId: "w-chal", status: "won", oddsAmerican: 100, stakeCents: 2000, settledAt: "2026-09-03T00:00:00.000Z" }),
      bet({ id: "b1", walletId: "w-season", status: "won", oddsAmerican: 100, stakeCents: 1000, settledAt: "2026-09-02T00:00:00.000Z" }),
      bet({ id: "b3", walletId: "w-season", status: "lost", stakeCents: 1000, settledAt: "2026-09-04T00:00:00.000Z" }),
    ];

    const { overall, season } = bankrollTrend(bets, wallets);
    // sorted: b1(+10 season), b2(+20 chal), b3(-10 season)
    expect(overall).toEqual([10, 30, 20]);
    expect(season).toEqual([10, 10, 0]);
  });

  it("ignores open and unsettled bets", () => {
    const wallets = [wallet("w-season", "season")];
    const bets = [
      bet({ id: "o", status: "open", settledAt: null }),
      bet({ id: "w", status: "won", oddsAmerican: 100, stakeCents: 1000 }),
    ];
    expect(bankrollTrend(bets, wallets).overall).toEqual([10]);
  });
});
