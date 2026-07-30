/**
 * The confetti and streamer geometry for the win flourish.
 *
 * Aiming at real party confetti: foil rectangles in a bright palette, each
 * tumbling on its own axis at its own speed, drifting sideways as it falls.
 *
 * The fall *style* is chosen per win, not per piece, so one burst reads as one
 * gust of air rather than four unrelated behaviours in the same room. Pieces
 * still differ from each other inside a burst -- size, drift, spin, timing.
 *
 * Deliberately deterministic: positions come from a hash of the piece index,
 * not `Math.random()`. Random values during render disagree between the server
 * and the first client pass, and a burst of confetti is exactly the sort of
 * thing that would hydrate wrong and warn in the console. Same index, same
 * piece, every time -- and it still looks scattered.
 */

/** A stable 0..1 value for a string, so pieces scatter without randomness. */
function hash01(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 1024) / 1024;
}

export type ConfettiPiece = {
  id: string;
  /** Horizontal position across the machine, as a percentage. */
  left: number;
  /** Stagger, in ms, so the burst arrives as a shower not a wall. */
  delay: number;
  /** How long this piece takes to fall, in ms. */
  duration: number;
  /** Width in px -- party confetti is a narrow foil rectangle. */
  width: number;
  /** Height in px, always taller than wide so it tumbles like real paper. */
  height: number;
  /** Total spin over the fall, in degrees. */
  spin: number;
  /** Sideways drift, in px, so they don't fall like rain. */
  drift: number;
  /** Tumble on the Y axis, so pieces flip edge-on mid-fall. */
  flip: number;
  color: string;
};

/** How many pieces fall on a roomy screen -- a proper faceful of confetti. */
const DESKTOP_CONFETTI_COUNT = 110;
/** Far fewer on a phone: each piece is its own tumbling GPU layer, and even 45
    of them still stuttered on a real phone (emulators borrow the laptop's GPU
    and hide it). Enough left to still read as a party, few enough that the
    compositor keeps up. */
const MOBILE_CONFETTI_COUNT = 26;

/** How many confetti pieces to drop, thinned on phones where the layers cost. */
export const confettiCount = (isMobile: boolean): number =>
  isMobile ? MOBILE_CONFETTI_COUNT : DESKTOP_CONFETTI_COUNT;

/** Pick from a palette by hash, so colour is scattered but stable. */
const pick = (colors: readonly string[], seed: number): string =>
  colors[Math.floor(seed * colors.length) % colors.length];

/**
 * A burst of hard-edged confetti squares. `colors` should be the landed
 * option's colour plus the category accent, so the celebration is in the same
 * palette as the thing you just won.
 */
export function confettiPieces(
  count: number,
  colors: readonly string[],
): ConfettiPiece[] {
  return Array.from({ length: count }, (_, i) => {
    const a = hash01(`c${i}:x`);
    const b = hash01(`c${i}:t`);
    const c = hash01(`c${i}:s`);
    // Real confetti is a small foil rectangle, longer than it is wide, and no
    // two fall alike: each gets its own size, sway, spin and tumble.
    const w = 5 + Math.round(a * 4);
    return {
      id: `c${i}`,
      left: a * 100,
      delay: b * 1100,
      duration: 2600 + c * 2200,
      width: w,
      height: w * (1.6 + b * 1.2),
      spin: (a < 0.5 ? -1 : 1) * (240 + Math.round(b * 600)),
      drift: (b - 0.5) * 360,
      // The tumble is what sells it -- pieces turn edge-on and briefly vanish.
      flip: 540 + Math.round(c * 1440),
      color: pick(colors, c),
    };
  });
}
