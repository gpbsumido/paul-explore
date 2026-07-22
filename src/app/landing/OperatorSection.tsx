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

const STORES = [
  { name: "Lobby Fridge", status: "online", health: 82, alerts: 0 },
  { name: "Break Room Cooler", status: "degraded", health: 45, alerts: 3 },
  { name: "Cafeteria Unit A", status: "online", health: 91, alerts: 0 },
  { name: "Floor 2 Snacks", status: "online", health: 76, alerts: 1 },
] as const;

const STATUS_COLOR: Record<string, string> = {
  online: "#22c55e",
  degraded: "#f59e0b",
  offline: "#ef4444",
};

const HIGHLIGHTS = [
  [
    "Fleet at a glance",
    "Store cards with live status dots, inventory health bars, and alert counts — see everything without clicking in.",
  ],
  [
    "Alert management",
    "Temperature warnings, low-stock flags, and sensor issues surfaced with severity badges. Dismiss with optimistic UI.",
  ],
  [
    "Deep drill-down",
    "Per-store tabs for inventory, alerts, activity log, and planogram — each with real-time polling and inline actions.",
  ],
] as const;

export default function OperatorSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });
  const prefersReduced = useReducedMotion();
  const transition = prefersReduced ? instantTransition : undefined;

  return (
    <Section glow="radial-gradient(ellipse at 75% 50%, color-mix(in srgb, var(--color-feature-operator) 6%, transparent) 0%, transparent 60%)">
      <div ref={ref}>
        <m.h2
          className="text-center text-3xl font-bold tracking-tight text-foreground md:text-4xl"
          variants={headingWipe}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          transition={transition ?? { ...spring.smooth }}
        >
          Fleet Operator
        </m.h2>

        <m.p
          className="mx-auto mt-3 max-w-lg text-center text-foreground/70"
          variants={fadeUp}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          transition={transition ?? { ...spring.smooth, delay: 0.1 }}
        >
          Real-time fleet monitoring for micro-retail stores. Live status,
          alerts, inventory health, and per-store drill-down — all demo data, no
          external dependencies.
        </m.p>

        {/* Mock fleet dashboard */}
        <m.div
          className="mt-10 overflow-hidden rounded-xl border border-foreground/10 bg-foreground/5 shadow-xl backdrop-blur-sm"
          variants={fadeUp}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          transition={transition ?? { ...spring.smooth, delay: 0.15 }}
        >
          {/* Mock header */}
          <div className="flex items-center gap-3 border-b border-foreground/10 px-4 py-2.5">
            <div className="h-2 w-2 rounded-full bg-violet-400" />
            <span className="text-[11px] font-black uppercase tracking-[0.15em] text-foreground/80">
              Fleet Overview
            </span>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[9px] tabular-nums text-foreground/30">
                4 stores
              </span>
            </div>
          </div>

          {/* Store cards */}
          <div className="divide-y divide-foreground/5">
            {STORES.map((store) => (
              <div
                key={store.name}
                className="flex items-center gap-3 px-4 py-2.5"
              >
                <div
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: STATUS_COLOR[store.status] }}
                />
                <span className="flex-1 truncate text-[11px] text-foreground/70">
                  {store.name}
                </span>
                <div className="h-1.5 w-12 overflow-hidden rounded-full bg-foreground/10">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${store.health}%`,
                      backgroundColor:
                        store.health > 60 ? "#22c55e" : "#f59e0b",
                    }}
                  />
                </div>
                <span className="w-7 shrink-0 text-right tabular-nums text-[9px] text-foreground/40">
                  {store.health}%
                </span>
                {store.alerts > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500/20 px-1 text-[8px] font-bold tabular-nums text-amber-400">
                    {store.alerts}
                  </span>
                )}
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
            href="/operator"
            className="inline-flex items-center gap-2 rounded-full border dark:border-violet-400/30 border-violet-600/40 bg-violet-500/10 px-6 py-2.5 text-[14px] font-semibold dark:text-violet-300 text-violet-700 transition-colors hover:bg-violet-500/20 dark:hover:text-violet-200 hover:text-violet-800"
          >
            Explore fleet →
          </Link>
        </m.div>
      </div>
    </Section>
  );
}
