"use client";

import { useRef, useState, useEffect } from "react";
import {
  motion,
  useInView,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import Section from "./Section";
import { spring, instantTransition } from "@/lib/animations";

const headingWipe = {
  hidden: { clipPath: "inset(0 100% 0 0)" },
  visible: { clipPath: "inset(0 0% 0 0)" },
};

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0 },
};

type Rating = "good" | "needs-improvement" | "poor";

const RATING_DOT: Record<Rating, string> = {
  "good":              "bg-green-400",
  "needs-improvement": "bg-yellow-400",
  "poor":              "bg-red-400",
};

const RATING_BAR: Record<Rating, string> = {
  "good":              "bg-green-500",
  "needs-improvement": "bg-yellow-500",
  "poor":              "bg-red-500",
};

const RATING_TEXT: Record<Rating, string> = {
  "good":              "text-green-300",
  "needs-improvement": "text-yellow-300",
  "poor":              "text-red-300",
};

// pct = visual score out of 100 (higher = better) based on metric thresholds
const MOCK_METRICS: { name: string; value: string; rating: Rating; pct: number }[] = [
  { name: "LCP",  value: "1.8s",  rating: "good", pct: 82 },
  { name: "FCP",  value: "0.9s",  rating: "good", pct: 92 },
  { name: "INP",  value: "145ms", rating: "good", pct: 78 },
  { name: "CLS",  value: "0.041", rating: "good", pct: 88 },
  { name: "TTFB", value: "320ms", rating: "good", pct: 72 },
];

const MOCK_ROWS: { page: string; lcp: string; rating: Rating; pct: number }[] = [
  { page: "/protected/vitals", lcp: "1.8s", rating: "good",             pct: 82 },
  { page: "/calendar",         lcp: "2.1s", rating: "good",             pct: 74 },
  { page: "/tcg/browse",       lcp: "2.9s", rating: "needs-improvement", pct: 52 },
];

const HIGHLIGHTS = [
  [
    "Real-user Collection",
    "The web-vitals package fires each metric from real browsers over real connections. sendBeacon guarantees delivery even when the user navigates away before the metric fires.",
  ],
  [
    "P75 in Postgres",
    "PERCENTILE_CONT(0.75) aggregates the 75th percentile natively in SQL — no extra tooling. P75 is the same threshold Google uses for search ranking.",
  ],
  [
    "End-to-end Ownership",
    "BFF proxy keeps auth tokens server-side. Data lives in our own DB so the dashboard can be embedded anywhere, not just a third-party UI.",
  ],
] as const;

const BADGE_DELAY = 0.6;

// ---------------------------------------------------------------------------
// AnimatedBar — springs width from 0% to pct% on inView
// ---------------------------------------------------------------------------

function AnimatedBar({
  pct,
  rating,
  inView,
  prefersReduced,
}: {
  pct: number;
  rating: Rating;
  inView: boolean;
  prefersReduced: boolean;
}) {
  const widthSpring = useSpring(0, { stiffness: 80, damping: 18 });
  const widthPct = useTransform(widthSpring, (v) => `${v}%`);

  useEffect(() => {
    if (inView) widthSpring.set(prefersReduced ? pct : pct);
  }, [inView, pct, widthSpring, prefersReduced]);

  // Reduced motion: jump immediately by setting a fast spring
  useEffect(() => {
    if (prefersReduced && inView) widthSpring.jump(pct);
  }, [inView, pct, prefersReduced, widthSpring]);

  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
      <motion.div
        className={`h-full rounded-full ${RATING_BAR[rating]}`}
        style={{ width: widthPct }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// AnimatedStat — counts from 0 to the numeric part of value on inView.
// Preserves the original suffix (e.g. "s", "ms") from the source string.
// ---------------------------------------------------------------------------

function AnimatedStat({
  value,
  inView,
  className,
  prefersReduced,
}: {
  value: string;
  inView: boolean;
  className?: string;
  prefersReduced: boolean;
}) {
  const match = value.match(/^([\d.]+)(.*)$/);
  const numStr = match?.[1] ?? value;
  const suffix = match?.[2] ?? "";
  const target = parseFloat(numStr);
  const decimals = numStr.includes(".") ? numStr.split(".")[1].length : 0;

  const springVal = useSpring(0, { stiffness: 60, damping: 15 });
  const displayed = useTransform(springVal, (v) => v.toFixed(decimals) + suffix);

  useEffect(() => {
    if (inView) springVal.set(target);
  }, [inView, target, springVal]);

  if (prefersReduced) {
    return <span className={className}>{inView ? value : "—"}</span>;
  }

  return <motion.span className={className}>{displayed}</motion.span>;
}

// ---------------------------------------------------------------------------
// RatingBadge — scales in with spring.bounce after bars settle (delay: 0.6s)
// ---------------------------------------------------------------------------

function RatingBadge({
  rating,
  inView,
  prefersReduced,
}: {
  rating: Rating;
  inView: boolean;
  prefersReduced: boolean;
}) {
  return (
    <motion.div
      className={`h-1.5 w-1.5 shrink-0 rounded-full ${RATING_DOT[rating]}`}
      initial={{ scale: 0, opacity: 0 }}
      animate={inView ? { scale: 1, opacity: 1 } : undefined}
      transition={
        prefersReduced
          ? { ...instantTransition }
          : { ...spring.bounce, delay: BADGE_DELAY }
      }
    />
  );
}

// ---------------------------------------------------------------------------
// Section
// ---------------------------------------------------------------------------

export default function VitalsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });
  const prefersReduced = useReducedMotion() ?? false;
  const transition = prefersReduced ? instantTransition : undefined;

  return (
    <Section
      className="bg-gradient-to-br from-green-950 to-neutral-900"
      glow="radial-gradient(ellipse at 80% 50%, color-mix(in srgb, var(--color-feature-vitals) 5%, transparent) 0%, transparent 60%)"
    >
      <div ref={ref}>
        <motion.h2
          className="text-center text-3xl font-bold tracking-tight text-white md:text-4xl"
          variants={headingWipe}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          transition={transition ?? { ...spring.smooth }}
        >
          Web Vitals Dashboard
        </motion.h2>

        <motion.p
          className="mx-auto mt-3 max-w-lg text-center text-white/70"
          variants={fadeUp}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          transition={transition ?? { ...spring.smooth, delay: 0.1 }}
        >
          Real-user Core Web Vitals collected from every page load. P75 scores
          aggregated in Postgres and displayed on a protected dashboard — field
          data, not lab simulations.
        </motion.p>

        {/* Mock dashboard UI */}
        <motion.div
          className="mt-10 overflow-hidden rounded-xl border border-white/10 bg-white/5 shadow-xl backdrop-blur-sm"
          variants={fadeUp}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          transition={transition ?? { ...spring.smooth, delay: 0 }}
        >
          {/* Mock nav bar */}
          <div className="flex items-center gap-3 border-b border-white/10 px-4 py-2.5">
            <div className="h-4 w-4 rounded bg-white/20" />
            <span className="text-[11px] font-black uppercase tracking-[0.15em] text-white/80">
              Web Vitals
            </span>
            <div className="ml-auto h-5 w-5 rounded-full bg-white/15" />
          </div>

          {/* Mock metric cards — bar + rating badge + animated value */}
          <div className="grid grid-cols-5 divide-x divide-white/10 border-b border-white/10">
            {MOCK_METRICS.map(({ name, value, rating, pct }) => (
              <div key={name} className="flex flex-col items-center gap-1 px-2 py-3">
                <span className="text-[9px] font-bold uppercase tracking-wider text-white/40">
                  {name}
                </span>
                <RatingBadge rating={rating} inView={inView} prefersReduced={prefersReduced} />
                <AnimatedStat
                  value={value}
                  inView={inView}
                  prefersReduced={prefersReduced}
                  className={`text-[11px] font-bold tabular-nums ${RATING_TEXT[rating]}`}
                />
                <div className="mt-1 w-full px-1">
                  <AnimatedBar pct={pct} rating={rating} inView={inView} prefersReduced={prefersReduced} />
                </div>
              </div>
            ))}
          </div>

          {/* Mock by-page table */}
          <div className="p-3">
            <div className="mb-1.5 text-[9px] font-bold uppercase tracking-widest text-white/30">
              By page
            </div>
            <div className="overflow-hidden rounded-lg border border-white/10">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="px-2.5 py-1.5 text-left text-[9px] font-bold uppercase tracking-wider text-white/30">
                      Page
                    </th>
                    <th className="px-2.5 py-1.5 text-center text-[9px] font-bold uppercase tracking-wider text-white/30">
                      LCP
                    </th>
                    <th className="px-2.5 py-1.5 text-right text-[9px] font-bold uppercase tracking-wider text-white/30">
                      Score
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_ROWS.map((row, i) => (
                    <tr
                      key={row.page}
                      className={`border-b border-white/5 last:border-b-0 ${i % 2 !== 0 ? "bg-white/[0.02]" : ""}`}
                    >
                      <td className="px-2.5 py-2 text-[10px] font-medium text-white/60">
                        {row.page}
                      </td>
                      <td className={`px-2.5 py-2 text-center text-[10px] font-semibold tabular-nums ${RATING_TEXT[row.rating]}`}>
                        <AnimatedStat value={row.lcp} inView={inView} prefersReduced={prefersReduced} />
                      </td>
                      <td className="px-2.5 py-2">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16">
                            <AnimatedBar pct={row.pct} rating={row.rating} inView={inView} prefersReduced={prefersReduced} />
                          </div>
                          <RatingBadge rating={row.rating} inView={inView} prefersReduced={prefersReduced} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>

        {/* Feature highlights */}
        <motion.div
          className="mt-8 grid gap-4 md:grid-cols-3"
          variants={fadeUp}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          transition={transition ?? { ...spring.smooth, delay: 0.8 }}
        >
          {HIGHLIGHTS.map(([t, d]) => (
            <div
              key={t}
              className="rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
            >
              <h4 className="text-[15px] font-semibold text-white">{t}</h4>
              <p className="mt-1 text-[13px] leading-relaxed text-white/60">{d}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </Section>
  );
}
