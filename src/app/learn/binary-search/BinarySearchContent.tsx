"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
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
// Classic binary search data & logic
// ---------------------------------------------------------------------------

const SORTED_ARRAY = [2, 5, 11, 15, 22, 28, 33, 40, 45, 51];
const TARGET_PRESETS = [11, 33, 50];

type BSearchStep = {
  left: number;
  right: number;
  mid: number;
  eliminated: number[];
  narration: string;
  found?: boolean;
};

function computeBSearchSteps(target: number): BSearchStep[] {
  const arr = SORTED_ARRAY;
  const steps: BSearchStep[] = [];
  const eliminated = new Set<number>();

  steps.push({
    left: 0,
    right: arr.length - 1,
    mid: -1,
    eliminated: [],
    narration: `Find \`${target}\` in the sorted array. left=\`0\`, right=\`${arr.length - 1}\`.`,
  });

  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const value = arr[mid];

    if (value === target) {
      steps.push({
        left,
        right,
        mid,
        eliminated: [...eliminated],
        narration: `mid=${mid}, value=\`${value}\` = target=\`${target}\` — found it!`,
        found: true,
      });
      return steps;
    }

    if (value < target) {
      for (let i = left; i <= mid; i++) eliminated.add(i);
      left = mid + 1;
      steps.push({
        left,
        right,
        mid,
        eliminated: [...eliminated],
        narration: `mid=${mid}, value=\`${value}\` < target=\`${target}\` — eliminate left half.`,
      });
    } else {
      for (let i = mid; i <= right; i++) eliminated.add(i);
      right = mid - 1;
      steps.push({
        left,
        right,
        mid,
        eliminated: [...eliminated],
        narration: `mid=${mid}, value=\`${value}\` > target=\`${target}\` — eliminate right half.`,
      });
    }
  }

  steps.push({
    left,
    right,
    mid: -1,
    eliminated: [...eliminated],
    narration: `left > right — \`${target}\` is not in the array.`,
    found: false,
  });

  return steps;
}

// ---------------------------------------------------------------------------
// Ship capacity data & logic
// ---------------------------------------------------------------------------

const PACKAGES = [3, 2, 5, 1, 4];
const DAYS_LIMIT = 2;
const MIN_CAP = Math.max(...PACKAGES);
const MAX_CAP = PACKAGES.reduce((a, b) => a + b, 0);
const CAP_RANGE = Array.from(
  { length: MAX_CAP - MIN_CAP + 1 },
  (_, i) => MIN_CAP + i,
);

type CapacityStep = {
  lo: number;
  hi: number;
  mid: number;
  canShip: boolean;
  daysNeeded: number;
  dayAssignments: number[][];
  eliminated: number[];
  narration: string;
  done?: boolean;
};

function computeDayAssignments(
  packages: number[],
  capacity: number,
): number[][] {
  const days: number[][] = [[]];
  let currentLoad = 0;

  for (const pkg of packages) {
    if (currentLoad + pkg > capacity) {
      days.push([pkg]);
      currentLoad = pkg;
    } else {
      days[days.length - 1].push(pkg);
      currentLoad += pkg;
    }
  }

  return days;
}

function computeCapacitySteps(): CapacityStep[] {
  const steps: CapacityStep[] = [];
  const eliminated = new Set<number>();

  let lo = MIN_CAP;
  let hi = MAX_CAP;

  steps.push({
    lo,
    hi,
    mid: -1,
    canShip: false,
    daysNeeded: 0,
    dayAssignments: [],
    eliminated: [],
    narration: `Ship \`[${PACKAGES.join(", ")}]\` in \`${DAYS_LIMIT}\` days. Capacity range: \`${lo}\` to \`${hi}\`.`,
  });

  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    const days = computeDayAssignments(PACKAGES, mid);
    const needed = days.length;
    const canShip = needed <= DAYS_LIMIT;

    if (canShip) {
      for (let c = mid + 1; c <= hi; c++) eliminated.add(c);
      hi = mid;
      steps.push({
        lo,
        hi,
        mid,
        canShip: true,
        daysNeeded: needed,
        dayAssignments: days,
        eliminated: [...eliminated],
        narration: `Capacity \`${mid}\`: \`${needed}\` days \u2264 \`${DAYS_LIMIT}\`. Works — try smaller, hi=\`${mid}\`.`,
      });
    } else {
      for (let c = lo; c <= mid; c++) eliminated.add(c);
      lo = mid + 1;
      steps.push({
        lo,
        hi,
        mid,
        canShip: false,
        daysNeeded: needed,
        dayAssignments: days,
        eliminated: [...eliminated],
        narration: `Capacity \`${mid}\`: \`${needed}\` days > \`${DAYS_LIMIT}\`. Too slow — lo=\`${lo}\`.`,
      });
    }
  }

  const finalDays = computeDayAssignments(PACKAGES, lo);
  steps.push({
    lo,
    hi: lo,
    mid: lo,
    canShip: true,
    daysNeeded: finalDays.length,
    dayAssignments: finalDays,
    eliminated: [...eliminated],
    narration: `lo = hi = \`${lo}\`. Minimum capacity: \`${lo}\`.`,
    done: true,
  });

  return steps;
}

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

function Narration({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`)/g);
  return (
    <p className="text-[13px] leading-relaxed text-muted">
      {parts.map((part, i) =>
        part.startsWith("`") && part.endsWith("`") ? (
          <code key={i} className="font-mono text-foreground/70">
            {part.slice(1, -1)}
          </code>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Cell center measurement hook
// ---------------------------------------------------------------------------

function useCellCenters(
  containerRef: React.RefObject<HTMLDivElement | null>,
  cellRefs: React.RefObject<(HTMLDivElement | null)[]>,
): number[] {
  const [centers, setCenters] = useState<number[]>([]);

  useEffect(() => {
    const update = () => {
      const container = containerRef.current;
      const cells = cellRefs.current;
      if (!container || !cells || cells.length === 0) return;

      const cr = container.getBoundingClientRect();
      setCenters(
        cells.map((cell) => {
          if (!cell) return 0;
          const r = cell.getBoundingClientRect();
          return r.left + r.width / 2 - cr.left;
        }),
      );
    };

    update();
    const observer = new ResizeObserver(update);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [containerRef, cellRefs]);

  return centers;
}

// ---------------------------------------------------------------------------
// Classic binary search demo
// ---------------------------------------------------------------------------

function ClassicSearchDemo() {
  const [target, setTarget] = useState(TARGET_PRESETS[0]);
  const [stepIdx, setStepIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef<(HTMLDivElement | null)[]>([]);

  const steps = useMemo(() => computeBSearchSteps(target), [target]);
  const step = steps[stepIdx];
  const cellCenters = useCellCenters(containerRef, cellRefs);

  const eliminatedSet = useMemo(
    () => new Set(step.eliminated),
    [step.eliminated],
  );

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setPlaying(false);
  }, []);

  const advance = useCallback(() => {
    setStepIdx((prev) => {
      if (prev >= steps.length - 1) {
        stop();
        return prev;
      }
      return prev + 1;
    });
  }, [steps.length, stop]);

  const play = useCallback(() => {
    if (stepIdx >= steps.length - 1) {
      setStepIdx(0);
    }
    setPlaying(true);
    intervalRef.current = setInterval(() => {
      setStepIdx((prev) => {
        if (prev >= steps.length - 1) {
          stop();
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
  }, [stepIdx, steps.length, stop]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const reset = useCallback(() => {
    stop();
    setStepIdx(0);
  }, [stop]);

  const handleTargetChange = useCallback(
    (newTarget: number) => {
      reset();
      setTarget(newTarget);
    },
    [reset],
  );

  const isLast = stepIdx >= steps.length - 1;
  const showPointers = step.left <= step.right;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-[11px] uppercase tracking-[0.2em] text-muted/40">
          Target
        </span>
        {TARGET_PRESETS.map((t) => (
          <Pill
            key={t}
            onClick={() => handleTargetChange(t)}
            active={target === t}
          >
            {t}
          </Pill>
        ))}
      </div>

      <div className="mb-2">
        <span className="font-mono text-[11px] text-muted/40">
          target = {target}
        </span>
      </div>

      <div className="py-4">
        <div
          ref={containerRef}
          className="relative flex items-center justify-center gap-0.5 sm:gap-1"
        >
          {SORTED_ARRAY.map((val, i) => {
            const isEliminated = eliminatedSet.has(i);
            const isMid = step.mid === i;
            const isFound = step.found === true && isMid;

            return (
              <motion.div
                key={i}
                ref={(el) => {
                  cellRefs.current[i] = el;
                }}
                className={[
                  "flex h-9 w-7 items-center justify-center rounded-sm border font-mono text-[10px] sm:h-10 sm:w-10 sm:text-xs",
                  isFound
                    ? "border-foreground/30 bg-foreground/15"
                    : isMid
                      ? "border-foreground/20 bg-foreground/15"
                      : "border-foreground/10",
                ].join(" ")}
                animate={{ opacity: isEliminated ? 0.15 : 1 }}
                transition={hoverSpring}
              >
                {val}
              </motion.div>
            );
          })}
        </div>

        {cellCenters.length > 0 && showPointers && (
          <div className="relative mt-1.5 h-5">
            <motion.span
              className="absolute top-0 -translate-x-1/2 font-mono text-[10px] text-foreground/50"
              initial={false}
              animate={{ left: cellCenters[step.left] ?? 0 }}
              transition={hoverSpring}
            >
              L
            </motion.span>
            {step.mid >= 0 && step.mid < SORTED_ARRAY.length && (
              <motion.span
                className="absolute top-0 -translate-x-1/2 font-mono text-[10px] text-foreground/50"
                initial={false}
                animate={{ left: cellCenters[step.mid] ?? 0 }}
                transition={hoverSpring}
              >
                mid
              </motion.span>
            )}
            <motion.span
              className="absolute top-0 -translate-x-1/2 font-mono text-[10px] text-foreground/50"
              initial={false}
              animate={{ left: cellCenters[step.right] ?? 0 }}
              transition={hoverSpring}
            >
              R
            </motion.span>
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center gap-2">
        {playing ? (
          <Pill onClick={stop}>Pause</Pill>
        ) : (
          <Pill onClick={play}>Play</Pill>
        )}
        <Pill onClick={advance}>Step</Pill>
        <Pill onClick={reset}>Reset</Pill>
        <span className="ml-auto font-mono text-[11px] text-muted/40">
          {stepIdx + 1}/{steps.length}
        </span>
      </div>

      <div className="mt-4 min-h-[2.5rem]">
        <AnimatePresence mode="wait">
          <motion.div
            key={stepIdx}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            <Narration text={step.narration} />
            {isLast && step.found !== undefined && (
              <p className="mt-1 font-mono text-[13px] font-semibold text-foreground/70">
                {step.found ? `found at index ${step.mid}` : "not found"}
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Ship capacity demo
// ---------------------------------------------------------------------------

function CapacityDemo() {
  const [stepIdx, setStepIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef<(HTMLDivElement | null)[]>([]);

  const steps = useMemo(() => computeCapacitySteps(), []);
  const step = steps[stepIdx];
  const cellCenters = useCellCenters(containerRef, cellRefs);

  const eliminatedSet = useMemo(
    () => new Set(step.eliminated),
    [step.eliminated],
  );

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setPlaying(false);
  }, []);

  const advance = useCallback(() => {
    setStepIdx((prev) => {
      if (prev >= steps.length - 1) {
        stop();
        return prev;
      }
      return prev + 1;
    });
  }, [steps.length, stop]);

  const play = useCallback(() => {
    if (stepIdx >= steps.length - 1) {
      setStepIdx(0);
    }
    setPlaying(true);
    intervalRef.current = setInterval(() => {
      setStepIdx((prev) => {
        if (prev >= steps.length - 1) {
          stop();
          return prev;
        }
        return prev + 1;
      });
    }, 1200);
  }, [stepIdx, steps.length, stop]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const reset = useCallback(() => {
    stop();
    setStepIdx(0);
  }, [stop]);

  const isLast = stepIdx >= steps.length - 1;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="font-mono text-[11px] text-muted/40">
          packages = [{PACKAGES.join(", ")}]
        </span>
        <span className="font-mono text-[11px] text-muted/40">
          D = {DAYS_LIMIT}
        </span>
      </div>

      <div className="py-4">
        <div
          ref={containerRef}
          className="relative flex items-center justify-center gap-0.5 sm:gap-1"
        >
          {CAP_RANGE.map((cap, i) => {
            const isEliminated = eliminatedSet.has(cap);
            const isMid = step.mid === cap && !step.done;
            const isDone = step.done === true && step.lo === cap;

            return (
              <motion.div
                key={cap}
                ref={(el) => {
                  cellRefs.current[i] = el;
                }}
                className={[
                  "flex h-9 w-7 items-center justify-center rounded-sm border font-mono text-[10px] sm:h-10 sm:w-9 sm:text-xs",
                  isDone
                    ? "border-foreground/30 bg-foreground/15"
                    : isMid
                      ? "border-foreground/20 bg-foreground/15"
                      : "border-foreground/10",
                ].join(" ")}
                animate={{ opacity: isEliminated ? 0.15 : 1 }}
                transition={hoverSpring}
              >
                {cap}
              </motion.div>
            );
          })}
        </div>

        {cellCenters.length > 0 && (
          <div className="relative mt-1.5 h-5">
            <motion.span
              className="absolute top-0 -translate-x-1/2 font-mono text-[10px] text-foreground/50"
              initial={false}
              animate={{ left: cellCenters[step.lo - MIN_CAP] ?? 0 }}
              transition={hoverSpring}
            >
              lo
            </motion.span>
            {step.mid >= MIN_CAP &&
              step.mid <= MAX_CAP &&
              step.done !== true && (
                <motion.span
                  className="absolute top-0 -translate-x-1/2 font-mono text-[10px] text-foreground/50"
                  initial={false}
                  animate={{ left: cellCenters[step.mid - MIN_CAP] ?? 0 }}
                  transition={hoverSpring}
                >
                  mid
                </motion.span>
              )}
            <motion.span
              className="absolute top-0 -translate-x-1/2 font-mono text-[10px] text-foreground/50"
              initial={false}
              animate={{ left: cellCenters[step.hi - MIN_CAP] ?? 0 }}
              transition={hoverSpring}
            >
              hi
            </motion.span>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {step.dayAssignments.length > 0 && (
          <motion.div
            key={`days-${stepIdx}`}
            className="mt-2 space-y-1.5"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            {step.dayAssignments.map((day, i) => {
              const total = day.reduce((a, b) => a + b, 0);
              return (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-10 font-mono text-[10px] text-muted/40">
                    Day {i + 1}
                  </span>
                  <div className="flex gap-0.5">
                    {day.map((pkg, j) => (
                      <div
                        key={j}
                        className="flex h-7 w-7 items-center justify-center rounded-sm border border-foreground/10 font-mono text-[10px]"
                      >
                        {pkg}
                      </div>
                    ))}
                  </div>
                  <span className="font-mono text-[10px] text-muted/30">
                    {total}/{step.mid}
                  </span>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-4 flex items-center gap-2">
        {playing ? (
          <Pill onClick={stop}>Pause</Pill>
        ) : (
          <Pill onClick={play}>Play</Pill>
        )}
        <Pill onClick={advance}>Step</Pill>
        <Pill onClick={reset}>Reset</Pill>
        <span className="ml-auto font-mono text-[11px] text-muted/40">
          {stepIdx + 1}/{steps.length}
        </span>
      </div>

      <div className="mt-4 min-h-[2.5rem]">
        <AnimatePresence mode="wait">
          <motion.div
            key={stepIdx}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            <Narration text={step.narration} />
            {isLast && step.done && (
              <p className="mt-1 font-mono text-[13px] font-semibold text-foreground/70">
                minimum capacity: {step.lo}
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section wrapper with scroll-triggered entrance
// ---------------------------------------------------------------------------

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
// Main content
// ---------------------------------------------------------------------------

export default function BinarySearchContent() {
  const prefersReduced = useHubReducedMotion();
  const t = prefersReduced ? instantTransition : spring.smooth;

  return (
    <div className="min-h-dvh bg-background">
      <PageHeader
        breadcrumbs={[
          { label: "Learn", href: "/learn" },
          { label: "Binary Search" },
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

          {/* 1. Core idea */}
          <Section transition={t}>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Binary Search
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              Cut the search space in half every step. Not just for &quot;find X
              in a sorted array&quot; — also for &quot;find the smallest or
              largest value where some condition flips.&quot;
            </p>
          </Section>

          {/* 2. Classic binary search demo */}
          <Section className="mt-14" transition={t}>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted/40">
              Classic binary search
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-muted">
              Pick a target. Each step computes the midpoint, compares, and
              throws away half the remaining elements.
            </p>
            <div className="mt-6">
              <ClassicSearchDemo />
            </div>
          </Section>

          {/* 3. The real insight */}
          <Section className="mt-14" transition={t}>
            <div className="border-l-2 border-foreground/10 pl-4">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted/40">
                The real insight
              </h3>
              <p className="mt-3 text-[14px] leading-relaxed text-muted">
                Binary search works whenever you have a{" "}
                <span className="text-foreground">monotonic predicate</span> — a
                condition that&apos;s false for a while, then true forever (or
                vice versa). The search finds the boundary.
              </p>
              <div className="mt-4 flex items-center justify-center gap-0.5">
                {["F", "F", "F", "F"].map((val, i) => (
                  <div
                    key={`f-${i}`}
                    className="flex h-8 w-9 items-center justify-center rounded-sm border border-foreground/10 bg-foreground/[0.03] font-mono text-xs text-muted/60"
                  >
                    {val}
                  </div>
                ))}
                <div className="mx-1 h-8 w-px bg-foreground/30" />
                {["T", "T", "T", "T"].map((val, i) => (
                  <div
                    key={`t-${i}`}
                    className="flex h-8 w-9 items-center justify-center rounded-sm border border-foreground/10 bg-foreground/10 font-mono text-xs text-foreground/70"
                  >
                    {val}
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-muted">
                The sorted-array version is just a special case: the predicate
                is &quot;is this element &ge; the target?&quot; Most binary
                search interview problems are really about finding this
                boundary.
              </p>
            </div>
          </Section>

          {/* 4. Search the answer space demo */}
          <Section className="mt-14" transition={t}>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted/40">
              Search the answer space
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-muted">
              &quot;Minimum ship capacity to deliver all packages in D
              days.&quot; Don&apos;t search an array — binary search on the
              answer itself. For each candidate capacity, check if it works.
            </p>
            <div className="mt-6">
              <CapacityDemo />
            </div>
          </Section>

          {/* 5. Code templates */}
          <Section className="mt-14" transition={t}>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted/40">
              Templates
            </h2>

            <p className="mt-4 font-mono text-[12px] text-muted/40">
              Classic — find target in sorted array
            </p>
            <pre className="mt-2 overflow-x-auto border-l-2 border-foreground/10 bg-foreground/[0.02] py-4 pl-4 pr-3 font-mono text-[13px] leading-relaxed">
              <span className="text-foreground/70">function</span>{" "}
              <span className="text-foreground">binarySearch</span>(
              <span className="text-foreground">arr</span>:{" "}
              <span className="text-foreground/70">number</span>[],{" "}
              <span className="text-foreground">target</span>:{" "}
              <span className="text-foreground/70">number</span>) {"{\n"}
              {"  "}
              <span className="text-foreground/70">let</span> left ={" "}
              <span className="text-foreground/50">0</span>, right = arr.length
              - <span className="text-foreground/50">1</span>
              {"\n\n"}
              {"  "}
              <span className="text-foreground/70">while</span> (left {"<"}=
              right) {"{\n"}
              {"    "}
              <span className="text-foreground/70">const</span> mid =
              Math.floor((left + right) /{" "}
              <span className="text-foreground/50">2</span>){"\n"}
              {"    "}
              <span className="text-foreground/70">if</span> (arr[mid] ===
              target) <span className="text-foreground/70">return</span> mid
              {"\n"}
              {"    "}
              <span className="text-foreground/70">if</span> (arr[mid] {"<"}{" "}
              target) left = mid + <span className="text-foreground/50">1</span>
              {"\n"}
              {"    "}
              <span className="text-foreground/70">else</span> right = mid -{" "}
              <span className="text-foreground/50">1</span>
              {"\n"}
              {"  }\n"}
              {"  "}
              <span className="text-foreground/70">return</span>{" "}
              <span className="text-foreground/50">-1</span>
              {"\n"}
              {"}"}
            </pre>

            <p className="mt-6 font-mono text-[12px] text-muted/40">
              Search the answer — find boundary of a predicate
            </p>
            <pre className="mt-2 overflow-x-auto border-l-2 border-foreground/10 bg-foreground/[0.02] py-4 pl-4 pr-3 font-mono text-[13px] leading-relaxed">
              <span className="text-foreground/70">function</span>{" "}
              <span className="text-foreground">searchAnswer</span>(
              <span className="text-foreground">lo</span>:{" "}
              <span className="text-foreground/70">number</span>,{" "}
              <span className="text-foreground">hi</span>:{" "}
              <span className="text-foreground/70">number</span>) {"{\n"}
              {"  "}
              <span className="text-foreground/70">while</span> (lo {"<"} hi){" "}
              {"{\n"}
              {"    "}
              <span className="text-foreground/70">const</span> mid =
              Math.floor((lo + hi) /{" "}
              <span className="text-foreground/50">2</span>){"\n"}
              {"    "}
              <span className="text-foreground/70">if</span> (predicate(mid)) hi
              = mid
              {"\n"}
              {"    "}
              <span className="text-foreground/70">else</span> lo = mid +{" "}
              <span className="text-foreground/50">1</span>
              {"\n"}
              {"  }\n"}
              {"  "}
              <span className="text-foreground/70">return</span> lo{" "}
              <span className="text-foreground/25">{"// smallest true"}</span>
              {"\n"}
              {"}"}
            </pre>
          </Section>

          {/* 6. Spot this pattern */}
          <Section className="mt-14" transition={t}>
            <div className="border-l-2 border-foreground/15 pl-4">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted/40">
                Spot this pattern
              </h3>
              <ul className="mt-3 space-y-1.5 text-[13px] text-muted">
                <li>Sorted data or a sortable search space</li>
                <li>Minimum or maximum value satisfying a condition</li>
                <li>
                  &quot;Minimize the maximum&quot; or &quot;maximize the
                  minimum&quot;
                </li>
                <li>Hidden monotonic predicate</li>
              </ul>
              <p className="mt-3 font-mono text-[13px] text-muted/60">
                O(log n) time
              </p>
            </div>
          </Section>

          {/* 7. Bottom nav */}
          <nav className="mt-16 flex items-center border-t border-foreground/5 pt-6">
            <Link
              href="/learn/stacks-queues"
              className="font-mono text-[13px] text-muted transition-colors hover:text-foreground"
            >
              &larr; Stacks & Queues
            </Link>
            <Link
              href="/learn/trees-graphs"
              className="ml-auto font-mono text-[13px] text-muted transition-colors hover:text-foreground"
            >
              Trees & Graphs &rarr;
            </Link>
          </nav>
        </div>
      </main>
    </div>
  );
}
