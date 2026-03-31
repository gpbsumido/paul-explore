"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import {
  motion,
  useInView,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import Section from "./Section";
import {
  slideInRight,
  spring,
  instantTransition,
  headingWipe,
  fadeUp,
} from "@/lib/animations";

// ---------------------------------------------------------------------------
// AnimatedStat — springs a number from 0 to its value when inView flips true.
// Parses decimal places from the source string so "28.4" stays "28.4".
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

  // Reduced motion: skip the count animation, just show the value instantly.
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
// Section
// ---------------------------------------------------------------------------

const ROWS = [
  { name: "Luka Doncic", team: "LAL", pts: "28.4", reb: "8.3", ast: "8.1" },
  { name: "Jayson Tatum", team: "BOS", pts: "27.0", reb: "8.5", ast: "4.6" },
  { name: "Shai Gilgeous", team: "OKC", pts: "31.2", reb: "5.5", ast: "6.0" },
  { name: "Nikola Jokic", team: "DEN", pts: "26.3", reb: "12.4", ast: "9.0" },
] as const;

const HIGHLIGHTS = [
  ["Live API Proxy", "Server-side proxy hides API keys from the client."],
  [
    "Batch Loading",
    "Multiple players fetched in parallel with loading states.",
  ],
  ["Error Handling", "Granular error recovery per player, not per page."],
] as const;

export default function NbaSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });
  const prefersReduced = useReducedMotion();
  const transition = prefersReduced ? instantTransition : undefined;

  return (
    <Section glow="radial-gradient(ellipse at 80% 50%, color-mix(in srgb, var(--color-feature-nba) 5%, transparent) 0%, transparent 60%)">
      <div ref={ref}>
        <motion.h2
          className="text-center text-3xl font-bold tracking-tight text-white md:text-4xl"
          variants={headingWipe}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          transition={transition ?? { ...spring.smooth }}
        >
          NBA Stats
        </motion.h2>

        <motion.p
          className="mx-auto mt-3 max-w-lg text-center text-white/70"
          variants={fadeUp}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          transition={transition ?? { ...spring.smooth, delay: 0.1 }}
        >
          Live player statistics proxied through the API layer with batch
          loading and error recovery.
        </motion.p>

        {/* mock table — container fades in, rows slide individually */}
        <motion.div
          className="mt-10 overflow-hidden rounded-xl border border-white/10 bg-white/10 shadow-xl backdrop-blur-sm"
          variants={fadeUp}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          transition={transition ?? { ...spring.smooth, delay: 0.15 }}
        >
          <div className="overflow-x-auto">
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

        {/* feature highlights */}
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
            href="/fantasy/nba/player/stats"
            className="inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-500/10 px-6 py-2.5 text-[14px] font-semibold text-yellow-300 transition-colors hover:bg-yellow-500/20 hover:text-yellow-200"
          >
            View NBA Stats →
          </Link>
        </motion.div>
      </div>
    </Section>
  );
}
