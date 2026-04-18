"use client";

import { useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  motion,
  useInView,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import Section from "./Section";
import ModelLazyMount from "./models/ModelLazyMount";
import {
  spring,
  instantTransition,
  headingWipe,
  fadeUp,
} from "@/lib/animations";

const VitalsSectionCanvas = dynamic(
  () => import("./models/VitalsSectionCanvas"),
  { ssr: false },
);

type Rating = "good" | "needs-improvement" | "poor";

const RATING_DOT: Record<Rating, string> = {
  good: "bg-green-400",
  "needs-improvement": "bg-yellow-400",
  poor: "bg-red-400",
};

const RATING_BAR: Record<Rating, string> = {
  good: "bg-green-500",
  "needs-improvement": "bg-yellow-500",
  poor: "bg-red-500",
};

const RATING_TEXT: Record<Rating, string> = {
  good: "text-green-300",
  "needs-improvement": "text-yellow-300",
  poor: "text-red-300",
};

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
    if (!inView) return;
    if (prefersReduced) {
      widthSpring.jump(pct);
    } else {
      widthSpring.set(pct);
    }
  }, [inView, pct, widthSpring, prefersReduced]);

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
  const displayed = useTransform(
    springVal,
    (v) => v.toFixed(decimals) + suffix,
  );

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
    <Section glow="radial-gradient(ellipse at 80% 50%, color-mix(in srgb, var(--color-feature-vitals) 5%, transparent) 0%, transparent 60%)">
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

        {/* Speedometer — hidden on mobile: the portrait aspect ratio causes the
            model to clip outside the view frustum, leaving only the Html
            hotspot dots floating in empty space. */}
        <div className="hidden md:block">
          <motion.div
            className="mt-10"
            variants={fadeUp}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            transition={transition ?? { ...spring.smooth, delay: 0.15 }}
          >
            <ModelLazyMount
              style={{ height: "360px", maxWidth: "520px", margin: "0 auto" }}
            >
              <VitalsSectionCanvas
                inView={inView}
                prefersReduced={prefersReduced}
              />
            </ModelLazyMount>
          </motion.div>
        </div>

        {/* Three primary stat cards — LCP, INP, CLS */}
        <motion.div
          className="mt-6 grid grid-cols-3 gap-2 sm:gap-4"
          variants={fadeUp}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          transition={transition ?? { ...spring.smooth, delay: 0.3 }}
        >
          {(
            [
              { name: "LCP", value: "1.8s", rating: "good" as Rating, pct: 82 },
              {
                name: "INP",
                value: "145ms",
                rating: "good" as Rating,
                pct: 78,
              },
              {
                name: "CLS",
                value: "0.041",
                rating: "good" as Rating,
                pct: 88,
              },
            ] as const
          ).map(({ name, value, rating, pct }) => (
            <div
              key={name}
              className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2 py-3 backdrop-blur-sm sm:px-4 sm:py-4"
            >
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                {name}
              </span>
              <RatingBadge
                rating={rating}
                inView={inView}
                prefersReduced={prefersReduced}
              />
              <AnimatedStat
                value={value}
                inView={inView}
                prefersReduced={prefersReduced}
                className={`text-base font-bold tabular-nums sm:text-lg ${RATING_TEXT[rating]}`}
              />
              <div className="mt-1 w-full">
                <AnimatedBar
                  pct={pct}
                  rating={rating}
                  inView={inView}
                  prefersReduced={prefersReduced}
                />
              </div>
            </div>
          ))}
        </motion.div>

        {/* Feature highlights */}
        <motion.div
          className="mt-8 grid gap-4 md:grid-cols-3"
          variants={fadeUp}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          transition={transition ?? { ...spring.smooth, delay: 0.5 }}
        >
          {HIGHLIGHTS.map(([t, d]) => (
            <div
              key={t}
              className="rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
            >
              <h4 className="text-[15px] font-semibold text-white">{t}</h4>
              <p className="mt-1 text-[13px] leading-relaxed text-white/60">
                {d}
              </p>
            </div>
          ))}
        </motion.div>

        <motion.div
          className="mt-8 flex justify-center"
          variants={fadeUp}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          transition={transition ?? { ...spring.smooth, delay: 0.65 }}
        >
          <a
            href="/auth/login"
            className="inline-flex items-center gap-2 rounded-full border border-green-400/30 bg-green-500/10 px-6 py-2.5 text-[14px] font-semibold text-green-300 transition-colors hover:bg-green-500/20 hover:text-green-200"
          >
            Log in to view →
          </a>
        </motion.div>
      </div>
    </Section>
  );
}
