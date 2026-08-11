/**
 * Easing curves and the small stagger helper the two graph views share.
 *
 * These used to come from gsap, which was in the tree for exactly two
 * components. The Web Animations API covers what they actually did -- opacity
 * and transform tweens on DOM nodes -- so the named curves below are the
 * cubic-bezier equivalents of the gsap easings that were in use.
 */

/** gsap's "power2.out": fast out of the gate, settling at the end. */
export const POWER2_OUT = "cubic-bezier(0.215, 0.61, 0.355, 1)";

/**
 * gsap's "back.out(1.7)": overshoots past the target and settles back. The
 * overshoot is the point -- it is what makes the nodes pop rather than fade.
 */
export const BACK_OUT = "cubic-bezier(0.34, 1.56, 0.64, 1)";

/** Options for a staggered fade across a set of elements. */
export type FadeOptions = {
  /** Length of each element's animation, in ms. */
  duration: number;
  /** Delay before the first element starts, in ms. */
  delay: number;
  /** Extra delay added per element, in ms. */
  each: number;
  /** A cubic-bezier string or CSS easing keyword. */
  easing: string;
};

/**
 * Per-element delay for a stagger that starts in the middle and works outward,
 * which is gsap's `stagger: { from: "center" }`.
 *
 * @param index - Position of this element in the set.
 * @param total - How many elements there are.
 * @param each - Delay step per element, in ms.
 * @returns The delay for this element, in ms.
 */
export function centerStagger(
  index: number,
  total: number,
  each: number,
): number {
  const middle = (total - 1) / 2;
  return Math.abs(index - middle) * each;
}
