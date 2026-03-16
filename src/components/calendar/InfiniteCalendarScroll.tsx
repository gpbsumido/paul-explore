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
import { parseISO } from "date-fns";

export interface InfiniteCalendarScrollHandle {
  scrollToDate(date: Date): void;
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
  forwardRef<InfiniteCalendarScrollHandle, Props>(function InfiniteCalendarScroll(
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

    // Saved scrollHeight right before a prepend — useLayoutEffect compensates after the DOM update.
    const prependHeightRef = useRef<number | null>(null);

    // Notify parent of period list changes (drives the fetch range).
    useEffect(() => {
      onPeriodsChange(periods);
    }, [periods, onPeriodsChange]);

    // Restore scroll position synchronously before the browser paints after a prepend.
    useLayoutEffect(() => {
      if (prependHeightRef.current !== null && scrollRef.current) {
        const delta = scrollRef.current.scrollHeight - prependHeightRef.current;
        scrollRef.current.scrollTop += delta;
        prependHeightRef.current = null;
      }
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
          setPeriods((prev) => {
            const prevPeriod = getPrevPeriod(prev[0]);
            const key = getPeriodKey(prevPeriod);
            if (prev.some((d) => getPeriodKey(d) === key)) return prev;
            if (scrollRef.current) {
              prependHeightRef.current = scrollRef.current.scrollHeight;
            }
            return [prevPeriod, ...prev];
          });
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
        const els = container.querySelectorAll<HTMLElement>("[data-period-key]");
        let best: HTMLElement | null = null;
        for (const el of els) {
          const top = el.getBoundingClientRect().top - containerTop;
          // The last element whose top edge is at or above the container's top edge.
          if (top <= 10) best = el;
        }
        if (!best && els.length) best = els[0];
        if (best) {
          const key = best.getAttribute("data-period-key");
          if (key) onVisibleDateChange(parseISO(key));
        }
      }
      container.addEventListener("scroll", update, { passive: true });
      return () => container.removeEventListener("scroll", update);
    }, [onVisibleDateChange]);

    // Scroll to the initial date once after mount.
    useEffect(() => {
      const container = scrollRef.current;
      if (!container) return;
      const key = getPeriodKey(initialDate);
      const el = container.querySelector<HTMLElement>(`[data-period-key="${key}"]`);
      if (el) container.scrollTop = el.offsetTop;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // run once on mount

    useImperativeHandle(
      ref,
      () => ({
        scrollToDate(date: Date) {
          const container = scrollRef.current;
          if (!container) return;
          const key = getPeriodKey(date);
          const existing = container.querySelector<HTMLElement>(
            `[data-period-key="${key}"]`,
          );
          if (existing) {
            container.scrollTop = existing.offsetTop;
            onVisibleDateChange(parseISO(key));
            return;
          }
          // Date not in the rendered list — reset to a fresh window centered on this date.
          prependHeightRef.current = null;
          setPeriods([getPrevPeriod(date), date, getNextPeriod(date)]);
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              const el = container.querySelector<HTMLElement>(
                `[data-period-key="${key}"]`,
              );
              if (el) container.scrollTop = el.offsetTop;
              onVisibleDateChange(parseISO(key));
            });
          });
        },
      }),
      [getPeriodKey, getPrevPeriod, getNextPeriod, onVisibleDateChange],
    );

    return (
      <div
        ref={scrollRef}
        className="overflow-y-auto"
        style={{ height: containerHeight }}
      >
        <div ref={topSentinelRef} className="h-px" />
        {periods.map((date) => {
          const key = getPeriodKey(date);
          return (
            <div key={key} data-period-key={key} className="mb-4 sm:mb-6 last:mb-0">
              {renderPeriod(date)}
            </div>
          );
        })}
        <div ref={bottomSentinelRef} className="h-px" />
      </div>
    );
  }),
);

export default InfiniteCalendarScroll;
