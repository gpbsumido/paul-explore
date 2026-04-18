"use client";

import { useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, useInView, useReducedMotion } from "framer-motion";
import Section from "./Section";
import ModelLazyMount from "./models/ModelLazyMount";
import {
  spring,
  instantTransition,
  headingWipe,
  fadeUp,
} from "@/lib/animations";

const CalendarSectionCanvas = dynamic(
  () => import("./models/CalendarSectionCanvas"),
  { ssr: false },
);

const DOW = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

// 7 cols × 2 rows = 14 cells. Chips/highlights appear after the last cell + 0.1s.
const CELL_COUNT = 14;
const CHIP_DELAY = CELL_COUNT * 0.015 + 0.1; // 0.31s

const CELL_SPRING = { type: "spring", stiffness: 350, damping: 22 } as const;

// ---------------------------------------------------------------------------
// MockDay — cell scales in, chips fade in after all cells are visible
// ---------------------------------------------------------------------------

function MockDay({
  day,
  today,
  chips = [],
  faded,
  cellIndex,
  inView,
  prefersReduced,
}: {
  day: number;
  today?: boolean;
  chips?: { label: string; color: string }[];
  faded?: boolean;
  cellIndex: number;
  inView: boolean;
  prefersReduced: boolean;
}) {
  return (
    <motion.div
      className="min-h-[52px] border-r border-b border-white/10 p-1 last:border-r-0"
      initial={prefersReduced ? { opacity: 0 } : { scale: 0, opacity: 0 }}
      animate={inView ? { scale: 1, opacity: 1 } : undefined}
      transition={
        prefersReduced
          ? { ...instantTransition }
          : { ...CELL_SPRING, delay: cellIndex * 0.015 }
      }
    >
      <div className="mb-0.5 flex justify-center">
        <span
          className={[
            "inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium",
            today
              ? "bg-red-500 font-semibold text-white"
              : faded
                ? "text-white/25"
                : "text-white/70",
          ].join(" ")}
        >
          {day}
        </span>
      </div>

      {chips.map((chip, i) => (
        <motion.div
          key={i}
          className="mb-0.5 truncate rounded-sm px-1 py-px text-[8px] font-medium"
          style={{ backgroundColor: chip.color + "40", color: chip.color }}
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : undefined}
          transition={
            prefersReduced
              ? { ...instantTransition }
              : { duration: 0.25, delay: CHIP_DELAY }
          }
        >
          {chip.label}
        </motion.div>
      ))}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Section
// ---------------------------------------------------------------------------

const HIGHLIGHTS = [
  [
    "4 Calendar Views",
    "Day and week views use an absolute-positioned time grid — events span their real duration and sit side by side when they overlap.",
  ],
  [
    "Pokémon Card Tracking",
    "Attach cards pulled from Pocket to any event. Search the full TCGdex catalog and log what you got, when you got it.",
  ],
  [
    "Multi-day Events",
    "Events spanning multiple days show on every day they cover, with continuation bars in month view and all-day row promotion in week/day view.",
  ],
] as const;

// Row data keeps cell definitions co-located so cellIndex is easy to derive.
const ROW1 = [
  { day: 26, faded: true, chips: [] },
  { day: 27, faded: true, chips: [] },
  { day: 28, faded: true, chips: [] },
  { day: 1, chips: [{ label: "Pocket night", color: "#10b981" }] },
  { day: 2, chips: [{ label: "Pocket night", color: "#10b981" }] },
  { day: 3, chips: [] },
  { day: 4, chips: [] },
] as const;

const ROW2 = [
  { day: 5, chips: [] },
  { day: 6, chips: [{ label: "Trade meet", color: "#3b82f6" }] },
  {
    day: 7,
    chips: [
      { label: "Trade meet", color: "#3b82f6" },
      { label: "Pulled Mewtwo ✦", color: "#8b5cf6" },
    ],
  },
  { day: 8, chips: [{ label: "Trade meet", color: "#3b82f6" }] },
  { day: 9, chips: [] },
  { day: 10, chips: [] },
  { day: 11, today: true, chips: [] },
] as const;

export default function CalendarSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });
  const prefersReduced = useReducedMotion() ?? false;
  const transition = prefersReduced ? instantTransition : undefined;

  return (
    <Section glow="radial-gradient(ellipse at 80% 50%, color-mix(in srgb, var(--color-feature-calendar) 5%, transparent) 0%, transparent 60%)">
      {/* relative so the canvas can be absolutely positioned within */}
      <div ref={ref} className="relative md:pl-[45%]">
        {/* Clock canvas — fixed height so the canvas is nearly square and the
            clock isn't clipped to a narrow vertical strip. Vertically centered
            so it sits in the middle of the content column. */}
        <div
          className="pointer-events-none absolute left-0 top-1/2 hidden aspect-square -translate-y-1/2 md:block"
          style={{ width: "43%", zIndex: 10 }}
        >
          <ModelLazyMount style={{ width: "100%", height: "100%" }}>
            <CalendarSectionCanvas />
          </ModelLazyMount>
        </div>

        <motion.h2
          className="text-center text-3xl font-bold tracking-tight text-white md:text-left md:text-4xl"
          variants={headingWipe}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          transition={transition ?? { ...spring.smooth }}
        >
          Personal Calendar
        </motion.h2>

        <motion.p
          className="mx-auto mt-3 max-w-lg text-center text-white/70 md:mx-0 md:text-left"
          variants={fadeUp}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          transition={transition ?? { ...spring.smooth, delay: 0.1 }}
        >
          Day, week, month, and year views with multi-day events, an
          overlapping-event layout engine, and Pokémon card attachments — built
          to track what we pull playing Pokémon Pocket together.
        </motion.p>

        {/* Mock calendar month grid */}
        <motion.div
          className="mt-10 overflow-hidden rounded-xl border border-white/10 bg-white/5 shadow-xl backdrop-blur-sm"
          variants={fadeUp}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          transition={transition ?? { ...spring.smooth, delay: 0 }}
        >
          {/* Mock toolbar */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 rounded bg-white/20" />
              <span className="text-sm font-semibold text-white">
                February 2026
              </span>
              <div className="h-4 w-4 rounded bg-white/20" />
            </div>
            <div className="flex gap-1.5">
              {["Day", "Week", "Month", "Year"].map((v, i) => (
                <span
                  key={v}
                  className={[
                    "rounded px-2 py-0.5 text-[10px] font-semibold",
                    i === 2
                      ? "border border-teal-500/30 bg-teal-500/30 text-teal-300"
                      : "text-white/40",
                  ].join(" ")}
                >
                  {v}
                </span>
              ))}
            </div>
          </div>

          {/* Day-of-week header */}
          <div className="grid grid-cols-7 border-b border-white/10">
            {DOW.map((d) => (
              <div
                key={d}
                className="border-r border-white/10 py-1.5 text-center text-[9px] font-bold uppercase tracking-wider text-white/40 last:border-r-0"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Row 1 — cells 0–6 */}
          <div className="grid grid-cols-7">
            {ROW1.map((cell, i) => (
              <MockDay
                key={cell.day + "-r1"}
                {...cell}
                chips={[...cell.chips]}
                cellIndex={i}
                inView={inView}
                prefersReduced={prefersReduced}
              />
            ))}
          </div>

          {/* Row 2 — cells 7–13 */}
          <div className="grid grid-cols-7">
            {ROW2.map((cell, i) => (
              <MockDay
                key={cell.day + "-r2"}
                {...cell}
                chips={[...cell.chips]}
                cellIndex={7 + i}
                inView={inView}
                prefersReduced={prefersReduced}
              />
            ))}
          </div>
        </motion.div>

        {/* Feature highlights — appear after chips */}
        <motion.div
          className="mt-8 grid gap-4 md:grid-cols-3"
          variants={fadeUp}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          transition={
            transition ?? { ...spring.smooth, delay: CHIP_DELAY + 0.1 }
          }
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
          transition={
            transition ?? { ...spring.smooth, delay: CHIP_DELAY + 0.25 }
          }
        >
          <Link
            href="/calendar"
            className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-6 py-2.5 text-[14px] font-semibold text-amber-300 transition-colors hover:bg-amber-500/20 hover:text-amber-200"
          >
            Log in to view →
          </Link>
        </motion.div>
      </div>
    </Section>
  );
}
