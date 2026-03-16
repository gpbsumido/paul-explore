"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
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

const MOCK_CARDS = [
  { name: "Charizard", color: "from-orange-500 to-red-600" },
  { name: "Pikachu",   color: "from-yellow-400 to-amber-500" },
  { name: "Mewtwo",    color: "from-purple-500 to-violet-700" },
  { name: "Blastoise", color: "from-blue-500 to-cyan-600" },
  { name: "Gengar",    color: "from-purple-700 to-indigo-800" },
  { name: "Eevee",     color: "from-amber-400 to-orange-400" },
];

const TYPE_PILLS = ["Fire", "Water", "Grass", "Lightning", "Psychic"];

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

// The 0.2s head start: browser frame fades in at delay 0, cards start at delay 0.2.
const CARD_DEAL_OFFSET = 0.2;

export default function TcgSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });
  const prefersReduced = useReducedMotion();
  const transition = prefersReduced ? instantTransition : undefined;

  return (
    <Section
      className="bg-gradient-to-br from-neutral-900 to-red-950"
      glow="radial-gradient(ellipse at 80% 50%, color-mix(in srgb, var(--color-feature-tcg) 5%, transparent) 0%, transparent 60%)"
    >
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

        {/* Mock browser UI — fades in first to give cards a surface to land on */}
        <motion.div
          className="mt-10 overflow-hidden rounded-xl border border-white/10 bg-white/5 shadow-xl backdrop-blur-sm"
          variants={fadeUp}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          transition={transition ?? { ...spring.smooth, delay: 0 }}
        >
          {/* Mock filter bar */}
          <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
            <div className="h-7 w-36 shrink-0 rounded-md bg-white/10" />
            <div className="h-4 w-px shrink-0 bg-white/20" />
            <div className="flex gap-2 overflow-hidden">
              {TYPE_PILLS.map((t) => (
                <span
                  key={t}
                  className={`shrink-0 rounded-md px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${
                    t === "Fire"
                      ? "border border-red-500/30 bg-red-500/30 text-red-300"
                      : "border border-white/10 text-white/40"
                  }`}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Mock card grid — each card deals from the same point above */}
          <div className="grid grid-cols-3 gap-2 p-4 sm:grid-cols-6">
            {MOCK_CARDS.map((card, i) => (
              <motion.div
                key={card.name}
                className="overflow-hidden rounded-lg border border-white/10"
                initial={prefersReduced ? { opacity: 0 } : {
                  y: -60,
                  rotate: (i % 3 - 1) * 18,
                  scale: 0.5,
                  opacity: 0,
                }}
                animate={inView
                  ? { y: 0, rotate: 0, scale: 1, opacity: 1 }
                  : undefined
                }
                transition={prefersReduced
                  ? { ...instantTransition }
                  : { ...spring.bounce, delay: CARD_DEAL_OFFSET + i * 0.06 }
                }
              >
                <div
                  className={`bg-gradient-to-br ${card.color} flex items-end justify-start p-2`}
                  style={{ aspectRatio: "2.5/3.5" }}
                >
                  <span className="rounded bg-black/30 px-1 text-[9px] font-bold text-white">
                    {card.name}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
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
              <p className="mt-1 text-[13px] leading-relaxed text-white/60">{d}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </Section>
  );
}
