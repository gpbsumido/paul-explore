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

const TcgSectionCanvas = dynamic(() => import("./models/TcgSectionCanvas"), {
  ssr: false,
});

const HIGHLIGHTS = [
  [
    "Infinite Scroll",
    "IntersectionObserver sentinel loads next pages as you scroll — reconnects after each fetch so wide viewports never stall.",
  ],
  [
    "URL-Synced State",
    "Search, type filter, and page number live in the URL. Shareable, bookmarkable, and back/forward navigable.",
  ],
  [
    "Server / Client Split",
    "Set metadata fetched server-side via TCGdex SDK. Paginated card grids are client components with Suspense boundaries.",
  ],
] as const;

export default function TcgSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });
  const prefersReduced = useReducedMotion();
  const transition = prefersReduced ? instantTransition : undefined;

  return (
    <Section glow="radial-gradient(ellipse at 80% 50%, color-mix(in srgb, var(--color-feature-tcg) 5%, transparent) 0%, transparent 60%)">
      <div ref={ref}>
        <motion.h2
          className="text-center text-3xl font-bold tracking-tight text-white md:text-4xl"
          variants={headingWipe}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          transition={transition ?? { ...spring.smooth }}
        >
          Pokémon TCG Browser
        </motion.h2>

        <motion.p
          className="mx-auto mt-3 max-w-lg text-center text-white/70"
          variants={fadeUp}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          transition={transition ?? { ...spring.smooth, delay: 0.1 }}
        >
          Full card browser with infinite scroll, URL-synced filters, per-set
          grids, and deep card detail — built on the TCGdex SDK.
        </motion.p>

        {/* 3D card fan — hover a featured card to lift it and reveal the tooltip */}
        <motion.div
          className="mt-10"
          variants={fadeUp}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          transition={transition ?? { ...spring.smooth, delay: 0.15 }}
        >
          {/* Max-width constrains the canvas so the fan isn't tiny inside
              a 1000px-wide ultra-widescreen canvas. */}
          <ModelLazyMount
            style={{ height: "320px", maxWidth: "580px", margin: "0 auto" }}
          >
            <TcgSectionCanvas />
          </ModelLazyMount>
        </motion.div>

        {/* Feature highlights */}
        <motion.div
          className="mt-8 grid gap-4 md:grid-cols-3"
          variants={fadeUp}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          transition={transition ?? { ...spring.smooth, delay: 0.35 }}
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
          transition={transition ?? { ...spring.smooth, delay: 0.5 }}
        >
          <Link
            href="/tcg/pokemon"
            className="inline-flex items-center gap-2 rounded-full border border-rose-400/30 bg-rose-500/10 px-6 py-2.5 text-[14px] font-semibold text-rose-300 transition-colors hover:bg-rose-500/20 hover:text-rose-200"
          >
            Browse Pokémon TCG →
          </Link>
        </motion.div>
      </div>
    </Section>
  );
}
