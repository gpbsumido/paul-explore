"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { m, AnimatePresence, useInView } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import { spring, fadeInUp, instantTransition } from "@/lib/animations";
import { useHubReducedMotion } from "@/app/providers";

// ---------------------------------------------------------------------------
// Shared config
// ---------------------------------------------------------------------------

const hoverSpring = { type: "spring" as const, stiffness: 180, damping: 22 };

// ---------------------------------------------------------------------------
// Two Sum (unsorted) demo data & logic
// ---------------------------------------------------------------------------

const TWO_SUM_ARRAY = [2, 11, 7, 15, 3, 5];
const TWO_SUM_TARGETS = [18, 9, 8];

type MapEntry = { key: number; value: number };

type TwoSumStep = {
  currentIndex: number;
  complement: number;
  found: boolean;
  foundMapIndex: number | null;
  map: MapEntry[];
  narration: string;
  highlightCell: number | null;
  highlightMapKey: number | null;
};

function computeTwoSumSteps(target: number): TwoSumStep[] {
  const arr = TWO_SUM_ARRAY;
  const steps: TwoSumStep[] = [];
  const map: MapEntry[] = [];

  for (let i = 0; i < arr.length; i++) {
    const complement = target - arr[i];
    const mapIdx = map.findIndex((e) => e.key === complement);

    if (mapIdx !== -1) {
      steps.push({
        currentIndex: i,
        complement,
        found: true,
        foundMapIndex: mapIdx,
        map: [...map],
        narration: `Check: is \`${target} - ${arr[i]} = ${complement}\` in the map? Yes, at index \`${map[mapIdx].value}\`. Found pair!`,
        highlightCell: i,
        highlightMapKey: complement,
      });
      return steps;
    }

    steps.push({
      currentIndex: i,
      complement,
      found: false,
      foundMapIndex: null,
      map: [...map],
      narration: `Check: is \`${target} - ${arr[i]} = ${complement}\` in the map? No. Store \`${arr[i]} → index ${i}\`.`,
      highlightCell: i,
      highlightMapKey: null,
    });

    map.push({ key: arr[i], value: i });
  }

  const last = steps[steps.length - 1];
  steps[steps.length - 1] = {
    ...last,
    narration: `No pair sums to \`${target}\`.`,
  };

  return steps;
}

// ---------------------------------------------------------------------------
// Set operations demo data
// ---------------------------------------------------------------------------

type SetOp = "add" | "has" | "delete";
type SetAction = { op: SetOp; value: number };

const SET_ACTIONS: SetAction[] = [
  { op: "add", value: 3 },
  { op: "add", value: 5 },
  { op: "add", value: 7 },
  { op: "has", value: 5 },
  { op: "delete", value: 5 },
  { op: "has", value: 5 },
  { op: "add", value: 9 },
];

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
  const [stepIdx, setStepIdx] = useState(0);
  const stepIdxRef = useRef(stepIdx);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const steps = useMemo(() => computeTwoSumSteps(target), [target]);
  const step = steps[stepIdx];

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setPlaying(false);
  }, []);

  const advance = useCallback(() => {
    if (stepIdxRef.current >= steps.length - 1) {
      stop();
      return;
    }
    stepIdxRef.current += 1;
    setStepIdx(stepIdxRef.current);
  }, [steps.length, stop]);

  const play = useCallback(() => {
    if (stepIdxRef.current >= steps.length - 1) {
      stepIdxRef.current = 0;
      setStepIdx(0);
    }
    setPlaying(true);
    intervalRef.current = setInterval(() => {
      if (document.hidden) return;
      if (stepIdxRef.current >= steps.length - 1) {
        stop();
        return;
      }
      stepIdxRef.current += 1;
      setStepIdx(stepIdxRef.current);
    }, 1200);
  }, [steps.length, stop]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    stepIdxRef.current = stepIdx;
  }, [stepIdx]);

  const reset = useCallback(() => {
    stop();
    setStepIdx(0);
  }, [stop]);

  const handleTargetChange = useCallback(
    (t: number) => {
      reset();
      setTarget(t);
    },
    [reset],
  );

  const isLast = stepIdx >= steps.length - 1;

  const allMapEntries = useMemo(() => {
    const final = steps[steps.length - 1];
    if (final.found) {
      return final.map;
    }
    const last = steps[steps.length - 1];
    return last.map;
  }, [steps]);

  const visibleMap = step.found ? step.map : [...step.map];
  if (!step.found && stepIdx > 0) {
    const prevStep = steps[stepIdx - 1];
    if (visibleMap.length === prevStep.map.length) {
      const arr = TWO_SUM_ARRAY;
      visibleMap.push({
        key: arr[step.currentIndex],
        value: step.currentIndex,
      });
    }
  }
  if (stepIdx === 0) {
    visibleMap.push({
      key: TWO_SUM_ARRAY[0],
      value: 0,
    });
  }

  const allKeysEver = useMemo(() => {
    const keys = new Set<number>();
    for (const s of steps) {
      for (const e of s.map) keys.add(e.key);
      if (!s.found) keys.add(TWO_SUM_ARRAY[s.currentIndex]);
    }
    return keys;
  }, [steps]);

  void allKeysEver;
  void allMapEntries;

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

      {/* Array cells */}
      <div className="flex items-center justify-center gap-1 py-4 sm:gap-1.5">
        {TWO_SUM_ARRAY.map((val, i) => {
          const isCurrent = i === step.currentIndex;
          const isFoundPair =
            step.found &&
            (i === step.currentIndex ||
              (step.foundMapIndex !== null &&
                i === step.map[step.foundMapIndex]?.value));

          return (
            <div key={i} className="relative flex flex-col items-center">
              <m.div
                className={[
                  "flex h-10 w-10 items-center justify-center rounded-sm border font-mono text-sm sm:h-12 sm:w-12",
                  isFoundPair
                    ? "border-foreground/30 bg-foreground/20"
                    : isCurrent
                      ? "border-foreground/20 bg-foreground/15"
                      : "border-foreground/10",
                ].join(" ")}
                animate={{
                  opacity: i < step.currentIndex && !isFoundPair ? 0.4 : 1,
                }}
                transition={hoverSpring}
              >
                {val}
              </m.div>
              <span className="mt-1 font-mono text-[10px] text-muted">{i}</span>
            </div>
          );
        })}
      </div>

      {/* Map table */}
      <div className="mt-2 flex justify-center">
        <div className="w-48">
          <div className="flex border-b border-foreground/10 pb-1">
            <span className="w-1/2 font-mono text-[10px] text-muted">key</span>
            <span className="w-1/2 font-mono text-[10px] text-muted">
              value
            </span>
          </div>
          <div className="min-h-[6rem]">
            <AnimatePresence>
              {visibleMap.map((entry) => {
                const isHighlighted =
                  step.found && entry.key === step.highlightMapKey;
                return (
                  <m.div
                    key={`${entry.key}-${entry.value}`}
                    className={[
                      "flex border-b border-foreground/5 py-1 font-mono text-[13px]",
                      isHighlighted
                        ? "bg-foreground/15 text-foreground"
                        : "text-muted",
                    ].join(" ")}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={hoverSpring}
                  >
                    <span className="w-1/2">{entry.key}</span>
                    <span className="w-1/2">index {entry.value}</span>
                  </m.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Controls */}
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

      {/* Narration */}
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
// Hashing diagram — SVG with pathLength-animated arrows
// ---------------------------------------------------------------------------

function HashingDiagram() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  const keys = [
    { label: '"a"', y: 28 },
    { label: '"b"', y: 58 },
    { label: '"c"', y: 88 },
  ];

  const buckets = [
    { y: 16, label: "0" },
    { y: 40, label: "1" },
    { y: 64, label: "2" },
    { y: 88, label: "3" },
  ];

  const arrows: { from: number; to: number }[] = [
    { from: 0, to: 1 },
    { from: 1, to: 3 },
    { from: 2, to: 0 },
  ];

  return (
    <div ref={ref} className="flex justify-center py-4">
      <svg
        viewBox="0 0 280 112"
        className="h-28 w-full max-w-xs"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      >
        {/* Key circles on the left */}
        {keys.map((k, i) => (
          <g key={i}>
            <circle cx="40" cy={k.y} r="14" strokeOpacity="0.3" fill="none" />
            <text
              x="40"
              y={k.y + 4}
              textAnchor="middle"
              fill="currentColor"
              fillOpacity="0.5"
              stroke="none"
              fontSize="11"
              fontFamily="monospace"
            >
              {k.label}
            </text>
          </g>
        ))}

        {/* Bucket slots on the right */}
        {buckets.map((b, i) => (
          <g key={i}>
            <rect
              x="200"
              y={b.y}
              width="60"
              height="20"
              rx="3"
              strokeOpacity="0.15"
              fill="none"
            />
            <text
              x="212"
              y={b.y + 14}
              fill="currentColor"
              fillOpacity="0.25"
              stroke="none"
              fontSize="10"
              fontFamily="monospace"
            >
              {b.label}
            </text>
          </g>
        ))}

        {/* Arrows connecting keys to buckets */}
        {arrows.map((a, i) => {
          const fromY = keys[a.from].y;
          const toY = buckets[a.to].y + 10;
          return (
            <m.path
              key={i}
              d={`M 54 ${fromY} L 200 ${toY}`}
              strokeOpacity={0.35}
              strokeDasharray="4 4"
              initial={{ pathLength: 0 }}
              animate={inView ? { pathLength: 1 } : { pathLength: 0 }}
              transition={{
                duration: 0.6,
                delay: i * 0.2,
                ease: "easeOut",
              }}
            />
          );
        })}

        {/* Labels */}
        <text
          x="40"
          y="110"
          textAnchor="middle"
          fill="currentColor"
          fillOpacity="0.25"
          stroke="none"
          fontSize="9"
          fontFamily="monospace"
        >
          keys
        </text>
        <text
          x="230"
          y="110"
          textAnchor="middle"
          fill="currentColor"
          fillOpacity="0.25"
          stroke="none"
          fontSize="9"
          fontFamily="monospace"
        >
          buckets
        </text>
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Set operations mini-visual
// ---------------------------------------------------------------------------

function SetDemo() {
  const [actionIdx, setActionIdx] = useState(-1);
  const [currentSet, setCurrentSet] = useState<number[]>([]);
  const [flashKey, setFlashKey] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const runAction = useCallback(
    (idx: number) => {
      const action = SET_ACTIONS[idx];
      if (!action) return;

      setActionIdx(idx);

      if (action.op === "add") {
        setCurrentSet((prev) =>
          prev.includes(action.value) ? prev : [...prev, action.value],
        );
        setFlashKey(null);
        setMessage(`add(${action.value})`);
      } else if (action.op === "has") {
        const exists = currentSet.includes(action.value);
        setFlashKey(exists ? action.value : null);
        setMessage(`has(${action.value}) → ${exists}`);
      } else if (action.op === "delete") {
        setCurrentSet((prev) => prev.filter((v) => v !== action.value));
        setFlashKey(null);
        setMessage(`delete(${action.value})`);
      }

      setTimeout(() => setFlashKey(null), 600);
    },
    [currentSet],
  );

  const resetSet = useCallback(() => {
    setActionIdx(-1);
    setCurrentSet([]);
    setFlashKey(null);
    setMessage(null);
  }, []);

  const nextAction =
    actionIdx < SET_ACTIONS.length - 1 ? SET_ACTIONS[actionIdx + 1] : null;

  return (
    <div>
      {/* Current set chips */}
      <div className="flex min-h-[2.5rem] flex-wrap items-center gap-1.5">
        <span className="text-[11px] uppercase tracking-[0.2em] text-muted">
          Set
        </span>
        <AnimatePresence>
          {currentSet.map((val) => (
            <m.span
              key={val}
              className={[
                "inline-flex h-6 items-center rounded-sm border px-2 font-mono text-xs transition-colors",
                flashKey === val
                  ? "border-foreground/50 text-foreground"
                  : "border-foreground/10 text-muted",
              ].join(" ")}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={hoverSpring}
            >
              {val}
            </m.span>
          ))}
        </AnimatePresence>
        {currentSet.length === 0 && (
          <span className="font-mono text-[11px] text-muted">empty</span>
        )}
      </div>

      {/* Controls */}
      <div className="mt-4 flex items-center gap-2">
        {nextAction && (
          <Pill onClick={() => runAction(actionIdx + 1)}>
            {nextAction.op}({nextAction.value})
          </Pill>
        )}
        <Pill onClick={resetSet}>Reset</Pill>
        <span className="ml-auto font-mono text-[11px] text-muted">
          {Math.max(0, actionIdx + 1)}/{SET_ACTIONS.length}
        </span>
      </div>

      {/* Message */}
      <div className="mt-3 min-h-[1.5rem]">
        <AnimatePresence mode="wait">
          {message && (
            <m.p
              key={message}
              className="font-mono text-[13px] text-muted"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
            >
              {message}
            </m.p>
          )}
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

export default function HashMapsContent() {
  const prefersReduced = useHubReducedMotion();
  const t = prefersReduced ? instantTransition : spring.smooth;

  return (
    <div className="min-h-dvh bg-background">
      <PageHeader
        breadcrumbs={[
          { label: "Learn", href: "/learn" },
          { label: "Hash Maps & Sets" },
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

          {/* 1. Core idea */}
          <Section transition={t}>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Hash Maps & Sets
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              Trade space for speed. Store values by key so you can look them up
              in O(1) instead of scanning.
            </p>
          </Section>

          {/* 2. Two Sum (unsorted) demo */}
          <Section className="mt-14" transition={t}>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted">
              Two Sum (unsorted)
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-muted">
              For each number, check if its complement is already in the map. If
              not, store the number and its index. One pass, O(n).
            </p>
            <div className="mt-6">
              <TwoSumDemo />
            </div>
          </Section>

          {/* 3. How hashing works */}
          <Section className="mt-14" transition={t}>
            <div className="border-l-2 border-foreground/10 pl-4">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted">
                How hashing works (30-second version)
              </h3>
              <p className="mt-3 text-[14px] leading-relaxed text-muted">
                A hash function converts a key into a bucket index. Different
                keys can land in the same bucket (collision), but on average
                each lookup touches one bucket. That&apos;s why it&apos;s O(1).
              </p>
              <HashingDiagram />
            </div>
          </Section>

          {/* 4. Set operations mini-visual */}
          <Section className="mt-14" transition={t}>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted">
              Set operations
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-muted">
              A Set is a Map without values — just keys. Three operations:{" "}
              <code className="font-mono text-foreground/70">add</code>,{" "}
              <code className="font-mono text-foreground/70">has</code>,{" "}
              <code className="font-mono text-foreground/70">delete</code>. All
              O(1).
            </p>
            <div className="mt-6">
              <SetDemo />
            </div>
          </Section>

          {/* 5. Code section */}
          <Section className="mt-14" transition={t}>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted">
              Templates
            </h2>

            <p className="mt-4 font-mono text-[12px] text-muted">Map pattern</p>
            <pre className="mt-2 overflow-x-auto border-l-2 border-foreground/10 bg-foreground/[0.02] py-4 pl-4 pr-3 font-mono text-[13px] leading-relaxed">
              <span className="text-foreground/70">function</span> twoSum( nums:{" "}
              <span className="text-foreground/70">number</span>[], target:{" "}
              <span className="text-foreground/70">number</span>) {"{\n"}
              {"  "}
              <span className="text-foreground/70">const</span> map ={" "}
              <span className="text-foreground/70">new</span> Map{"<"}
              <span className="text-foreground/70">number</span>,{" "}
              <span className="text-foreground/70">number</span>
              {">"}()
              {"\n\n"}
              {"  "}
              <span className="text-foreground/70">for</span> (
              <span className="text-foreground/70">let</span> i ={" "}
              <span className="text-foreground/50">0</span>; i {"<"}{" "}
              nums.length; i++) {"{\n"}
              {"    "}
              <span className="text-foreground/70">const</span> complement =
              target - nums[i]
              {"\n"}
              {"    "}
              <span className="text-foreground/70">if</span>{" "}
              (map.has(complement))
              {"\n"}
              {"      "}
              <span className="text-foreground/70">return</span>{" "}
              [map.get(complement)!, i]
              {"\n"}
              {"    "}map.set(nums[i], i)
              {"\n"}
              {"  }\n"}
              {"}"}
            </pre>

            <p className="mt-6 font-mono text-[12px] text-muted">Set pattern</p>
            <pre className="mt-2 overflow-x-auto border-l-2 border-foreground/10 bg-foreground/[0.02] py-4 pl-4 pr-3 font-mono text-[13px] leading-relaxed">
              <span className="text-foreground/70">function</span> hasDuplicate(
              nums: <span className="text-foreground/70">number</span>[]){" "}
              {"{\n"}
              {"  "}
              <span className="text-foreground/70">const</span> seen ={" "}
              <span className="text-foreground/70">new</span> Set{"<"}
              <span className="text-foreground/70">number</span>
              {">"}()
              {"\n\n"}
              {"  "}
              <span className="text-foreground/70">for</span> (
              <span className="text-foreground/70">const</span> n{" "}
              <span className="text-foreground/70">of</span> nums) {"{\n"}
              {"    "}
              <span className="text-foreground/70">if</span> (seen.has(n)){" "}
              <span className="text-foreground/70">return</span>{" "}
              <span className="text-foreground/50">true</span>
              {"\n"}
              {"    "}seen.add(n)
              {"\n"}
              {"  }\n"}
              {"  "}
              <span className="text-foreground/70">return</span>{" "}
              <span className="text-foreground/50">false</span>
              {"\n"}
              {"}"}
            </pre>

            <p className="mt-6 font-mono text-[12px] text-muted">
              Frequency counting
            </p>
            <pre className="mt-2 overflow-x-auto border-l-2 border-foreground/10 bg-foreground/[0.02] py-4 pl-4 pr-3 font-mono text-[13px] leading-relaxed">
              <span className="text-foreground/70">function</span> topKFrequent(
              nums: <span className="text-foreground/70">number</span>[], k:{" "}
              <span className="text-foreground/70">number</span>) {"{\n"}
              {"  "}
              <span className="text-foreground/70">const</span> freq ={" "}
              <span className="text-foreground/70">new</span> Map{"<"}
              <span className="text-foreground/70">number</span>,{" "}
              <span className="text-foreground/70">number</span>
              {">"}()
              {"\n\n"}
              {"  "}
              <span className="text-foreground/70">for</span> (
              <span className="text-foreground/70">const</span> n{" "}
              <span className="text-foreground/70">of</span> nums)
              {"\n"}
              {"    "}freq.set(n, (freq.get(n) ??{" "}
              <span className="text-foreground/50">0</span>) +{" "}
              <span className="text-foreground/50">1</span>){"\n\n"}
              {"  "}
              <span className="text-foreground/70">return</span> [...freq]
              {"\n"}
              {"    "}.sort((a, b) {"=>"} b[
              <span className="text-foreground/50">1</span>] - a[
              <span className="text-foreground/50">1</span>])
              {"\n"}
              {"    "}.slice(
              <span className="text-foreground/50">0</span>, k)
              {"\n"}
              {"    "}.map(([num]) {"=>"} num)
              {"\n"}
              {"}"}
            </pre>
          </Section>

          {/* 6. Spot this pattern */}
          <Section className="mt-14" transition={t}>
            <div className="border-l-2 border-foreground/15 pl-4">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted">
                Spot this pattern
              </h3>
              <ul className="mt-3 space-y-1.5 text-[13px] text-muted">
                <li>
                  &quot;Find if there&apos;s a pair/group that satisfies X&quot;
                  in an unsorted collection
                </li>
                <li>Counting frequencies, grouping, or deduplicating</li>
                <li>&quot;In O(1) time&quot; or &quot;without sorting&quot;</li>
                <li>
                  Checking membership — &quot;have we seen this before?&quot;
                </li>
              </ul>
              <p className="mt-3 font-mono text-[13px] text-muted">
                O(n) time, O(n) space
              </p>
            </div>
          </Section>

          {/* 7. Bottom nav */}
          <nav className="mt-16 flex items-center border-t border-foreground/5 pt-6">
            <Link
              href="/learn/sliding-window"
              className="font-mono text-[13px] text-muted transition-colors hover:text-foreground"
            >
              ← Sliding Window
            </Link>
            <Link
              href="/learn/stacks-queues"
              className="ml-auto font-mono text-[13px] text-muted transition-colors hover:text-foreground"
            >
              Stacks & Queues →
            </Link>
          </nav>
        </div>
      </main>
    </div>
  );
}
