"use client";

import styles from "./ticker.module.css";
import { useReducedMotionPref } from "./useReducedMotionPref";

/**
 * A horizontal marquee strip. The content renders twice and the track slides
 * one copy-width for a seamless loop; the second copy is aria-hidden so
 * screen readers and tests only see one set. With prefers-reduced-motion the
 * strip falls back to a plain scrollable row with a single copy.
 */
export default function Ticker({
  label,
  edge,
  direction,
  children,
}: {
  /** accessible name, also used by tests to find each strip */
  label: string;
  /** which edge of the page this strip sits on */
  edge: "top" | "bottom";
  /** which way the marquee travels */
  direction: "left" | "right";
  children: React.ReactNode;
}) {
  const reduced = useReducedMotionPref();
  const borderSide = edge === "top" ? "border-b" : "border-t";

  if (reduced) {
    return (
      <section
        aria-label={label}
        className={`w-full overflow-x-auto ${borderSide} border-border bg-surface/30`}
      >
        <div className="flex w-max items-center gap-2 px-4 py-2.5">
          {children}
        </div>
      </section>
    );
  }

  const trackClass =
    direction === "right" ? `${styles.track} ${styles.trackRight}` : styles.track;

  return (
    <section
      aria-label={label}
      className={`w-full overflow-hidden ${borderSide} border-border bg-surface/30`}
    >
      <div className={trackClass} data-direction={direction}>
        <div className="flex w-max items-center gap-2 px-4 py-2.5">
          {children}
        </div>
        <div aria-hidden className="flex w-max items-center gap-2 px-4 py-2.5">
          {children}
        </div>
      </div>
    </section>
  );
}
