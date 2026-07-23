"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useStepPlayer } from "@/hooks/useStepPlayer";
import { m, AnimatePresence } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import { spring, fadeInUp, instantTransition } from "@/lib/animations";
import { useHubReducedMotion } from "@/app/providers";

// ---------------------------------------------------------------------------
// Shared config
// ---------------------------------------------------------------------------

const hoverSpring = { type: "spring" as const, stiffness: 180, damping: 22 };

// ---------------------------------------------------------------------------
// Two Sum demo data & logic
// ---------------------------------------------------------------------------

const TWO_SUM_ARRAY = [1, 3, 5, 7, 9, 11, 14, 18];
const TWO_SUM_TARGETS = [8, 12, 18, 25];

type TwoSumStep = {
  left: number;
  right: number;
  narration: string;
  found: boolean;
};

function computeTwoSumSteps(target: number): TwoSumStep[] {
  const arr = TWO_SUM_ARRAY;
  const steps: TwoSumStep[] = [];
  let l = 0;
  let r = arr.length - 1;

  steps.push({
    left: l,
    right: r,
    narration: `Start with pointers at indices 0 and ${r}.`,
    found: false,
  });

  while (l < r) {
    const sum = arr[l] + arr[r];
    if (sum === target) {
      steps.push({
        left: l,
        right: r,
        narration: `Sum is \`${arr[l]} + ${arr[r]} = ${sum}\`. Found target \`${target}\`.`,
        found: true,
      });
      break;
    } else if (sum < target) {
      steps.push({
        left: l,
        right: r,
        narration: `Sum is \`${arr[l]} + ${arr[r]} = ${sum}\`, less than target \`${target}\` — move left pointer right.`,
        found: false,
      });
      l++;
    } else {
      steps.push({
        left: l,
        right: r,
        narration: `Sum is \`${arr[l]} + ${arr[r]} = ${sum}\`, greater than target \`${target}\` — move right pointer left.`,
        found: false,
      });
      r--;
    }
  }

  if (steps[steps.length - 1]?.found !== true && l >= r) {
    steps.push({
      left: l,
      right: r,
      narration: `Pointers crossed. No pair sums to \`${target}\`.`,
      found: false,
    });
  }

  return steps;
}

// ---------------------------------------------------------------------------
// Remove Duplicates demo data & logic
// ---------------------------------------------------------------------------

const DEDUP_ARRAY = [1, 1, 2, 3, 3, 3, 4, 5, 5];

type DedupStep = {
  read: number;
  write: number;
  result: number[];
  narration: string;
  done: boolean;
};

function computeDedupSteps(): DedupStep[] {
  const arr = [...DEDUP_ARRAY];
  const steps: DedupStep[] = [];
  let write = 0;

  steps.push({
    read: 0,
    write: 0,
    result: [arr[0]],
    narration: `Start. Write pointer at 0, read pointer scans from 1.`,
    done: false,
  });

  for (let read = 1; read < arr.length; read++) {
    if (arr[read] !== arr[write]) {
      write++;
      arr[write] = arr[read];
      steps.push({
        read,
        write,
        result: arr.slice(0, write + 1),
        narration: `\`${arr[read]}\` !== previous — write it at index \`${write}\`. Kept: [${arr.slice(0, write + 1).join(", ")}].`,
        done: false,
      });
    } else {
      steps.push({
        read,
        write,
        result: arr.slice(0, write + 1),
        narration: `\`${arr[read]}\` === previous — skip it. Read moves to index \`${read + 1 < arr.length ? read + 1 : "done"}\`.`,
        done: false,
      });
    }
  }

  steps[steps.length - 1] = {
    ...steps[steps.length - 1],
    narration: `Done. ${steps[steps.length - 1].write + 1} unique values kept in-place.`,
    done: true,
  };

  return steps;
}

const DEDUP_STEPS = computeDedupSteps();

// ---------------------------------------------------------------------------
// Pill button
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
    <button type="button"
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

// ---------------------------------------------------------------------------
// Narration
// ---------------------------------------------------------------------------

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
// Two Sum interactive demo
// ---------------------------------------------------------------------------

function TwoSumDemo() {
  const [target, setTarget] = useState(TWO_SUM_TARGETS[0]);
  const steps = computeTwoSumSteps(target);
  const { stepIdx, playing, advance, play, stop, reset } = useStepPlayer(
    steps.length,
    { intervalMs: 800 },
  );
  const step = steps[stepIdx];

  const handleTargetChange = useCallback(
    (t: number) => {
      reset();
      setTarget(t);
    },
    [reset],
  );

  const isLast = stepIdx >= steps.length - 1;

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span className="text-[11px] uppercase tracking-[0.2em] text-muted">
          Target
        </span>
        {TWO_SUM_TARGETS.map((t) => (
          <Pill
            key={t}
            onClick={() => handleTargetChange(t)}
            active={target === t}
          >
            {t}
          </Pill>
        ))}
      </div>

      <div className="relative flex items-center justify-center gap-1 py-8 sm:gap-1.5">
        {TWO_SUM_ARRAY.map((val, i) => {
          const isLeft = i === step.left;
          const isRight = i === step.right;
          const isActive = isLeft || isRight;
          const isEliminated = i < step.left || i > step.right;
          const isFound = step.found && isActive;

          return (
            <div key={i} className="relative flex flex-col items-center">
              <m.div
                className={[
                  "flex h-10 w-10 items-center justify-center rounded-sm border font-mono text-sm sm:h-12 sm:w-12",
                  isFound
                    ? "border-foreground/30 bg-foreground/20"
                    : isActive
                      ? "border-foreground/20 bg-foreground/15"
                      : "border-foreground/10",
                ].join(" ")}
                animate={{
                  opacity: isEliminated ? 0.3 : 1,
                }}
                transition={hoverSpring}
              >
                {val}
              </m.div>
              <AnimatePresence>
                {isLeft && (
                  <m.span
                    key="L"
                    className="absolute -bottom-6 font-mono text-[11px] text-foreground/50"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={hoverSpring}
                  >
                    L
                  </m.span>
                )}
                {isRight && (
                  <m.span
                    key="R"
                    className="absolute -bottom-6 font-mono text-[11px] text-foreground/50"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={hoverSpring}
                  >
                    R
                  </m.span>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-2">
        {playing ? (
          <Pill onClick={stop}>Pause</Pill>
        ) : (
          <Pill onClick={play}>Play</Pill>
        )}
        <Pill onClick={advance}>Step</Pill>
        <Pill onClick={reset}>Reset</Pill>
        <span className="ml-auto font-mono text-[11px] text-muted">
          {stepIdx + 1}/{steps.length}
        </span>
      </div>

      <div className="mt-4 min-h-[2.5rem]">
        <AnimatePresence mode="wait">
          <m.div
            key={stepIdx}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            <Narration text={step.narration} />
            {isLast && step.found && (
              <p className="mt-1 font-mono text-[13px] font-semibold text-foreground/70">
                Pair found.
              </p>
            )}
          </m.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Remove Duplicates interactive demo
// ---------------------------------------------------------------------------

function DedupDemo() {
  const { stepIdx, playing, advance, play, stop, reset } = useStepPlayer(
    DEDUP_STEPS.length,
    { intervalMs: 800 },
  );
  const step = DEDUP_STEPS[stepIdx];

  const isLast = stepIdx >= DEDUP_STEPS.length - 1;

  return (
    <div>
      <div className="relative flex items-center justify-center gap-1 py-8 sm:gap-1.5">
        {DEDUP_ARRAY.map((val, i) => {
          const isRead = i === step.read;
          const isWrite = i === step.write;
          const isKept = i <= step.write;

          return (
            <div key={i} className="relative flex flex-col items-center">
              <m.div
                className={[
                  "flex h-10 w-10 items-center justify-center rounded-sm border font-mono text-sm sm:h-12 sm:w-12",
                  isRead || isWrite
                    ? "border-foreground/20"
                    : "border-foreground/10",
                  isKept ? "bg-foreground/10" : "bg-foreground/[0.03]",
                ].join(" ")}
                transition={hoverSpring}
              >
                {val}
              </m.div>
              <AnimatePresence>
                {isWrite && (
                  <m.span
                    key="W"
                    className="absolute -bottom-6 font-mono text-[11px] text-foreground/50"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={hoverSpring}
                  >
                    W
                  </m.span>
                )}
                {isRead && !isWrite && (
                  <m.span
                    key="R"
                    className="absolute -bottom-6 font-mono text-[11px] text-foreground/50"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={hoverSpring}
                  >
                    R
                  </m.span>
                )}
                {isRead && isWrite && (
                  <m.span
                    key="WR"
                    className="absolute -bottom-6 font-mono text-[10px] text-foreground/50"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={hoverSpring}
                  >
                    W/R
                  </m.span>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-2">
        {playing ? (
          <Pill onClick={stop}>Pause</Pill>
        ) : (
          <Pill onClick={play}>Play</Pill>
        )}
        <Pill onClick={advance}>Step</Pill>
        <Pill onClick={reset}>Reset</Pill>
        <span className="ml-auto font-mono text-[11px] text-muted">
          {stepIdx + 1}/{DEDUP_STEPS.length}
        </span>
      </div>

      <div className="mt-4 min-h-[2.5rem]">
        <AnimatePresence mode="wait">
          <m.div
            key={stepIdx}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            <Narration text={step.narration} />
            {isLast && (
              <p className="mt-1 font-mono text-[13px] font-semibold text-foreground/70">
                Result: [{step.result.join(", ")}]
              </p>
            )}
          </m.div>
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
    <m.section
      className={className}
      variants={fadeInUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      transition={transition}
    >
      {children}
    </m.section>
  );
}

// ---------------------------------------------------------------------------
// Main content
// ---------------------------------------------------------------------------

export default function TwoPointersContent() {
  const prefersReduced = useHubReducedMotion();
  const t = prefersReduced ? instantTransition : spring.smooth;

  return (
    <div className="min-h-dvh bg-background">
      <PageHeader
        breadcrumbs={[
          { label: "Learn", href: "/learn" },
          { label: "Two Pointers" },
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
            ← All topics
          </Link>

          {/* Core idea */}
          <Section transition={t}>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Two Pointers
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              Instead of checking every pair (O(n²)), use two indices that move
              toward each other. One pass, one answer.
            </p>
          </Section>

          {/* Demo 1: Two Sum on sorted array */}
          <Section className="mt-14" transition={t}>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted">
              Two Sum on a sorted array
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-muted">
              Pick a target. Left pointer starts at the smallest value, right at
              the largest. If the sum is too small, move left up. Too big, move
              right down. They meet in the middle.
            </p>
            <div className="mt-6">
              <TwoSumDemo />
            </div>
          </Section>

          {/* Why this works */}
          <Section className="mt-14" transition={t}>
            <div className="border-l-2 border-foreground/10 pl-4">
              <p className="text-[14px] leading-relaxed text-muted">
                This works because the array is sorted. When the sum is too
                small, incrementing the left pointer is the only way to make it
                bigger — every value to the right of the left pointer is larger.
                Same logic in reverse for the right pointer. You never need to
                go backwards, so each element is visited at most once.
              </p>
            </div>
          </Section>

          {/* Demo 2: Remove Duplicates */}
          <Section className="mt-14" transition={t}>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted">
              Remove duplicates in-place
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-muted">
              Two pointers don&apos;t always walk toward each other. Here, a
              &quot;read&quot; pointer scans forward while a &quot;write&quot;
              pointer trails behind, only advancing when it finds a new unique
              value.
            </p>
            <div className="mt-6">
              <DedupDemo />
            </div>
          </Section>

          {/* Code section */}
          <Section className="mt-14" transition={t}>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted">
              Template
            </h2>
            <pre className="mt-4 overflow-x-auto border-l-2 border-foreground/10 bg-foreground/[0.02] py-4 pl-4 pr-3 font-mono text-[13px] leading-relaxed">
              <span className="text-foreground/70">function</span>{" "}
              twoPointers(arr:{" "}
              <span className="text-foreground/70">number</span>[]) {"{\n"}
              {"  "}
              <span className="text-foreground/70">let</span> l ={" "}
              <span className="text-foreground/50">0</span>
              {"\n"}
              {"  "}
              <span className="text-foreground/70">let</span> r = arr.length -{" "}
              <span className="text-foreground/50">1</span>
              {"\n\n"}
              {"  "}
              <span className="text-foreground/70">while</span> (l {"<"} r){" "}
              {"{\n"}
              {"    "}
              <span className="text-foreground/25">
                {"// compare arr[l] and arr[r]"}
              </span>
              {"\n"}
              {"    "}
              <span className="text-foreground/25">
                {"// move l++ or r-- based on condition"}
              </span>
              {"\n"}
              {"  }\n"}
              {"}"}
            </pre>
          </Section>

          {/* Spot this pattern */}
          <Section className="mt-14" transition={t}>
            <div className="border-l-2 border-foreground/15 pl-4">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted">
                Spot this pattern
              </h3>
              <ul className="mt-3 space-y-1.5 text-[13px] text-muted">
                <li>Sorted array + &quot;find a pair that satisfies X&quot;</li>
                <li>Remove or deduplicate elements in-place</li>
                <li>Partition an array around a pivot</li>
                <li>
                  Compare from both ends (palindromes, container problems)
                </li>
              </ul>
              <p className="mt-3 font-mono text-[13px] text-muted">
                O(n) time, O(1) space
              </p>
            </div>
          </Section>

          {/* Bottom nav */}
          <nav className="mt-16 flex items-center border-t border-foreground/5 pt-6">
            <Link
              href="/learn"
              className="font-mono text-[13px] text-muted transition-colors hover:text-foreground"
            >
              ← All topics
            </Link>
            <Link
              href="/learn/sliding-window"
              className="ml-auto font-mono text-[13px] text-muted transition-colors hover:text-foreground"
            >
              Sliding Window →
            </Link>
          </nav>
        </div>
      </main>
    </div>
  );
}
