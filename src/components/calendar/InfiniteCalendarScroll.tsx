"use client";

import React, {
  useRef,
  useState,
  useEffect,
  useLayoutEffect,
  forwardRef,
  useImperativeHandle,
  memo,
} from "react";
import { flushSync } from "react-dom";
import { parseISO } from "date-fns";
import { anchorCorrection } from "./scrollAnchor";

export interface InfiniteCalendarScrollHandle {
  scrollToDate(date: Date): void;
  /** Like scrollToDate but also adjusts scroll to bring [data-scroll-target] into view. */
  scrollToToday(date: Date): void;
}

/**
 * Compute the scrollTop that places an element's top edge at the container's
 * top edge. Uses getBoundingClientRect so it works regardless of the
 * offsetParent chain.
 */
function scrollTopFor(container: HTMLDivElement, el: HTMLElement): number {
  return (
    container.scrollTop +
    (el.getBoundingClientRect().top - container.getBoundingClientRect().top)
  );
}

/**
 * After scrolling to a period, check if a [data-scroll-target] element exists
 * within the container and adjust the scroll so it's visible. This brings
 * "today" into view in month grids, and the current time indicator in
 * week/day views.
 */
function adjustScrollForTarget(container: HTMLDivElement): void {
  const target = container.querySelector<HTMLElement>("[data-scroll-target]");
  if (!target) return;

  const containerRect = container.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const targetRelativeTop = targetRect.top - containerRect.top;
  const containerHeight = containerRect.height;

  const isFullyVisible =
    targetRelativeTop >= 0 &&
    targetRelativeTop + targetRect.height <= containerHeight;

  if (!isFullyVisible) {
    container.scrollTop += targetRelativeTop - containerHeight * 0.3;
  }
}

interface Props {
  /** Normalized period-start date to center on initially. */
  initialDate: Date;
  /** Returns the normalized start of the next period. */
  getNextPeriod(date: Date): Date;
  /** Returns the normalized start of the previous period. */
  getPrevPeriod(date: Date): Date;
  /**
   * Returns a stable, parseISO-compatible string key for a period.
   * Must use "yyyy-MM-dd" format so parseISO can reconstruct the Date.
   */
  getPeriodKey(date: Date): string;
  /** Renders one period's content. */
  renderPeriod(date: Date): React.ReactNode;
  /** Fired as the user scrolls — receives the most-visible period's start date. */
  onVisibleDateChange(date: Date): void;
  /** Fired whenever the rendered period list changes so the parent can update its fetch range. */
  onPeriodsChange(periods: Date[]): void;
  /** CSS height of the outer scroll container (e.g. "calc(100dvh - 210px)"). */
  containerHeight: string;
}

const InfiniteCalendarScroll = memo(
  forwardRef<InfiniteCalendarScrollHandle, Props>(
    function InfiniteCalendarScroll(
      {
        initialDate,
        getNextPeriod,
        getPrevPeriod,
        getPeriodKey,
        renderPeriod,
        onVisibleDateChange,
        onPeriodsChange,
        containerHeight,
      },
      ref,
    ) {
      const [periods, setPeriods] = useState<Date[]>(() => [
        getPrevPeriod(initialDate),
        initialDate,
        getNextPeriod(initialDate),
      ]);

      const scrollRef = useRef<HTMLDivElement>(null);
      const topSentinelRef = useRef<HTMLDivElement>(null);
      const bottomSentinelRef = useRef<HTMLDivElement>(null);

      // The period the reader is looking at, and where it sat. Restored after
      // every render so anything that changes height above the viewport --
      // a prepend, event data arriving, a refetch -- does not shove the page.
      const anchorRef = useRef<{ key: string; top: number } | null>(null);

      // Mirror of periods so the observer callbacks can read the latest value
      // and do the scroll-height capture outside the setPeriods updater.
      const periodsRef = useRef(periods);
      useEffect(() => {
        periodsRef.current = periods;
      }, [periods]);

      // After programmatic navigation, stores the target period key and timestamp.
      // The scroll handler uses this to reject stale updates that would revert
      // away from the programmatic target within a settling window.
      const navTargetRef = useRef<{ key: string; time: number } | null>(null);

      // Notify parent of period list changes (drives the fetch range).
      useEffect(() => {
        onPeriodsChange(periods);
      }, [periods, onPeriodsChange]);

      // Put the anchored period back where it was, before the browser paints.
      //
      // This replaces compensation that only knew about prepends. Period
      // content also grows when events and countdowns load, and that case used
      // to shove whatever you were reading down the screen -- which is what the
      // months "jumping" while scrolling actually was.
      useLayoutEffect(() => {
        const container = scrollRef.current;
        const anchor = anchorRef.current;
        if (!container || !anchor) return;

        const el = container.querySelector<HTMLElement>(
          `[data-period-key="${anchor.key}"]`,
        );
        if (!el) return;

        const currentTop =
          el.getBoundingClientRect().top -
          container.getBoundingClientRect().top;
        const delta = anchorCorrection(anchor.top, currentTop);
        if (delta !== 0) container.scrollTop += delta;
      });

      // Bottom sentinel → append next period.
      useEffect(() => {
        const sentinel = bottomSentinelRef.current;
        const container = scrollRef.current;
        if (!sentinel || !container) return;
        const obs = new IntersectionObserver(
          ([entry]) => {
            if (!entry.isIntersecting) return;
            setPeriods((prev) => {
              const next = getNextPeriod(prev[prev.length - 1]);
              const key = getPeriodKey(next);
              if (prev.some((d) => getPeriodKey(d) === key)) return prev;
              return [...prev, next];
            });
          },
          { root: container, rootMargin: "300px" },
        );
        obs.observe(sentinel);
        return () => obs.disconnect();
      }, [getNextPeriod, getPeriodKey]);

      // Top sentinel → prepend previous period with scroll-position preservation.
      useEffect(() => {
        const sentinel = topSentinelRef.current;
        const container = scrollRef.current;
        if (!sentinel || !container) return;
        const obs = new IntersectionObserver(
          ([entry]) => {
            if (!entry.isIntersecting) return;
            const current = periodsRef.current;
            const prevPeriod = getPrevPeriod(current[0]);
            const key = getPeriodKey(prevPeriod);
            if (current.some((d) => getPeriodKey(d) === key)) return;
            setPeriods((prev) =>
              prev.some((d) => getPeriodKey(d) === key)
                ? prev
                : [prevPeriod, ...prev],
            );
          },
          { root: container, rootMargin: "300px" },
        );
        obs.observe(sentinel);
        return () => obs.disconnect();
      }, [getPrevPeriod, getPeriodKey]);

      // Track which period is most visible as the user scrolls.
      // data-period-key stores getPeriodKey(date) which is a "yyyy-MM-dd" string.
      useEffect(() => {
        const container = scrollRef.current;
        if (!container) return;
        function update() {
          if (!container) return;
          const containerTop = container.getBoundingClientRect().top;
          const els =
            container.querySelectorAll<HTMLElement>("[data-period-key]");
          let best: HTMLElement | null = null;
          for (const el of els) {
            const top = el.getBoundingClientRect().top - containerTop;
            // The last element whose top edge is at or above the container's top edge.
            if (top <= 10) best = el;
          }
          if (!best && els.length) best = els[0];
          if (best) {
            const key = best.getAttribute("data-period-key");
            if (key) {
              // Remember what is in view so the layout effect can restore it.
              anchorRef.current = {
                key,
                top: best.getBoundingClientRect().top - containerTop,
              };
              // After programmatic navigation, reject scroll-detected updates
              // that would revert away from the target within a settling window.
              // This handles all async scroll events (IntersectionObserver prepends,
              // useLayoutEffect compensation, browser layout settling) regardless
              // of timing.
              const nav = navTargetRef.current;
              if (nav && Date.now() - nav.time < 500 && key !== nav.key) {
                return;
              }
              onVisibleDateChange(parseISO(key));
            }
          }
        }
        container.addEventListener("scroll", update, { passive: true });
        return () => container.removeEventListener("scroll", update);
      }, [onVisibleDateChange]);

      // Scroll to the initial date once after mount, then adjust so "today" is visible.
      useEffect(() => {
        const container = scrollRef.current;
        if (!container) return;
        const key = getPeriodKey(initialDate);
        const el = container.querySelector<HTMLElement>(
          `[data-period-key="${key}"]`,
        );
        if (el) {
          container.scrollTop = scrollTopFor(container, el);
          adjustScrollForTarget(container);
          // Seed the anchor here too. The top sentinel can fire before the
          // reader has scrolled at all, and without an anchor that first
          // prepend would go uncompensated -- a jump on load.
          anchorRef.current = {
            key,
            top:
              el.getBoundingClientRect().top -
              container.getBoundingClientRect().top,
          };
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []); // run once on mount

      function scrollToPeriod(date: Date, adjustForTarget: boolean) {
        const container = scrollRef.current;
        if (!container) return;
        const key = getPeriodKey(date);

        // Record the navigation target so the scroll handler rejects stale
        // updates that would revert away from this target while settling.
        navTargetRef.current = { key, time: Date.now() };

        // Always reset to a clean 3-period window centered on the target.
        // Accumulated periods from scrolling can create unpredictable scroll
        // state that interferes with scrollTop assignment.
        // A deliberate jump replaces the anchor rather than fighting it.
        anchorRef.current = null;
        flushSync(() => {
          setPeriods([getPrevPeriod(date), date, getNextPeriod(date)]);
        });

        const el = container.querySelector<HTMLElement>(
          `[data-period-key="${key}"]`,
        );

        if (el) {
          container.scrollTop = scrollTopFor(container, el);
          if (adjustForTarget) adjustScrollForTarget(container);
          anchorRef.current = {
            key,
            top:
              el.getBoundingClientRect().top -
              container.getBoundingClientRect().top,
          };
        }

        onVisibleDateChange(parseISO(key));
      }

      useImperativeHandle(
        ref,
        () => ({
          scrollToDate(date: Date) {
            scrollToPeriod(date, false);
          },
          scrollToToday(date: Date) {
            scrollToPeriod(date, true);
          },
        }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [getPeriodKey, getPrevPeriod, getNextPeriod, onVisibleDateChange],
      );

      return (
        <div
          ref={scrollRef}
          className="overflow-y-auto"
          style={{ height: containerHeight }}
          tabIndex={0}
          role="region"
          aria-label="Calendar scroll area"
        >
          <div ref={topSentinelRef} className="h-px" />
          {periods.map((date) => {
            const key = getPeriodKey(date);
            return (
              <div
                key={key}
                data-period-key={key}
                className="mb-4 sm:mb-6 last:mb-0"
              >
                {renderPeriod(date)}
              </div>
            );
          })}
          <div ref={bottomSentinelRef} className="h-px" />
        </div>
      );
    },
  ),
);

export default InfiniteCalendarScroll;
