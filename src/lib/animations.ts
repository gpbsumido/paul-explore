/**
 * Shared Framer Motion spring configs and variant factories.
 *
 * Import from here instead of defining inline spring/variant objects so
 * everything in the app feels consistent and tuning one preset updates
 * every component that uses it.
 *
 * Usage:
 *   import { spring, fadeInUp, staggerContainer } from "@/lib/animations"
 *   <motion.div variants={fadeInUp} transition={spring.smooth} />
 */

import type { Transition, Variants } from "framer-motion";

// ---------------------------------------------------------------------------
// Spring presets
// ---------------------------------------------------------------------------

/** Standard spring configs. Pass as the `transition` prop on a motion element. */
export const spring = {
  /** Tight and quick, good for hover lifts and button presses. */
  snappy: { type: "spring", stiffness: 400, damping: 30 } satisfies Transition,

  /** Smooth and controlled, the default for most entrance animations. */
  smooth: { type: "spring", stiffness: 200, damping: 28 } satisfies Transition,

  /** A little elastic, good for cards and list items popping in. */
  bounce: { type: "spring", stiffness: 300, damping: 18 } satisfies Transition,

  /** Slow and easy, for large layout transitions that shouldn't feel rushed. */
  gentle: { type: "spring", stiffness: 120, damping: 22 } satisfies Transition,

  /** Tuned for word-level text reveal — enough energy to feel alive, not bouncy. */
  wordReveal: {
    type: "spring",
    stiffness: 260,
    damping: 20,
  } satisfies Transition,
} as const;

// ---------------------------------------------------------------------------
// Reusable variants
// ---------------------------------------------------------------------------

/** Fade up from 20px below — the general-purpose entrance variant. */
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

/** Simple opacity fade, no movement. */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

/** Scale up from 92% with fade — good for modals and popovers. */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1 },
};

/** Slide in from the left. */
export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0 },
};

/** Slide in from the right. */
export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0 },
};

/**
 * 3D perspective flip-in for feature card grids.
 * Pair with `style={{ perspective: "1000px" }}` on the parent container
 * so the rotateX has a reference plane to work against.
 */
export const cardFlipIn: Variants = {
  hidden: { opacity: 0, y: 40, rotateX: 25, scale: 0.96 },
  visible: { opacity: 1, y: 0, rotateX: 0, scale: 1 },
};

/**
 * Direction-aware slide for calendar view transitions.
 *
 * Accepts a `custom` prop of -1 (backward), 0 (crossfade), or 1 (forward).
 * Forward: new view slides in from the right. Backward: from the left.
 * Zero: pure opacity crossfade with no horizontal movement.
 *
 * Usage:
 *   <AnimatePresence mode="wait" custom={direction}>
 *     <motion.div key={viewKey} custom={direction} variants={calendarSlide}
 *                 initial="hidden" animate="visible" exit="exit"
 *                 transition={{ ...spring.smooth }} />
 *   </AnimatePresence>
 */
export const calendarSlide: Variants = {
  hidden: (direction: number) => ({ opacity: 0, x: direction * 40 }),
  visible: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: direction * -40 }),
};

/**
 * Word-level reveal for hero headings.
 * Wrap each word in a `motion.span` with `display: inline-block`,
 * then put this variant on each span inside a staggerContainer parent.
 */
export const wordReveal: Variants = {
  hidden: { opacity: 0, y: 28, rotateX: -20 },
  visible: { opacity: 1, y: 0, rotateX: 0 },
};

/** Left-to-right clip wipe, used for landing section headings. */
export const headingWipe: Variants = {
  hidden: { clipPath: "inset(0 100% 0 0)" },
  visible: { clipPath: "inset(0 0% 0 0)" },
};

/** Subtle fade up from 14px, used for landing section subtitles and blocks. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0 },
};

// ---------------------------------------------------------------------------
// Container factory
// ---------------------------------------------------------------------------

/**
 * Returns a variants object that staggers its children.
 * Apply to the parent container, then put any of the above variants on
 * each child — the parent orchestrates the timing automatically.
 *
 * @param staggerChildren - seconds between each child animating in (default 0.06)
 * @param delayChildren   - seconds before the first child starts (default 0)
 */
export const staggerContainer = (
  staggerChildren = 0.06,
  delayChildren = 0,
): Variants => ({
  hidden: {},
  visible: {
    transition: { staggerChildren, delayChildren },
  },
});

// ---------------------------------------------------------------------------
// Reduced motion fallback
// ---------------------------------------------------------------------------

/**
 * Pass as the `transition` prop when `useReducedMotion()` returns true.
 * Skips the animation entirely without removing the motion element from the tree.
 */
export const instantTransition: Transition = { duration: 0 };
