"use client";

import { useRef, useState, useEffect } from "react";
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

// ---------------------------------------------------------------------------
// Query string — keep it short so the typing feels snappy
// ---------------------------------------------------------------------------

const MOCK_QUERY = `query Pokédex {
  pokemon(
    limit: 6
  ) {
    id
    name
    types {
      type { name }
    }
  }
}`;

// Delay before results appear: every char takes 18 ms + 150 ms buffer
const RESULT_DELAY = MOCK_QUERY.length * 0.018 + 0.15;

// ---------------------------------------------------------------------------
// TypewriterQuery
// ---------------------------------------------------------------------------

/** Reveals `query` one character at a time at 18 ms/char when `inView` fires.
 *  Shows a blinking `|` cursor while typing; cursor disappears when done. */
function TypewriterQuery({
  query,
  inView,
  prefersReduced,
}: {
  query: string;
  inView: boolean;
  prefersReduced: boolean;
}) {
  const [count, setCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const done = count >= query.length;

  useEffect(() => {
    if (!inView) return;
    if (prefersReduced) {
      setCount(query.length);
      return;
    }
    intervalRef.current = setInterval(() => {
      setCount((prev) => {
        if (prev >= query.length) {
          clearInterval(intervalRef.current!);
          return prev;
        }
        return prev + 1;
      });
    }, 18);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [inView, query.length, prefersReduced]);

  return (
    <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-emerald-300 sm:text-xs">
      {query.slice(0, count)}
      {!done && (
        <motion.span
          animate={{ opacity: [1, 1, 0, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear", times: [0, 0.49, 0.5, 1] }}
          aria-hidden
        >
          |
        </motion.span>
      )}
    </pre>
  );
}

// ---------------------------------------------------------------------------
// Mock results
// ---------------------------------------------------------------------------

const MOCK_RESULTS = [
  { id: "001", name: "Bulbasaur",  type: "Grass",    color: "text-green-400"  },
  { id: "004", name: "Charmander", type: "Fire",     color: "text-orange-400" },
  { id: "007", name: "Squirtle",   type: "Water",    color: "text-blue-400"   },
  { id: "025", name: "Pikachu",    type: "Electric", color: "text-yellow-300" },
  { id: "039", name: "Jigglypuff", type: "Fairy",    color: "text-pink-400"   },
  { id: "054", name: "Psyduck",    type: "Water",    color: "text-blue-400"   },
] as const;

const HIGHLIGHTS = [
  [
    "GraphQL Queries",
    "Field selection means the card only fetches id, name, types, and two stats — not the full 40-field REST response.",
  ],
  [
    "No Apollo",
    "Plain fetch with a 10-line wrapper. Apollo earns its cost for normalized caches and subscriptions; for a browser it's just weight.",
  ],
  [
    "Live Query Inspector",
    "A collapsible panel shows the actual GraphQL query and variables as you search and filter — updates in real time.",
  ],
] as const;

// ---------------------------------------------------------------------------
// Section
// ---------------------------------------------------------------------------

export default function GraphQLSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });
  const prefersReduced = useReducedMotion() ?? false;
  const transition = prefersReduced ? instantTransition : undefined;

  return (
    <Section
      className="bg-gradient-to-br from-indigo-950 to-neutral-900"
      glow="radial-gradient(ellipse at 80% 50%, color-mix(in srgb, var(--color-feature-graphql) 5%, transparent) 0%, transparent 60%)"
    >
      <div ref={ref}>
        <motion.h2
          className="text-center text-3xl font-bold tracking-tight text-white md:text-4xl"
          variants={headingWipe}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          transition={transition ?? { ...spring.smooth }}
        >
          GraphQL Pokédex
        </motion.h2>

        <motion.p
          className="mx-auto mt-3 max-w-lg text-center text-white/70"
          variants={fadeUp}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          transition={transition ?? { ...spring.smooth, delay: 0.1 }}
        >
          Browse 1,000+ Pokémon via a Hasura GraphQL endpoint — typed queries,
          field selection, and a live query inspector. Plain fetch, no Apollo.
        </motion.p>

        {/* Mock query inspector — two-panel layout */}
        <motion.div
          className="mt-10 overflow-hidden rounded-xl border border-white/10 bg-white/5 shadow-xl backdrop-blur-sm"
          variants={fadeUp}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          transition={transition ?? { ...spring.smooth, delay: 0 }}
        >
          {/* Toolbar */}
          <div className="flex items-center gap-3 border-b border-white/10 px-4 py-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-indigo-400">
              Query
            </span>
            <div className="h-3.5 w-px bg-white/20" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-white/30">
              Variables
            </span>
            <div className="ml-auto flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-error-500/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-warning-500/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-success-500/70" />
            </div>
          </div>

          <div className="grid md:grid-cols-2">
            {/* Left: query editor */}
            <div className="border-b border-white/10 bg-black/30 p-4 md:border-b-0 md:border-r">
              <TypewriterQuery
                query={MOCK_QUERY}
                inView={inView}
                prefersReduced={prefersReduced}
              />
            </div>

            {/* Right: results — fade in after typing finishes */}
            <div className="p-4">
              <p className="mb-3 text-[9px] font-bold uppercase tracking-widest text-white/30">
                Results
              </p>
              <ul className="space-y-1.5">
                {MOCK_RESULTS.map((p, i) => (
                  <motion.li
                    key={p.id}
                    className="flex items-center gap-2 font-mono text-[11px] sm:text-xs"
                    initial={{ opacity: 0, x: 10 }}
                    animate={inView ? { opacity: 1, x: 0 } : undefined}
                    transition={
                      prefersReduced
                        ? { ...instantTransition }
                        : { ...spring.smooth, delay: RESULT_DELAY + i * 0.05 }
                    }
                  >
                    <span className="text-white/30">#{p.id}</span>
                    <span className="text-white/80">{p.name}</span>
                    <span className={`ml-auto ${p.color}`}>{p.type}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Feature highlights */}
        <motion.div
          className="mt-8 grid gap-4 md:grid-cols-3"
          variants={fadeUp}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          transition={transition ?? { ...spring.smooth, delay: RESULT_DELAY + MOCK_RESULTS.length * 0.05 + 0.1 }}
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
