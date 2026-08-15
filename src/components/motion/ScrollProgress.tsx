"use client";

import { m, useScroll, useSpring } from "framer-motion";
import { useHubReducedMotion } from "@/app/providers";

export type ScrollProgressProps = {
  /** Bar thickness in pixels. */
  height?: number;
  className?: string;
};

/**
 * A thin bar across the top of the window showing how far down the page you
 * are.
 *
 * aria-hidden because it says exactly what the scrollbar already says. Exposing
 * it as a progressbar would put a second, constantly-changing announcement in
 * front of screen reader users for no new information.
 */
export default function ScrollProgress({
  height = 2,
  className,
}: ScrollProgressProps) {
  const reducedMotion = useHubReducedMotion();
  const { scrollYProgress } = useScroll();
  // The spring is what makes it feel like a physical readout rather than a
  // number being redrawn. Under reduced motion it tracks scroll exactly.
  const smoothed = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });
  const scaleX = reducedMotion ? scrollYProgress : smoothed;

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-x-0 top-0 z-[var(--z-fixed)] ${className ?? ""}`}
      style={{ height }}
    >
      <m.div
        className="h-full origin-left bg-primary-500"
        style={{ scaleX }}
      />
    </div>
  );
}
