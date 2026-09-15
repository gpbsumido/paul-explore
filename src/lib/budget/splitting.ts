import type { Split } from "./types";

/** Sum a set of per-person split amounts. */
export const splitsTotal = (splits: Split[]): number =>
  splits.reduce((total, s) => total + s.amountCents, 0);

/**
 * Divide an amount as evenly as possible across people, in integer cents. Cents
 * don't always divide cleanly, so the leftover is handed to the earliest people
 * one at a time — the split always sums back to the original amount.
 */
export function evenSplit(amountCents: number, personIds: string[]): Split[] {
  if (personIds.length === 0) return [];
  const base = Math.floor(amountCents / personIds.length);
  let remainder = amountCents - base * personIds.length;
  return personIds.map((personId) => {
    const extra = remainder > 0 ? 1 : 0;
    remainder -= extra;
    return { personId, amountCents: base + extra };
  });
}
