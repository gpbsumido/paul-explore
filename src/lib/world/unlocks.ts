import { COLLECTIBLES } from "./collectibles";

// The hidden reward: sweep every token you can reach on foot and the mystery
// costume in the outfit picker turns out to be a very tall man who can pluck
// the remaining three out of the air without leaving the ground.

export const LOCKED_OUTFIT_ID = "spurs-wemby";

/** Extra reach, in world units, the tall outfit adds while standing. */
export const WEMBY_REACH = 1.4;

export const GROUND_TOKEN_IDS: readonly string[] = COLLECTIBLES.filter(
  (token) => !token.elevated,
).map((token) => token.id);

export const SKY_TOKEN_IDS: readonly string[] = COLLECTIBLES.filter(
  (token) => token.elevated,
).map((token) => token.id);

/**
 * Whether the mystery outfit has been earned: every token reachable on foot,
 * and pointedly none of the ones that need the height it grants.
 */
export function isWembyUnlocked(collected: readonly string[]): boolean {
  return GROUND_TOKEN_IDS.every((id) => collected.includes(id));
}

/** How far above the ground this outfit can grab from. */
export function reachHeight(outfitId: string): number {
  return outfitId === LOCKED_OUTFIT_ID ? WEMBY_REACH : 0;
}
