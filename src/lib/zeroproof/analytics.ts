import type { ZeroproofBet } from "./schemas";
import { netProfitCents } from "./trend";

/**
 * Derived analytics for the record panel, on top of the raw bets and the
 * profile stats. Kept pure so the numbers can be unit-tested without a browser;
 * the components just render what these return.
 */

const SETTLED = new Set(["won", "lost", "push", "void"]);

/** Total profit or loss across every settled bet, in cents. */
export function netProfitTotalCents(bets: ZeroproofBet[]): number {
  return bets.reduce((sum, bet) => sum + netProfitCents(bet), 0);
}

/**
 * Win rate over graded bets (wins ÷ (wins + losses)), as a whole percent.
 * Pushes and voids don't count either way. Null when there are no graded bets,
 * so the UI shows a dash rather than NaN.
 */
export function winRatePct(stats: { wins: number; losses: number }): number | null {
  const graded = stats.wins + stats.losses;
  if (graded === 0) return null;
  return Math.round((stats.wins / graded) * 100);
}

/** One entry in the recent-form row: a settled bet's id and outcome. */
export type FormResult = { id: string; status: string };

/** The most recent settled bets, newest first, capped at `n` — the form row. */
export function recentForm(bets: ZeroproofBet[], n: number): FormResult[] {
  return bets
    .filter((bet) => SETTLED.has(bet.status) && bet.settledAt)
    .sort((a, b) => (b.settledAt ?? "").localeCompare(a.settledAt ?? ""))
    .slice(0, n)
    .map((bet) => ({ id: bet.id, status: bet.status }));
}

/**
 * Won bets whose ids aren't in the seen set, with their combined profit — what
 * the celebration keys off. "Seen" is tracked per device, so a win is
 * celebrated once and then stays quiet.
 */
export function unseenWins(
  bets: ZeroproofBet[],
  seen: string[],
): { ids: string[]; count: number; totalCents: number } {
  const seenSet = new Set(seen);
  const fresh = bets.filter((bet) => bet.status === "won" && !seenSet.has(bet.id));
  return {
    ids: fresh.map((bet) => bet.id),
    count: fresh.length,
    totalCents: fresh.reduce((sum, bet) => sum + netProfitCents(bet), 0),
  };
}
