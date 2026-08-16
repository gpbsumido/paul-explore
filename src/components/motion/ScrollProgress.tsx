"use client";

import type { RefObject } from "react";
import { m, useScroll, useSpring } from "framer-motion";
import { useHubReducedMotion } from "@/app/providers";

export type ScrollProgressProps = {
  /** Bar thickness in pixels. */
  height?: number;
  className?: string;
  /**
   * A scrollable element to track instead of the window. The bar then
   * positions itself absolutely, for the caller to place against that box.
   */
  container?: RefObject<HTMLElement | null>;
};

/**
 * A thin bar showing how far through a scroll you are: the window by default,
 * or a given scrollable element.
 *
 * aria-hidden because it says exactly what the scrollbar already says. Exposing
 * it as a progressbar would put a second, constantly-changing announcement in
 * front of screen reader users for no new information.
 */
export default function ScrollProgress({
  height = 2,
  className,
  container,
}: ScrollProgressProps) {
  const reducedMotion = useHubReducedMotion();
  // Passing `container: undefined` is not the same as passing nothing to
  // framer, so the argument object is only built when there is one to track.
  const { scrollYProgress } = useScroll(
    container ? { container } : undefined,
  );
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
      className={`pointer-events-none inset-x-0 top-0 ${
        container ? "absolute" : "fixed z-[var(--z-fixed)]"
      } ${className ?? ""}`}
      style={{ height }}
    >
      <m.div
        className="h-full origin-left bg-primary-500"
        style={{ scaleX }}
      />
    </div>
  );
}
