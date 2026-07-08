"use client";

import { useRef, useSyncExternalStore } from "react";
import { useInView } from "framer-motion";
import { useCountUp } from "@/hooks/useCountUp";

const STATS: ReadonlyArray<{
  target: number;
  label: string;
  suffix?: string;
}> = [
  { target: 14, label: "features" },
  { target: 108, label: "tests", suffix: "+" },
  { target: 17, label: "write-ups" },
  { target: 5, label: "CWV metrics tracked" },
];

/**
 * Isolated component so each stat has its own useCountUp call.
 * SSR renders the final target value; client animates from 0 on scroll.
 */
function StatValue({
  target,
  suffix,
  inView,
  mounted,
}: {
  target: number;
  suffix?: string;
  inView: boolean;
  mounted: boolean;
}) {
  const value = useCountUp(target, 1500, inView && mounted);
  const display = mounted ? Math.round(value) : target;
  return (
    <>
      {display}
      {suffix}
    </>
  );
}

/** Full-bleed evidence strip with count-up stats on scroll. */
export default function StatsStrip() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  return (
    <section ref={ref} className="border-y border-border bg-surface">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 py-16 text-center sm:grid-cols-4 sm:gap-12 sm:py-20">
        {STATS.map((stat) => (
          <div key={stat.label}>
            <p className="text-4xl font-bold text-foreground sm:text-5xl">
              <StatValue
                target={stat.target}
                suffix={stat.suffix}
                inView={inView}
                mounted={mounted}
              />
            </p>
            <p className="mt-1 text-sm text-muted">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
