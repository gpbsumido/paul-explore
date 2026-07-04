"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import { spring, fadeInUp, instantTransition } from "@/lib/animations";
import { useHubReducedMotion } from "@/app/providers";

// ---------------------------------------------------------------------------
// Shared config
// ---------------------------------------------------------------------------

const hoverSpring = { type: "spring" as const, stiffness: 180, damping: 22 };

// ---------------------------------------------------------------------------
// Shared components
// ---------------------------------------------------------------------------

function Pill({
  onClick,
  active,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "rounded-full border px-3 py-1 font-mono text-xs transition-colors",
        active
          ? "border-foreground/20 bg-foreground/5 text-foreground"
          : "border-foreground/10 text-muted hover:border-foreground/20 hover:text-foreground",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function Section({
  children,
  className = "",
  transition,
}: {
  children: React.ReactNode;
  className?: string;
  transition: typeof spring.smooth | typeof instantTransition;
}) {
  return (
    <motion.section
      className={className}
      variants={fadeInUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      transition={transition}
    >
      {children}
    </motion.section>
  );
}

// ---------------------------------------------------------------------------
// Timeline row (single horizontal line with dots)
// ---------------------------------------------------------------------------

function TimelineRow({
  label,
  dots,
  maxTime,
  flash,
}: {
  label: string;
  dots: number[];
  maxTime: number;
  flash?: boolean;
}) {
  return (
    <div>
      <span className="text-[11px] uppercase tracking-[0.2em] text-muted/40">
        {label}
      </span>
      <div className="relative mt-1 h-6 border-t border-foreground/10">
        <AnimatePresence>
          {dots.map((t) => (
            <motion.div
              key={t}
              className={[
                "absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground",
                flash ? "h-2.5 w-2.5" : "h-2 w-2",
              ].join(" ")}
              style={{ left: `${(t / maxTime) * 100}%` }}
              initial={{ scale: 0, opacity: flash ? 0.7 : 0.4 }}
              animate={{ scale: 1, opacity: 0.4 }}
              transition={
                flash
                  ? {
                      scale: hoverSpring,
                      opacity: { delay: 0.2, duration: 0.4 },
                    }
                  : hoverSpring
              }
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Live click timeline demo
// ---------------------------------------------------------------------------

function TimelineDemo() {
  const [rawDots, setRawDots] = useState<number[]>([]);
  const [debouncedDots, setDebouncedDots] = useState<number[]>([]);
  const [throttledDots, setThrottledDots] = useState<number[]>([]);
  const startedRef = useRef(false);
  const startRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastThrottleRef = useRef(-Infinity);

  const handleClick = useCallback(() => {
    const now = Date.now();
    if (!startedRef.current) {
      startRef.current = now;
      startedRef.current = true;
    }
    const t = now - startRef.current;

    setRawDots((prev) => [...prev, t]);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const fireT = Date.now() - startRef.current;
      setDebouncedDots((prev) => [...prev, fireT]);
    }, 300);

    if (t - lastThrottleRef.current >= 300) {
      setThrottledDots((prev) => [...prev, t]);
      lastThrottleRef.current = t;
    }
  }, []);

  const clear = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    startedRef.current = false;
    lastThrottleRef.current = -Infinity;
    setRawDots([]);
    setDebouncedDots([]);
    setThrottledDots([]);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const allDots = [...rawDots, ...debouncedDots, ...throttledDots];
  const maxTime = allDots.length > 0 ? Math.max(...allDots) + 600 : 3000;

  return (
    <div>
      <div className="flex gap-2">
        <Pill onClick={handleClick}>Click me rapidly</Pill>
        <Pill onClick={clear}>Clear</Pill>
      </div>

      <div className="mt-6 space-y-4">
        <TimelineRow label="Raw" dots={rawDots} maxTime={maxTime} />
        <TimelineRow
          label="Debounced (300ms)"
          dots={debouncedDots}
          maxTime={maxTime}
          flash
        />
        <TimelineRow
          label="Throttled (300ms)"
          dots={throttledDots}
          maxTime={maxTime}
          flash
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Annotated code line helpers
// ---------------------------------------------------------------------------

function CL({ children, note }: { children: React.ReactNode; note?: string }) {
  return (
    <div className="flex items-baseline">
      <span className="min-w-0 whitespace-pre">{children}</span>
      {note && (
        <span className="ml-auto hidden shrink-0 pl-6 text-[11px] text-muted sm:inline">
          {note}
        </span>
      )}
    </div>
  );
}

function Kw({ children }: { children: React.ReactNode }) {
  return <span className="text-foreground/70">{children}</span>;
}

// ---------------------------------------------------------------------------
// Main content
// ---------------------------------------------------------------------------

export default function DebounceThrottleContent() {
  const prefersReduced = useHubReducedMotion();
  const t = prefersReduced ? instantTransition : spring.smooth;

  return (
    <div className="min-h-dvh bg-background">
      <PageHeader
        breadcrumbs={[
          { label: "Learn", href: "/learn" },
          { label: "Debounce & Throttle" },
        ]}
        maxWidth="max-w-3xl"
      />

      <main className="relative mx-auto max-w-3xl px-4 py-12 sm:py-16">
        {/* Dot grid */}
        <div
          className="pointer-events-none absolute inset-0 text-foreground opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(currentColor 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
          aria-hidden
        />

        <div className="relative">
          {/* Top nav */}
          <Link
            href="/learn"
            className="mb-10 inline-flex items-center gap-1 font-mono text-[13px] text-muted transition-colors hover:text-foreground"
          >
            &larr; All topics
          </Link>

          {/* ----------------------------------------------------------- */}
          {/* 1. Core idea                                                 */}
          {/* ----------------------------------------------------------- */}
          <Section transition={t}>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Debounce &amp; Throttle
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              Debounce: wait until the user stops doing something, then fire
              once. Throttle: fire at most once every N milliseconds, no matter
              how often the event happens.
            </p>
          </Section>

          {/* ----------------------------------------------------------- */}
          {/* 2. Interactive timeline demo                                 */}
          {/* ----------------------------------------------------------- */}
          <Section className="mt-14" transition={t}>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted/40">
              Click timeline
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-muted">
              Click the button rapidly, then stop. Watch how the three timelines
              respond differently. Raw fires every time. Throttled fires at most
              once per 300ms. Debounced waits until you stop.
            </p>
            <div className="mt-6">
              <TimelineDemo />
            </div>
          </Section>

          {/* ----------------------------------------------------------- */}
          {/* 3. Leading vs trailing edge                                  */}
          {/* ----------------------------------------------------------- */}
          <Section className="mt-14" transition={t}>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted/40">
              Leading vs trailing edge
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-muted">
              The &ldquo;edge&rdquo; is which end of the quiet period triggers
              the handler. Most debounce implementations default to trailing.
              Most throttle implementations default to leading.
            </p>

            <div className="mt-6 grid gap-8 sm:grid-cols-2">
              {/* Trailing edge */}
              <div>
                <p className="font-mono text-[12px] text-muted/40">
                  Trailing edge
                </p>
                <svg
                  viewBox="0 0 200 64"
                  className="mt-2 w-full"
                  style={{ maxWidth: 220 }}
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  {/* Events line */}
                  <line
                    x1={14}
                    y1={14}
                    x2={186}
                    y2={14}
                    strokeWidth={1}
                    strokeOpacity={0.08}
                  />
                  {/* Event dots */}
                  {[22, 42, 60, 84].map((x) => (
                    <circle
                      key={x}
                      cx={x}
                      cy={14}
                      r={3.5}
                      fill="currentColor"
                      fillOpacity={0.3}
                      strokeWidth={0}
                    />
                  ))}
                  {/* Bracket */}
                  <line
                    x1={84}
                    y1={28}
                    x2={84}
                    y2={34}
                    strokeWidth={1}
                    strokeOpacity={0.2}
                  />
                  <line
                    x1={84}
                    y1={31}
                    x2={152}
                    y2={31}
                    strokeWidth={1}
                    strokeOpacity={0.2}
                  />
                  <line
                    x1={152}
                    y1={28}
                    x2={152}
                    y2={34}
                    strokeWidth={1}
                    strokeOpacity={0.2}
                  />
                  <text
                    x={118}
                    y={28}
                    textAnchor="middle"
                    fontSize="7"
                    fontFamily="var(--font-mono, monospace)"
                    fill="currentColor"
                    stroke="none"
                    opacity={0.3}
                  >
                    300ms
                  </text>
                  {/* Handler line */}
                  <line
                    x1={14}
                    y1={50}
                    x2={186}
                    y2={50}
                    strokeWidth={1}
                    strokeOpacity={0.08}
                  />
                  {/* Handler dot */}
                  <circle
                    cx={152}
                    cy={50}
                    r={4}
                    fill="currentColor"
                    fillOpacity={0.5}
                    strokeWidth={0}
                  />
                </svg>
                <p className="mt-1 text-[11px] text-muted/40">
                  fires after silence
                </p>
              </div>

              {/* Leading edge */}
              <div>
                <p className="font-mono text-[12px] text-muted/40">
                  Leading edge
                </p>
                <svg
                  viewBox="0 0 200 64"
                  className="mt-2 w-full"
                  style={{ maxWidth: 220 }}
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  {/* Events line */}
                  <line
                    x1={14}
                    y1={14}
                    x2={186}
                    y2={14}
                    strokeWidth={1}
                    strokeOpacity={0.08}
                  />
                  {/* Event dots */}
                  {[22, 42, 60, 84].map((x) => (
                    <circle
                      key={x}
                      cx={x}
                      cy={14}
                      r={3.5}
                      fill="currentColor"
                      fillOpacity={0.3}
                      strokeWidth={0}
                    />
                  ))}
                  {/* Bracket */}
                  <line
                    x1={22}
                    y1={28}
                    x2={22}
                    y2={34}
                    strokeWidth={1}
                    strokeOpacity={0.2}
                  />
                  <line
                    x1={22}
                    y1={31}
                    x2={90}
                    y2={31}
                    strokeWidth={1}
                    strokeOpacity={0.2}
                  />
                  <line
                    x1={90}
                    y1={28}
                    x2={90}
                    y2={34}
                    strokeWidth={1}
                    strokeOpacity={0.2}
                  />
                  <text
                    x={56}
                    y={28}
                    textAnchor="middle"
                    fontSize="7"
                    fontFamily="var(--font-mono, monospace)"
                    fill="currentColor"
                    stroke="none"
                    opacity={0.3}
                  >
                    300ms
                  </text>
                  {/* Handler line */}
                  <line
                    x1={14}
                    y1={50}
                    x2={186}
                    y2={50}
                    strokeWidth={1}
                    strokeOpacity={0.08}
                  />
                  {/* Handler dot */}
                  <circle
                    cx={22}
                    cy={50}
                    r={4}
                    fill="currentColor"
                    fillOpacity={0.5}
                    strokeWidth={0}
                  />
                </svg>
                <p className="mt-1 text-[11px] text-muted/40">
                  fires immediately
                </p>
              </div>
            </div>
          </Section>

          {/* ----------------------------------------------------------- */}
          {/* 4. Build it from scratch                                     */}
          {/* ----------------------------------------------------------- */}
          <Section className="mt-14" transition={t}>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted/40">
              Build it from scratch
            </h2>

            <p className="mt-4 font-mono text-[12px] text-muted/40">debounce</p>
            <pre className="mt-2 overflow-x-auto border-l-2 border-foreground/10 bg-foreground/[0.02] py-4 pl-4 pr-3 font-mono text-[13px] leading-relaxed">
              <CL>
                <Kw>function</Kw> debounce(fn, ms) {"{"}
              </CL>
              <CL note="timer id">
                {"  "}
                <Kw>let</Kw> timeout
              </CL>
              <CL note="return wrapper">
                {"  "}
                <Kw>return</Kw> (...args) {"=> {"}
              </CL>
              <CL note="cancel pending">{"    "}clearTimeout(timeout)</CL>
              <CL>{"    "}timeout = setTimeout(</CL>
              <CL note="reschedule">
                {"      "}() {"=>"} fn(...args), ms
              </CL>
              <CL>{"    "})</CL>
              <CL>{"  }"}</CL>
              <CL>{"}"}</CL>
            </pre>

            <p className="mt-6 font-mono text-[12px] text-muted/40">throttle</p>
            <pre className="mt-2 overflow-x-auto border-l-2 border-foreground/10 bg-foreground/[0.02] py-4 pl-4 pr-3 font-mono text-[13px] leading-relaxed">
              <CL>
                <Kw>function</Kw> throttle(fn, ms) {"{"}
              </CL>
              <CL note="last fire time">
                {"  "}
                <Kw>let</Kw> last = 0
              </CL>
              <CL note="return wrapper">
                {"  "}
                <Kw>return</Kw> (...args) {"=> {"}
              </CL>
              <CL note="current time">
                {"    "}
                <Kw>const</Kw> now = Date.now()
              </CL>
              <CL note="enough time passed?">
                {"    "}
                <Kw>if</Kw> (now - last {">="} ms) {"{"}
              </CL>
              <CL note="fire + update">{"      "}last = now</CL>
              <CL>{"      "}fn(...args)</CL>
              <CL>{"    }"}</CL>
              <CL>{"  }"}</CL>
              <CL>{"}"}</CL>
            </pre>
          </Section>

          {/* ----------------------------------------------------------- */}
          {/* 5. Real use cases                                            */}
          {/* ----------------------------------------------------------- */}
          <Section className="mt-14" transition={t}>
            <div className="border-l-2 border-foreground/10 pl-4">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted/40">
                When to use which
              </h3>
              <ul className="mt-3 space-y-1.5 text-[13px] text-muted">
                <li>
                  Search input &mdash;{" "}
                  <span className="text-foreground">debounce</span>. Don&apos;t
                  query on every keystroke.
                </li>
                <li>
                  Window resize &mdash;{" "}
                  <span className="text-foreground">debounce</span>. Recalculate
                  layout once resizing stops.
                </li>
                <li>
                  Scroll tracking &mdash;{" "}
                  <span className="text-foreground">throttle</span>. Sample
                  position at fixed intervals.
                </li>
                <li>
                  Double-click prevention &mdash;{" "}
                  <span className="text-foreground">throttle (leading)</span>.
                  Fire immediately, lock out repeats.
                </li>
              </ul>
            </div>
          </Section>

          {/* ----------------------------------------------------------- */}
          {/* 6. Spot this pattern                                         */}
          {/* ----------------------------------------------------------- */}
          <Section className="mt-14" transition={t}>
            <div className="border-l-2 border-foreground/15 pl-4">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted/40">
                Spot this pattern
              </h3>
              <ul className="mt-3 space-y-1.5 text-[13px] text-muted">
                <li>
                  Input events that fire too often (keydown, mousemove, scroll)
                </li>
                <li>API calls triggered by user action</li>
                <li>Resize/scroll handlers doing expensive layout work</li>
                <li>Rate limiting any high-frequency callback</li>
              </ul>
              <p className="mt-3 font-mono text-[13px] text-muted/60">
                O(1) per call, O(1) space
              </p>
            </div>
          </Section>

          {/* ----------------------------------------------------------- */}
          {/* 7. Bottom nav                                                */}
          {/* ----------------------------------------------------------- */}
          <nav className="mt-16 flex items-center border-t border-foreground/5 pt-6">
            <Link
              href="/learn/dynamic-programming"
              className="font-mono text-[13px] text-muted transition-colors hover:text-foreground"
            >
              &larr; Dynamic Programming
            </Link>
            <Link
              href="/learn/memoization"
              className="ml-auto font-mono text-[13px] text-muted transition-colors hover:text-foreground"
            >
              Memoization &rarr;
            </Link>
          </nav>
        </div>
      </main>
    </div>
  );
}
