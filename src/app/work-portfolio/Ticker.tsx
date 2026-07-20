"use client";

import { useRef, useState } from "react";
import styles from "./ticker.module.css";
import { useReducedMotionPref } from "./useReducedMotionPref";

/** How long a touch keeps the marquee frozen before it resumes. */
const TOUCH_RESUME_MS = 4000;

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

  // Touch has no hover, so the first touch freezes the strip long enough
  // to tap a chip, then it resumes on its own.
  const [touchPaused, setTouchPaused] = useState(false);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onTouchStart = () => {
    setTouchPaused(true);
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => setTouchPaused(false), TOUCH_RESUME_MS);
  };

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

  const trackClass = [
    styles.track,
    direction === "right" ? styles.trackRight : "",
    touchPaused ? styles.paused : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section
      aria-label={label}
      className={`w-full overflow-hidden ${borderSide} border-border bg-surface/30`}
      onTouchStart={onTouchStart}
    >
      <div
        className={trackClass}
        data-direction={direction}
        data-paused={touchPaused || undefined}
      >
        <div className="flex w-max items-center gap-2 px-4 py-2.5">
          {children}
        </div>
        <div
          aria-hidden
          inert
          className="flex w-max items-center gap-2 px-4 py-2.5"
        >
          {children}
        </div>
      </div>
    </section>
  );
}
