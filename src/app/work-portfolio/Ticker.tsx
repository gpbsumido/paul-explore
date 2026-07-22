"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./ticker.module.css";
import { useReducedMotionPref } from "./useReducedMotionPref";

/** How long a touch keeps the strip frozen before the ambient scroll resumes. */
const TOUCH_RESUME_MS = 4000;
/** Ambient auto-scroll speed, in pixels per second. */
const SPEED_PX_PER_SEC = 40;

/**
 * A horizontal ticker strip. It is a real scroll container, so every chip is
 * reachable by scrolling (wheel, trackpad, drag, touch). The content renders
 * twice and an ambient auto-scroll nudges scrollLeft, wrapping by one copy
 * width so the loop is seamless; the second copy is aria-hidden so screen
 * readers and tests only see one set. Driving the loop with scrollLeft (not a
 * CSS transform) keeps the painted content aligned with the scroll extent, so
 * there is never any empty space to scroll into. With prefers-reduced-motion
 * the strip is a plain scrollable row with a single copy and no auto-scroll.
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
  /** which way the ambient scroll travels */
  direction: "left" | "right";
  children: React.ReactNode;
}) {
  const reduced = useReducedMotionPref();
  const borderSide = edge === "top" ? "border-b" : "border-t";

  const scrollerRef = useRef<HTMLDivElement>(null);
  const cloneRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  // Mirror `paused` into a ref so the animation-frame loop reads the latest
  // value without the scroll effect re-subscribing on every pause toggle.
  const pausedRef = useRef(false);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  // The clone fills the trailing half of the loop, so chips under it need to
  // stay clickable. inert would kill those clicks, so instead we keep the
  // clone clickable and just drop its contents out of the tab order by hand.
  // Paired with aria-hidden that keeps it invisible to screen readers and out
  // of axe's focusable-content check, while pointer users lose no chips.
  useEffect(() => {
    const focusables = cloneRef.current?.querySelectorAll<HTMLElement>(
      "a[href], button, input, select, textarea, [tabindex]",
    );
    focusables?.forEach((el) => {
      el.tabIndex = -1;
    });
  });

  // Ambient scroll: advance scrollLeft each frame and wrap by one copy width
  // for a seamless loop. Pauses on hover/touch. User scrolling is left alone,
  // both copies are real content so the whole scroll range stays filled.
  useEffect(() => {
    if (reduced) return;
    const el = scrollerRef.current;
    if (!el) return;

    const dir = direction === "left" ? 1 : -1;
    // Start the rightward strip one copy in, so it has somewhere to scroll back.
    if (dir < 0) el.scrollLeft = el.scrollWidth / 2;

    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = now - last;
      last = now;
      const half = el.scrollWidth / 2;
      if (!pausedRef.current && half > 0) {
        let next = el.scrollLeft + (dir * SPEED_PX_PER_SEC * dt) / 1000;
        if (next >= half) next -= half;
        else if (next < 0) next += half;
        el.scrollLeft = next;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [reduced, direction]);

  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const freezeForTouch = () => {
    setPaused(true);
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => setPaused(false), TOUCH_RESUME_MS);
  };

  if (reduced) {
    return (
      <section
        aria-label={label}
        className={`w-full overflow-x-auto ${styles.noScrollbar} ${borderSide} border-border bg-surface/30`}
      >
        <div className="flex w-max items-center gap-2 px-4 py-2.5">{children}</div>
      </section>
    );
  }

  return (
    <section
      ref={scrollerRef}
      aria-label={label}
      className={`w-full overflow-x-auto overflow-y-hidden ${styles.noScrollbar} ${borderSide} border-border bg-surface/30`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={freezeForTouch}
    >
      <div className="flex w-max" data-direction={direction} data-paused={paused || undefined}>
        <div className="flex w-max items-center gap-2 px-4 py-2.5">{children}</div>
        <div ref={cloneRef} aria-hidden className="flex w-max items-center gap-2 px-4 py-2.5">
          {children}
        </div>
      </div>
    </section>
  );
}
