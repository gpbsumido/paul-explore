"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  motion,
  AnimatePresence,
  useInView,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import Section from "./Section";
import ModelLazyMount from "./models/ModelLazyMount";
import {
  slideInRight,
  spring,
  instantTransition,
  headingWipe,
  fadeUp,
} from "@/lib/animations";

// Dynamically imported — avoids WebGL code on the server.
const NbaSectionCanvas = dynamic(() => import("./models/NbaSectionCanvas"), {
  ssr: false,
});

// ---------------------------------------------------------------------------
// AnimatedStat — springs a number from 0 to its value when inView flips true.
// ---------------------------------------------------------------------------

/** @param value - stringified number like "28.4" or "12" */
function AnimatedStat({
  value,
  inView,
  className,
}: {
  value: string;
  inView: boolean;
  className?: string;
}) {
  const prefersReduced = useReducedMotion();
  const target = parseFloat(value);
  const decimals = value.includes(".") ? value.split(".")[1].length : 0;

  const springVal = useSpring(0, { stiffness: 60, damping: 15 });
  const displayed = useTransform(springVal, (v) => v.toFixed(decimals));

  useEffect(() => {
    if (inView) springVal.set(target);
  }, [inView, target, springVal]);

  if (prefersReduced) {
    return <span className={className}>{inView ? value : "—"}</span>;
  }

  return <motion.span className={className}>{displayed}</motion.span>;
}

// ---------------------------------------------------------------------------
// StatRow — slides in from the right; numeric cells use AnimatedStat.
// ---------------------------------------------------------------------------

function StatRow({
  name,
  team,
  pts,
  reb,
  ast,
  odd,
  index,
  inView,
}: {
  name: string;
  team: string;
  pts: string;
  reb: string;
  ast: string;
  odd?: boolean;
  index: number;
  inView: boolean;
}) {
  const prefersReduced = useReducedMotion();

  return (
    <motion.tr
      className={odd ? "bg-white/5" : ""}
      variants={slideInRight}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      transition={
        prefersReduced
          ? { ...instantTransition }
          : { ...spring.smooth, delay: index * 0.05 }
      }
    >
      <td className="px-3 py-2 text-sm font-medium text-white">{name}</td>
      <td className="px-3 py-2 text-sm text-white/60">{team}</td>
      <td className="px-3 py-2 text-right text-sm font-semibold">
        <AnimatedStat
          value={pts}
          inView={inView}
          className="text-primary-400"
        />
      </td>
      <td className="px-3 py-2 text-right text-sm text-white">
        <AnimatedStat value={reb} inView={inView} />
      </td>
      <td className="px-3 py-2 text-right text-sm text-white">
        <AnimatedStat value={ast} inView={inView} />
      </td>
    </motion.tr>
  );
}

// ---------------------------------------------------------------------------
// Section data
// ---------------------------------------------------------------------------

const ROWS = [
  { name: "Luka Doncic", team: "LAL", pts: "28.4", reb: "8.3", ast: "8.1" },
  { name: "Jayson Tatum", team: "BOS", pts: "27.0", reb: "8.5", ast: "4.6" },
  { name: "Shai Gilgeous", team: "OKC", pts: "31.2", reb: "5.5", ast: "6.0" },
  { name: "Nikola Jokic", team: "DEN", pts: "26.3", reb: "12.4", ast: "9.0" },
] as const;

// Each slide is a feature highlight; the active one is displayed in the left panel.
const SLIDES = [
  {
    id: "proxy",
    title: "Live API Proxy",
    body: "Server-side proxy forwards requests to the ESPN and NBA APIs, injects credentials, and normalizes the response — no keys ever reach the browser.",
  },
  {
    id: "matchups",
    title: "Fantasy Matchups",
    body: "Head-to-head weekly breakdown with per-category wins, an animated score bar, and an AI-style win-probability chip that updates as the week progresses.",
  },
  {
    id: "court",
    title: "Court Vision",
    body: "SVG half-court shot chart with hexagonal zones color-coded by FG%. Hover a zone to see shot volume and efficiency — built without a charting library.",
  },
] as const;

// ---------------------------------------------------------------------------
// NbaSection — bleed layout: content left ~52%, canvas right with overflow.
// The feature carousel (dots + animated card) replaces the static highlights grid.
// On mobile the canvas is hidden; content spans full width.
// ---------------------------------------------------------------------------

export default function NbaSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });
  const prefersReduced = useReducedMotion();
  const transition = prefersReduced ? instantTransition : undefined;

  const [activeSlide, setActiveSlide] = useState(0);

  return (
    <Section glow="radial-gradient(ellipse at 80% 50%, color-mix(in srgb, var(--color-feature-nba) 5%, transparent) 0%, transparent 60%)">
      {/* relative wrapper so the canvas can be absolutely positioned against it */}
      <div ref={ref} className="relative">
        {/* Left content — full width on mobile, 52% on desktop.
            Width (not padding) keeps the element out of the canvas hit area. */}
        <div className="relative z-10 md:w-[52%]">
          <motion.h2
            className="text-3xl font-bold tracking-tight text-white md:text-4xl"
            variants={headingWipe}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            transition={transition ?? { ...spring.smooth }}
          >
            NBA Stats
          </motion.h2>

          <motion.p
            className="mt-3 max-w-sm text-white/70"
            variants={fadeUp}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            transition={transition ?? { ...spring.smooth, delay: 0.1 }}
          >
            Player stats, fantasy matchups, and shot charts built on the ESPN
            and NBA APIs with server-side proxying.
          </motion.p>

          {/* mock table */}
          <motion.div
            className="mt-8 overflow-hidden rounded-xl border border-white/10 bg-white/10 shadow-xl backdrop-blur-sm"
            variants={fadeUp}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            transition={transition ?? { ...spring.smooth, delay: 0.15 }}
          >
            <div className="overflow-x-auto" tabIndex={0}>
              <table className="w-full text-left text-white">
                <thead>
                  <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-white/60">
                    <th className="px-3 py-3">Player</th>
                    <th className="px-3 py-3">Team</th>
                    <th className="px-3 py-3 text-right">PTS</th>
                    <th className="px-3 py-3 text-right">REB</th>
                    <th className="px-3 py-3 text-right">AST</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {ROWS.map((row, i) => (
                    <StatRow
                      key={row.name}
                      {...row}
                      odd={i % 2 === 0}
                      index={i}
                      inView={inView}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Feature carousel — animated card + dot indicators */}
          <motion.div
            className="mt-6"
            variants={fadeUp}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            transition={transition ?? { ...spring.smooth, delay: 0.35 }}
          >
            {/* Animated feature card */}
            <div className="relative min-h-[88px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={SLIDES[activeSlide].id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="rounded-xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-sm"
                >
                  <h4 className="text-[15px] font-semibold text-white">
                    {SLIDES[activeSlide].title}
                  </h4>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-white/65">
                    {SLIDES[activeSlide].body}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Dot indicators — pill style, close together */}
            <div className="mt-3 flex items-center gap-1.5">
              {SLIDES.map((slide, i) => (
                <button
                  key={slide.id}
                  onClick={() => setActiveSlide(i)}
                  aria-label={`View ${slide.title}`}
                  aria-current={i === activeSlide ? "true" : undefined}
                  className={[
                    "h-2 rounded-full transition-all duration-300",
                    i === activeSlide
                      ? "w-5 bg-yellow-300"
                      : "w-2 bg-white/30 hover:bg-white/50",
                  ].join(" ")}
                />
              ))}
            </div>
          </motion.div>

          <motion.div
            className="mt-8"
            variants={fadeUp}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            transition={transition ?? { ...spring.smooth, delay: 0.5 }}
          >
            <Link
              href="/fantasy/nba/matchups"
              className="inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-500/10 px-6 py-2.5 text-[14px] font-semibold text-yellow-300 transition-colors hover:bg-yellow-500/20 hover:text-yellow-200"
            >
              View Fantasy NBA →
            </Link>
          </motion.div>
        </div>

        {/* 3D canvas — right-aligned, bleeds off the right viewport edge.
            pointer-events-none on the wrapper keeps the surrounding area transparent.
            The Canvas itself sets pointer-events: auto so OrbitControls receives events. */}
        <div
          className="pointer-events-none absolute inset-y-0 hidden md:block"
          style={{ left: "52%", right: "-20vw" }}
        >
          <ModelLazyMount style={{ width: "100%", height: "100%" }}>
            <NbaSectionCanvas />
          </ModelLazyMount>
        </div>
      </div>
    </Section>
  );
}
