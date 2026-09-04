import type { ZeroproofBet, ZeroproofWallet } from "./schemas";

/**
 * The profit (or loss) a single settled bet moved the bankroll by, in cents.
 * A win pays stake × (decimal odds − 1); a loss forfeits the stake; a push or
 * void is a wash. Open bets contribute nothing.
 */
export function netProfitCents(bet: ZeroproofBet): number {
  if (bet.status === "won") {
    const profitMultiple =
      bet.oddsAmerican > 0
        ? bet.oddsAmerican / 100
        : 100 / Math.abs(bet.oddsAmerican);
    return Math.round(bet.stakeCents * profitMultiple);
  }
  if (bet.status === "lost") return -bet.stakeCents;
  return 0;
}

const SETTLED = new Set(["won", "lost", "push", "void"]);

/**
 * Cumulative profit-and-loss curves in dollars, over the caller's settled bets
 * ordered by when they settled: one for everything ("overall") and one for just
 * the Season wallets. Both share the same x (a point per settled bet), so the
 * two lines are comparable on one chart.
 */
export function bankrollTrend(
  bets: ZeroproofBet[],
  wallets: ZeroproofWallet[],
): { overall: number[]; season: number[] } {
  const seasonWalletIds = new Set(
    wallets.filter((w) => w.mode === "season").map((w) => w.id),
  );
  const settled = bets
    .filter((bet) => SETTLED.has(bet.status) && bet.settledAt)
    .sort((a, b) => (a.settledAt ?? "").localeCompare(b.settledAt ?? ""));

  let overallCents = 0;
  let seasonCents = 0;
  const overall: number[] = [];
  const season: number[] = [];
  for (const bet of settled) {
    const net = netProfitCents(bet);
    overallCents += net;
    if (seasonWalletIds.has(bet.walletId)) seasonCents += net;
    overall.push(Math.round(overallCents) / 100);
    season.push(Math.round(seasonCents) / 100);
  }
  return { overall, season };
}
