"use client";

import { useState, useCallback, useRef } from "react";
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
// Fake compute results (deterministic)
// ---------------------------------------------------------------------------

const COMPUTE_RESULTS: Record<number, number> = { 1: 42, 2: 97, 3: 256 };

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
// Cache visualizer demo
// ---------------------------------------------------------------------------

type CacheEntry = { input: number; result: number };

function CacheVisualizerDemo() {
  const [cache, setCache] = useState<CacheEntry[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [computing, setComputing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [flashKey, setFlashKey] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);

  const compute = useCallback(
    (input: number) => {
      if (computing) return;

      const cached = cache.find((e) => e.input === input);
      if (cached) {
        setStatus(`Cache hit! compute(\`${input}\`) = \`${cached.result}\``);
        setFlashKey(input);
        setTimeout(() => setFlashKey(null), 600);
        return;
      }

      setStatus(`Cache miss \u2014 computing(\`${input}\`)...`);
      setComputing(true);
      setProgress(0);

      const start = Date.now();
      const duration = 1000;

      const tick = () => {
        const elapsed = Date.now() - start;
        const pct = Math.min(elapsed / duration, 1);
        setProgress(pct);
        if (pct < 1) {
          rafRef.current = requestAnimationFrame(tick);
        }
      };
      rafRef.current = requestAnimationFrame(tick);

      timerRef.current = setTimeout(() => {
        const result = COMPUTE_RESULTS[input];
        setCache((prev) => [...prev, { input, result }]);
        setStatus(`Done. compute(\`${input}\`) = \`${result}\`. Cached.`);
        setComputing(false);
        setProgress(0);
      }, duration);
    },
    [cache, computing],
  );

  const clearCache = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setCache([]);
    setStatus(null);
    setComputing(false);
    setProgress(0);
    setFlashKey(null);
  }, []);

  return (
    <div>
      {/* Compute buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {[1, 2, 3].map((n) => (
          <Pill key={n} onClick={() => compute(n)}>
            compute({n})
          </Pill>
        ))}
        <span className="mx-1 text-foreground/10">|</span>
        <Pill onClick={clearCache}>Clear cache</Pill>
      </div>

      {/* Progress bar */}
      {computing && (
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full border border-foreground/10">
          <motion.div
            className="h-full bg-foreground/10"
            style={{ width: `${progress * 100}%` }}
            transition={{ duration: 0 }}
          />
        </div>
      )}

      {/* Status */}
      <div className="mt-3 min-h-[1.5rem]">
        <AnimatePresence mode="wait">
          {status && (
            <motion.p
              key={status}
              className="text-[13px] leading-relaxed text-muted"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.12 }}
            >
              {status.split(/(`[^`]+`)/g).map((part, i) =>
                part.startsWith("`") && part.endsWith("`") ? (
                  <code key={i} className="font-mono text-foreground/70">
                    {part.slice(1, -1)}
                  </code>
                ) : (
                  <span key={i}>{part}</span>
                ),
              )}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Cache table */}
      {cache.length > 0 && (
        <div className="mt-4">
          <span className="text-[11px] uppercase tracking-[0.2em] text-muted/40">
            Cache
          </span>
          <div className="mt-2 inline-block min-w-[10rem]">
            {/* Header */}
            <div className="flex border-b border-foreground/10 pb-1 font-mono text-[11px] text-muted/40">
              <span className="w-16">Input</span>
              <span>Result</span>
            </div>
            {/* Rows */}
            <AnimatePresence>
              {cache.map((entry) => (
                <motion.div
                  key={entry.input}
                  className={[
                    "flex border-b border-foreground/10 py-1.5 font-mono text-[13px] transition-colors",
                    flashKey === entry.input ? "bg-foreground/10" : "",
                  ].join(" ")}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={hoverSpring}
                >
                  <span className="w-16 text-muted">{entry.input}</span>
                  <span className="text-foreground/70">{entry.result}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// React memo component tree demo
// ---------------------------------------------------------------------------

function ReactMemoDemo() {
  const [memoEnabled, setMemoEnabled] = useState(false);
  const [parentCount, setParentCount] = useState(0);
  const [childCounts, setChildCounts] = useState([0, 0, 0]);
  const [flashParent, setFlashParent] = useState(false);
  const [flashChildren, setFlashChildren] = useState([false, false, false]);

  const rerender = useCallback(() => {
    setParentCount((p) => p + 1);
    setFlashParent(true);
    setTimeout(() => setFlashParent(false), 400);

    if (!memoEnabled) {
      setChildCounts((prev) => prev.map((c) => c + 1));
      setFlashChildren([true, true, true]);
      setTimeout(() => setFlashChildren([false, false, false]), 400);
    }
  }, [memoEnabled]);

  const toggleMemo = useCallback((on: boolean) => {
    setMemoEnabled(on);
    setParentCount(0);
    setChildCounts([0, 0, 0]);
    setFlashParent(false);
    setFlashChildren([false, false, false]);
  }, []);

  const childLabels = ["List", "Form", "Chart"];

  return (
    <div>
      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Pill onClick={rerender}>Re-render parent</Pill>
        <span className="mx-1 text-foreground/10">|</span>
        <Pill onClick={() => toggleMemo(false)} active={!memoEnabled}>
          No memo
        </Pill>
        <Pill onClick={() => toggleMemo(true)} active={memoEnabled}>
          React.memo
        </Pill>
      </div>

      {/* Component tree */}
      <div className="flex flex-col items-center">
        {/* Parent */}
        <div
          className={[
            "flex items-center justify-center rounded-sm border px-6 py-3 font-mono text-[11px] transition-colors",
            flashParent
              ? "border-foreground/20 bg-foreground/10"
              : "border-foreground/10",
          ].join(" ")}
        >
          Parent &middot; renders: {parentCount}
        </div>

        {/* Connector lines */}
        <div className="flex items-start justify-center">
          <div className="h-6 w-px bg-foreground/10" />
        </div>
        <div className="flex w-full max-w-xs justify-between px-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="h-4 w-px bg-foreground/10" />
              <div
                className={[
                  "flex items-center justify-center rounded-sm border px-3 py-2 font-mono text-[11px] transition-colors",
                  flashChildren[i]
                    ? "border-foreground/20 bg-foreground/10"
                    : "border-foreground/10",
                ].join(" ")}
              >
                <div className="text-center">
                  <div className="text-muted/60">{childLabels[i]}</div>
                  <div className="mt-0.5">{childCounts[i]}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Explanation */}
      <p className="mt-4 text-[13px] leading-relaxed text-muted">
        {memoEnabled
          ? "With React.memo, children skip re-rendering when their props haven\u2019t changed. Only the parent count increments."
          : "Without memo, every parent re-render cascades to all children \u2014 even if their props are identical."}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main content
// ---------------------------------------------------------------------------

export default function MemoizationContent() {
  const prefersReduced = useHubReducedMotion();
  const t = prefersReduced ? instantTransition : spring.smooth;

  return (
    <div className="min-h-dvh bg-background">
      <PageHeader
        breadcrumbs={[
          { label: "Learn", href: "/learn" },
          { label: "Memoization" },
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
              Memoization
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              If a function always returns the same output for the same input,
              cache the result so you never compute it twice. That&apos;s
              memoization &mdash; trading memory for speed.
            </p>
          </Section>

          {/* ----------------------------------------------------------- */}
          {/* 2. Cache visualizer                                          */}
          {/* ----------------------------------------------------------- */}
          <Section className="mt-14" transition={t}>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted/40">
              Cache visualizer
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-muted">
              Click a compute button. The first call takes a full second. Click
              it again &mdash; instant. The cache remembers.
            </p>
            <div className="mt-6">
              <CacheVisualizerDemo />
            </div>
          </Section>

          {/* ----------------------------------------------------------- */}
          {/* 3. React.memo / useCallback                                  */}
          {/* ----------------------------------------------------------- */}
          <Section className="mt-14" transition={t}>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted/40">
              React.memo + useCallback
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-muted">
              Same idea, applied to components. React.memo skips re-rendering a
              child when its props haven&apos;t changed. useCallback keeps
              function references stable so memo can do its job.
            </p>
            <div className="mt-6">
              <ReactMemoDemo />
            </div>
          </Section>

          {/* ----------------------------------------------------------- */}
          {/* 4. Build it from scratch                                     */}
          {/* ----------------------------------------------------------- */}
          <Section className="mt-14" transition={t}>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted/40">
              Build it from scratch
            </h2>
            <p className="mt-4 font-mono text-[12px] text-muted/40">
              memoize()
            </p>
            <div className="mt-2 overflow-x-auto border-l-2 border-foreground/10 bg-foreground/[0.02] py-4 pl-4 pr-3 font-mono text-[13px] leading-relaxed">
              <CL>
                <Kw>function</Kw> memoize(fn) {"{"}
              </CL>
              <CL note="lookup table">
                {"  "}
                <Kw>const</Kw> cache = <Kw>new</Kw> Map()
              </CL>
              <CL note="return wrapper">
                {"  "}
                <Kw>return</Kw> (...args) {"=> {"}
              </CL>
              <CL note="derive cache key">
                {"    "}
                <Kw>const</Kw> key = JSON.stringify(args)
              </CL>
              <CL note="check cache">
                {"    "}
                <Kw>if</Kw> (cache.has(key)) <Kw>return</Kw> cache.get(key)
              </CL>
              <CL>{""}</CL>
              <CL note="compute + store">
                {"    "}
                <Kw>const</Kw> result = fn(...args)
              </CL>
              <CL>{"    "}cache.set(key, result)</CL>
              <CL>
                {"    "}
                <Kw>return</Kw> result
              </CL>
              <CL>{"  }"}</CL>
              <CL>{"}"}</CL>
            </div>
          </Section>

          {/* ----------------------------------------------------------- */}
          {/* 5. When NOT to memoize                                       */}
          {/* ----------------------------------------------------------- */}
          <Section className="mt-14" transition={t}>
            <div className="border-l-2 border-foreground/10 pl-4">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted/40">
                When not to memoize
              </h3>
              <ul className="mt-3 space-y-1.5 text-[13px] text-muted">
                <li>
                  Cheap computations &mdash; the cache overhead costs more than
                  recomputing.
                </li>
                <li>
                  Non-deterministic functions &mdash; if the output changes for
                  the same input, caching returns stale results.
                </li>
                <li>
                  Functions with side effects &mdash; the side effect needs to
                  run every time, not just once.
                </li>
                <li>
                  Primitives React already handles &mdash; string/number props
                  are compared by value; memo adds nothing.
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
                <li>Repeated expensive computations with the same inputs</li>
                <li>Preventing unnecessary re-renders in component trees</li>
                <li>Derived data in selectors (Redux, Zustand, Recoil)</li>
              </ul>
            </div>
          </Section>

          {/* ----------------------------------------------------------- */}
          {/* 7. Bottom nav                                                */}
          {/* ----------------------------------------------------------- */}
          <nav className="mt-16 flex items-center border-t border-foreground/5 pt-6">
            <Link
              href="/learn/debounce-throttle"
              className="font-mono text-[13px] text-muted transition-colors hover:text-foreground"
            >
              &larr; Debounce &amp; Throttle
            </Link>
            <Link
              href="/learn/event-delegation"
              className="ml-auto font-mono text-[13px] text-muted transition-colors hover:text-foreground"
            >
              Event Delegation &rarr;
            </Link>
          </nav>
        </div>
      </main>
    </div>
  );
}
