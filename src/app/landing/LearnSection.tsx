"use client";

import { useRef } from "react";
import Link from "next/link";
import { m, useInView, useReducedMotion } from "framer-motion";
import Section from "./Section";
import {
  spring,
  instantTransition,
  headingWipe,
  fadeUp,
} from "@/lib/animations";

const TOPICS = [
  { num: "01", title: "Two Pointers", category: "algorithm" },
  { num: "02", title: "Sliding Window", category: "algorithm" },
  { num: "03", title: "Hash Maps & Sets", category: "algorithm" },
  { num: "05", title: "Binary Search", category: "algorithm" },
  { num: "08", title: "Dynamic Programming", category: "algorithm" },
  { num: "09", title: "Debounce & Throttle", category: "frontend" },
  { num: "10", title: "Memoization", category: "frontend" },
  { num: "13", title: "From Scratch", category: "frontend" },
] as const;

const HIGHLIGHTS = [
  [
    "Visual first, code second",
    "Each topic opens with an interactive demo you can step through. The visualization IS the explanation — code comes after you already understand the idea.",
  ],
  [
    "Not a reference doc",
    "These aren't cheat sheets. Each page builds intuition through a teaching sequence — one idea at a time, layering complexity as you scroll.",
  ],
  [
    "Interview-aware",
    'Every topic ends with a compact "spot this pattern" box: the problem signals that map to this technique, with complexity in monospace.',
  ],
] as const;

export default function LearnSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });
  const prefersReduced = useReducedMotion();
  const transition = prefersReduced ? instantTransition : undefined;

  return (
    <Section glow="radial-gradient(ellipse at 25% 50%, color-mix(in srgb, var(--color-feature-learn) 6%, transparent) 0%, transparent 60%)">
      <div ref={ref}>
        <m.h2
          className="text-center text-3xl font-bold tracking-tight text-foreground md:text-4xl"
          variants={headingWipe}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          transition={transition ?? { ...spring.smooth }}
        >
          Learn
        </m.h2>

        <m.p
          className="mx-auto mt-3 max-w-lg text-center text-foreground/70"
          variants={fadeUp}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          transition={transition ?? { ...spring.smooth, delay: 0.1 }}
        >
          Interactive deep-dives into algorithms and frontend patterns. 13
          topics, each with demos you can step through, visualizations that
          build intuition, and code that comes last.
        </m.p>

        {/* Mock topic list with dot-grid */}
        <m.div
          className="relative mt-10 overflow-hidden rounded-xl border border-foreground/10 bg-foreground/5 shadow-xl backdrop-blur-sm"
          variants={fadeUp}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          transition={transition ?? { ...spring.smooth, delay: 0.15 }}
        >
          {/* Dot-grid background */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "radial-gradient(currentColor 0.5px, transparent 0.5px)",
              backgroundSize: "12px 12px",
            }}
          />

          {/* Mock header */}
          <div className="relative flex items-center gap-3 border-b border-foreground/10 px-4 py-2.5">
            <div className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-[11px] font-black uppercase tracking-[0.15em] text-foreground/80">
              Topics
            </span>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[9px] tabular-nums text-foreground/30">
                13 deep-dives
              </span>
            </div>
          </div>

          {/* Topic rows */}
          <div className="relative divide-y divide-foreground/5">
            {TOPICS.map((topic) => (
              <div
                key={topic.num}
                className="flex items-baseline gap-3 px-4 py-2"
              >
                <span className="font-mono text-[9px] tabular-nums text-foreground/20">
                  {topic.num}
                </span>
                <span className="flex-1 text-[11px] text-foreground/60">
                  {topic.title}
                </span>
                <span className="text-[8px] uppercase tracking-wider text-foreground/20">
                  {topic.category === "algorithm" ? "algo" : "frontend"}
                </span>
              </div>
            ))}
          </div>
        </m.div>

        {/* Highlights */}
        <m.div
          className="mt-8 grid gap-4 md:grid-cols-3"
          variants={fadeUp}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          transition={transition ?? { ...spring.smooth, delay: 0.35 }}
        >
          {HIGHLIGHTS.map(([t, d]) => (
            <div
              key={t}
              className="rounded-lg border border-foreground/10 bg-foreground/5 p-4 backdrop-blur-sm"
            >
              <h4 className="text-[15px] font-semibold text-foreground">{t}</h4>
              <p className="mt-1 text-[13px] leading-relaxed text-foreground/60">
                {d}
              </p>
            </div>
          ))}
        </m.div>

        <m.div
          className="mt-8 flex justify-center"
          variants={fadeUp}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          transition={transition ?? { ...spring.smooth, delay: 0.5 }}
        >
          <Link
            href="/learn"
            className="inline-flex items-center gap-2 rounded-full border dark:border-emerald-400/30 border-emerald-600/40 bg-emerald-500/10 px-6 py-2.5 text-[14px] font-semibold dark:text-emerald-300 text-emerald-700 transition-colors hover:bg-emerald-500/20 dark:hover:text-emerald-200 hover:text-emerald-800"
          >
            Start learning →
          </Link>
        </m.div>
      </div>
    </Section>
  );
}
