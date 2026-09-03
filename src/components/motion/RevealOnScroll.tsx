"use client";

import { m } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";
import { useHubReducedMotion } from "@/app/providers";

type MotionTag = "div" | "li" | "article" | "section";

export type RevealOnScrollProps = {
  /** Which element to render. Defaults to a div. */
  as?: MotionTag;
  /** How far it rises from, in px. */
  y?: number;
  /** Fraction of the element that must be in view before it triggers. */
  amount?: number;
  /** Seconds. */
  duration?: number;
  /** Seconds, for staggering a list by index. */
  delay?: number;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};

// The one easing the landing reveals share, so a row and a card feel like the
// same page rather than two animations that happen to be near each other.
const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Fade-and-rise a block the first time it scrolls into view, honouring reduced
 * motion.
 *
 * This is the only interactive thing in the sections that use it, so pulling it
 * into one island is what lets those sections stay server components: their
 * markup and the static data behind it never reach the browser, and only this
 * wrapper hydrates. It also collapses what used to be the same hand-rolled
 * `m` element copied into two sections into a single gesture with tuning knobs.
 */
export default function RevealOnScroll({
  as = "div",
  y = 16,
  amount = 0.3,
  duration = 0.4,
  delay = 0,
  className,
  style,
  children,
}: RevealOnScrollProps) {
  const reducedMotion = useHubReducedMotion();
  const Motion = m[as];

  return (
    <Motion
      className={className}
      style={style}
      initial={reducedMotion ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration, delay, ease: EASE }}
    >
      {children}
    </Motion>
  );
}
