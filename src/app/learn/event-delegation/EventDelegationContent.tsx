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
// Event bubbling visualizer
// ---------------------------------------------------------------------------

const DOM_LAYERS = ["document", "body", "div", "ul", "li"] as const;

function BubblingDemo() {
  const [activeLayers, setActiveLayers] = useState<Set<number>>(new Set());
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const triggerBubble = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    setActiveLayers(new Set());

    const innerIdx = DOM_LAYERS.length - 1;
    for (let i = innerIdx; i >= 0; i--) {
      const delay = (innerIdx - i) * 120;
      const layer = i;
      const t = setTimeout(() => {
        setActiveLayers((prev) => new Set([...prev, layer]));
      }, delay);
      timeoutsRef.current.push(t);
    }

    const clearT = setTimeout(
      () => {
        setActiveLayers(new Set());
      },
      innerIdx * 120 + 800,
    );
    timeoutsRef.current.push(clearT);
  }, []);

  return (
    <div
      className="cursor-pointer select-none"
      onClick={triggerBubble}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") triggerBubble();
      }}
    >
      {DOM_LAYERS.reduce<React.ReactNode>((children, label, i) => {
        const isActive = activeLayers.has(i);
        const isInnermost = i === DOM_LAYERS.length - 1;
        return (
          <motion.div
            key={label}
            className={[
              "rounded-sm border p-3 transition-colors sm:p-4",
              isActive
                ? "border-foreground/30 bg-foreground/10"
                : "border-foreground/10",
            ].join(" ")}
            animate={
              isActive
                ? { borderColor: "var(--foreground-30)" }
                : { borderColor: "var(--foreground-10)" }
            }
            transition={hoverSpring}
          >
            <div className="mb-1 flex items-baseline justify-between">
              <span className="font-mono text-[11px] text-muted">
                &lt;{label}&gt;
              </span>
              <AnimatePresence>
                {isActive && (
                  <motion.span
                    className="font-mono text-[11px] text-muted"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.1 }}
                  >
                    event received!
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            {isInnermost ? (
              <p className="py-2 text-center font-mono text-[11px] text-muted/40">
                click anywhere
              </p>
            ) : (
              children
            )}
          </motion.div>
        );
      }, null as React.ReactNode)}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Side-by-side cost comparison
// ---------------------------------------------------------------------------

function CostComparisonDemo() {
  const [flashIdx50, setFlashIdx50] = useState<number | null>(null);
  const [flashIdx1, setFlashIdx1] = useState<number | null>(null);

  const flashItem = useCallback(
    (setter: (v: number | null) => void, idx: number) => {
      setter(idx);
      setTimeout(() => setter(null), 400);
    },
    [],
  );

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {/* 50 handlers */}
      <div>
        <span className="text-[11px] uppercase tracking-[0.2em] text-muted/40">
          50 handlers
        </span>
        <div className="mt-2 max-h-52 overflow-y-auto border border-foreground/10 rounded-sm">
          {Array.from({ length: 50 }, (_, i) => (
            <button
              key={i}
              onClick={() => flashItem(setFlashIdx50, i)}
              className={[
                "block w-full border-b border-foreground/5 px-3 py-1.5 text-left font-mono text-[12px] transition-colors last:border-b-0",
                flashIdx50 === i
                  ? "bg-foreground/10 text-foreground"
                  : "text-muted hover:bg-foreground/[0.03]",
              ].join(" ")}
            >
              {String(i + 1).padStart(2, "0")}
            </button>
          ))}
        </div>
        <p className="mt-2 font-mono text-[11px] text-muted/40">handlers: 50</p>
      </div>

      {/* 1 handler */}
      <div>
        <span className="text-[11px] uppercase tracking-[0.2em] text-muted/40">
          1 handler
        </span>
        <div
          className="mt-2 max-h-52 overflow-y-auto border border-foreground/10 rounded-sm"
          onClick={(e) => {
            const target = e.target as HTMLElement;
            const idx = target.dataset.idx;
            if (idx != null) flashItem(setFlashIdx1, Number(idx));
          }}
        >
          {Array.from({ length: 50 }, (_, i) => (
            <div
              key={i}
              data-idx={i}
              className={[
                "cursor-pointer border-b border-foreground/5 px-3 py-1.5 font-mono text-[12px] transition-colors last:border-b-0",
                flashIdx1 === i
                  ? "bg-foreground/10 text-foreground"
                  : "text-muted hover:bg-foreground/[0.03]",
              ].join(" ")}
            >
              {String(i + 1).padStart(2, "0")}
            </div>
          ))}
        </div>
        <p className="mt-2 font-mono text-[11px] text-muted/40">handlers: 1</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dynamic list demo
// ---------------------------------------------------------------------------

function DynamicListDemo() {
  const [items, setItems] = useState<number[]>([1, 2, 3]);
  const [addedCount, setAddedCount] = useState(0);
  const [flashId, setFlashId] = useState<number | null>(null);
  const nextId = useRef(4);

  const addItem = useCallback(() => {
    const id = nextId.current++;
    setItems((prev) => [...prev, id]);
    setAddedCount((c) => c + 1);
  }, []);

  const removeItem = useCallback(() => {
    setItems((prev) => (prev.length > 0 ? prev.slice(0, -1) : prev));
  }, []);

  const handleListClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const id = target.dataset.itemId;
    if (id != null) {
      setFlashId(Number(id));
      setTimeout(() => setFlashId(null), 400);
    }
  }, []);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <Pill onClick={addItem}>Add item</Pill>
        <Pill onClick={removeItem}>Remove</Pill>
        <span className="ml-2 font-mono text-[11px] text-muted/40">
          Items added after load: {addedCount}
        </span>
      </div>

      <div className="mt-4 min-h-[2.5rem]" onClick={handleListClick}>
        <AnimatePresence>
          {items.map((id) => (
            <motion.div
              key={id}
              data-item-id={id}
              className={[
                "cursor-pointer border-b border-foreground/5 px-3 py-2 font-mono text-[12px] transition-colors",
                flashId === id
                  ? "bg-foreground/10 text-foreground"
                  : "text-muted hover:bg-foreground/[0.03]",
              ].join(" ")}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0 }}
              transition={hoverSpring}
            >
              Item {id}
              {id > 3 && (
                <span className="ml-2 text-[10px] text-muted/30">
                  added dynamically
                </span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main content
// ---------------------------------------------------------------------------

export default function EventDelegationContent() {
  const prefersReduced = useHubReducedMotion();
  const t = prefersReduced ? instantTransition : spring.smooth;

  return (
    <div className="min-h-dvh bg-background">
      <PageHeader
        breadcrumbs={[
          { label: "Learn", href: "/learn" },
          { label: "Event Delegation" },
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
              Event Delegation
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              Instead of attaching a handler to every child, attach one to the
              parent and let events bubble up. Fewer listeners, same behavior,
              and it works for elements that don&apos;t exist yet.
            </p>
          </Section>

          {/* ----------------------------------------------------------- */}
          {/* 2. Event bubbling visualizer                                 */}
          {/* ----------------------------------------------------------- */}
          <Section className="mt-14" transition={t}>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted/40">
              Event bubbling
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-muted">
              Click anywhere in the nested boxes. The event starts at the
              innermost element and ripples outward through every ancestor.
              That&apos;s bubbling &mdash; and it&apos;s why delegation works.
            </p>
            <div className="mt-6">
              <BubblingDemo />
            </div>
          </Section>

          {/* ----------------------------------------------------------- */}
          {/* 3. Side-by-side cost comparison                              */}
          {/* ----------------------------------------------------------- */}
          <Section className="mt-14" transition={t}>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted/40">
              Cost comparison
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-muted">
              Both lists behave identically. Click any item &mdash; it flashes.
              The difference is invisible to the user but real in memory: 50
              handlers vs 1. With 10,000 items the gap is dramatic.
            </p>
            <div className="mt-6">
              <CostComparisonDemo />
            </div>
          </Section>

          {/* ----------------------------------------------------------- */}
          {/* 4. Dynamic list demo                                         */}
          {/* ----------------------------------------------------------- */}
          <Section className="mt-14" transition={t}>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted/40">
              Dynamic elements
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-muted">
              Add items after the page loads. A single parent handler catches
              clicks on elements that didn&apos;t exist when the handler was
              attached. No re-binding needed.
            </p>
            <div className="mt-6">
              <DynamicListDemo />
            </div>
          </Section>

          {/* ----------------------------------------------------------- */}
          {/* 5. Capture vs bubble                                         */}
          {/* ----------------------------------------------------------- */}
          <Section className="mt-14" transition={t}>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted/40">
              Capture vs bubble
            </h2>
            <div className="mt-4 flex justify-center">
              <svg
                viewBox="0 0 200 180"
                className="w-full"
                style={{ maxWidth: 240 }}
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                {/* Boxes */}
                {["document", "body", "div"].map((label, i) => {
                  const y = 10 + i * 52;
                  return (
                    <g key={label}>
                      <rect
                        x={50}
                        y={y}
                        width={100}
                        height={36}
                        rx={2}
                        strokeWidth={1}
                        strokeOpacity={0.15}
                        fill="currentColor"
                        fillOpacity={0.02}
                      />
                      <text
                        x={100}
                        y={y + 22}
                        textAnchor="middle"
                        fontSize="9"
                        fontFamily="var(--font-mono, monospace)"
                        fill="currentColor"
                        stroke="none"
                        opacity={0.4}
                      >
                        {label}
                      </text>
                    </g>
                  );
                })}

                {/* Capture arrows (left side, downward) */}
                <line
                  x1={30}
                  y1={20}
                  x2={30}
                  y2={140}
                  strokeWidth={1.5}
                  strokeOpacity={0.15}
                />
                <polyline
                  points="27,134 30,142 33,134"
                  strokeWidth={1.5}
                  strokeOpacity={0.15}
                />
                <text
                  x={30}
                  y={160}
                  textAnchor="middle"
                  fontSize="7"
                  fontFamily="var(--font-mono, monospace)"
                  fill="currentColor"
                  stroke="none"
                  opacity={0.25}
                >
                  capture
                </text>

                {/* Bubble arrows (right side, upward) */}
                <line
                  x1={170}
                  y1={140}
                  x2={170}
                  y2={20}
                  strokeWidth={1.5}
                  strokeOpacity={0.15}
                />
                <polyline
                  points="167,26 170,18 173,26"
                  strokeWidth={1.5}
                  strokeOpacity={0.15}
                />
                <text
                  x={170}
                  y={160}
                  textAnchor="middle"
                  fontSize="7"
                  fontFamily="var(--font-mono, monospace)"
                  fill="currentColor"
                  stroke="none"
                  opacity={0.25}
                >
                  bubble
                </text>

                {/* Phase labels */}
                <text
                  x={30}
                  y={170}
                  textAnchor="middle"
                  fontSize="6"
                  fontFamily="var(--font-mono, monospace)"
                  fill="currentColor"
                  stroke="none"
                  opacity={0.2}
                >
                  (phase 1)
                </text>
                <text
                  x={170}
                  y={170}
                  textAnchor="middle"
                  fontSize="6"
                  fontFamily="var(--font-mono, monospace)"
                  fill="currentColor"
                  stroke="none"
                  opacity={0.2}
                >
                  (phase 3)
                </text>
              </svg>
            </div>

            <div className="mt-4 border-l-2 border-foreground/10 pl-4">
              <p className="text-[14px] leading-relaxed text-muted">
                Most people only need to know bubble exists and capture is
                opt-in. Events go down (capture), hit the target, then go back
                up (bubble). Delegation listens during the bubble phase by
                default.
              </p>
            </div>
          </Section>

          {/* ----------------------------------------------------------- */}
          {/* 6. Code section                                              */}
          {/* ----------------------------------------------------------- */}
          <Section className="mt-14" transition={t}>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted/40">
              The pattern
            </h2>

            <p className="mt-4 font-mono text-[12px] text-muted/40">
              Event delegation in vanilla JS
            </p>
            <pre className="mt-2 overflow-x-auto border-l-2 border-foreground/10 bg-foreground/[0.02] py-4 pl-4 pr-3 font-mono text-[13px] leading-relaxed">
              <span className="text-foreground/70">const</span> list =
              document.querySelector(
              <span className="text-foreground/50">&apos;.item-list&apos;</span>
              ){"\n\n"}
              list.addEventListener(
              <span className="text-foreground/50">&apos;click&apos;</span>, (e)
              {"=> {\n"}
              {"  "}
              <span className="text-foreground/70">const</span> item =
              e.target.closest(
              <span className="text-foreground/50">&apos;.item&apos;</span>)
              {"\n"}
              {"  "}
              <span className="text-foreground/70">if</span> (!item){" "}
              <span className="text-foreground/70">return</span>
              {"\n\n"}
              {"  "}
              <span className="text-foreground/25">
                {"// item is the clicked element"}
              </span>
              {"\n"}
              {"  "}handleItemClick(item){"\n"}
              {"}"})
            </pre>

            <div className="mt-4 border-l-2 border-foreground/10 pl-4">
              <p className="text-[13px] leading-relaxed text-muted">
                In React, synthetic events already delegate to the root. You
                rarely need manual delegation &mdash; but understanding bubbling
                is still essential for{" "}
                <span className="font-mono text-foreground/70">
                  stopPropagation
                </span>
                , portals, and debugging event order.
              </p>
            </div>
          </Section>

          {/* ----------------------------------------------------------- */}
          {/* 7. Spot this pattern                                         */}
          {/* ----------------------------------------------------------- */}
          <Section className="mt-14" transition={t}>
            <div className="border-l-2 border-foreground/15 pl-4">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted/40">
                Spot this pattern
              </h3>
              <ul className="mt-3 space-y-1.5 text-[13px] text-muted">
                <li>Dynamic child elements added/removed at runtime</li>
                <li>Large lists where per-item handlers waste memory</li>
                <li>Shared click/hover behavior across siblings</li>
                <li>
                  Vanilla JS apps without a framework handling delegation for
                  you
                </li>
              </ul>
              <p className="mt-3 font-mono text-[13px] text-muted/60">
                O(1) listeners instead of O(n)
              </p>
            </div>
          </Section>

          {/* ----------------------------------------------------------- */}
          {/* 8. Bottom nav                                                */}
          {/* ----------------------------------------------------------- */}
          <nav className="mt-16 flex items-center border-t border-foreground/5 pt-6">
            <Link
              href="/learn/memoization"
              className="font-mono text-[13px] text-muted transition-colors hover:text-foreground"
            >
              &larr; Memoization
            </Link>
            <Link
              href="/learn/async-patterns"
              className="ml-auto font-mono text-[13px] text-muted transition-colors hover:text-foreground"
            >
              Async Patterns &rarr;
            </Link>
          </nav>
        </div>
      </main>
    </div>
  );
}
