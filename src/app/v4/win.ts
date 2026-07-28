import type { SlotCategory, SlotOption } from "./slotData";

/**
 * Whether a settled pull is a "win" worth celebrating.
 *
 * The payoff of the machine is landing on something you can actually open, so
 * only the Apps column counts -- a write-up-only row or a disabled option is a
 * legitimate landing but not a jackpot. Reduced-motion callers never celebrate:
 * the flourish is decoration, and the outcome is already on screen without it.
 */
export function isWinningPull({
  category,
  option,
  reduced,
}: {
  category: SlotCategory | undefined;
  option: SlotOption | undefined;
  reduced: boolean;
}): boolean {
  if (reduced) return false;
  if (category?.id !== "apps") return false;
  return Boolean(option && !option.disabled);
}
