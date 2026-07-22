"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
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
// Max Sum Subarray demo data & logic
// ---------------------------------------------------------------------------

const MAX_SUM_ARRAY = [2, 1, 5, 1, 3, 2, 7, 4];
const WINDOW_SIZES = [3, 4];

type MaxSumStep = {
  windowStart: number;
  windowEnd: number;
  sum: number;
  maxSum: number;
  narration: string;
};

function computeMaxSumSteps(k: number): MaxSumStep[] {
  const arr = MAX_SUM_ARRAY;
  const steps: MaxSumStep[] = [];

  let sum = 0;
  for (let i = 0; i < k; i++) sum += arr[i];
  let maxSum = sum;

  steps.push({
    windowStart: 0,
    windowEnd: k - 1,
    sum,
    maxSum,
    narration: `Initial window: indices 0 to ${k - 1}. Sum: \`${sum}\`.`,
  });

  for (let i = k; i < arr.length; i++) {
    const leaving = arr[i - k];
    const entering = arr[i];
    sum = sum - leaving + entering;
    const isNewMax = sum > maxSum;
    maxSum = Math.max(maxSum, sum);
    const isLast = i === arr.length - 1;

    steps.push({
      windowStart: i - k + 1,
      windowEnd: i,
      sum,
      maxSum,
      narration: isLast
        ? `Done. Max sum of any \`${k}\` consecutive elements: \`${maxSum}\`.`
        : `Subtract \`${leaving}\` (left edge leaving), add \`${entering}\` (right edge entering). New sum: \`${sum}\`.${isNewMax ? " New max!" : ""}`,
    });
  }

  return steps;
}

// ---------------------------------------------------------------------------
// Longest Substring Without Repeats demo data & logic
// ---------------------------------------------------------------------------

const SUBSTR_PRESETS = ["abcabcbb", "pwwkew", "dvdf"];

type SubstrStep = {
  left: number;
  right: number;
  seen: string[];
  longest: number;
  longestWindow: string;
  narration: string;
};

function computeSubstrSteps(s: string): SubstrStep[] {
  const steps: SubstrStep[] = [];
  const seen = new Set<string>();
  let left = 0;
  let longest = 0;
  let longestStart = 0;
  let longestEnd = -1;

  for (let right = 0; right < s.length; right++) {
    const char = s[right];

    if (seen.has(char)) {
      const dropped: string[] = [];
      while (seen.has(char)) {
        dropped.push(s[left]);
        seen.delete(s[left]);
        left++;
      }
      seen.add(char);
      const currentLen = right - left + 1;
      const isNewLongest = currentLen > longest;
      if (isNewLongest) {
        longest = currentLen;
        longestStart = left;
        longestEnd = right;
      }

      steps.push({
        left,
        right,
        seen: [...seen].sort(),
        longest,
        longestWindow: s.slice(longestStart, longestEnd + 1),
        narration: `\`${char}\` already seen — shrink from left, drop ${dropped.map((d) => `\`${d}\``).join(", ")}. Add \`${char}\`. Window: \`${s.slice(left, right + 1)}\`.${isNewLongest ? ` Longest so far: \`${longest}\`.` : ""}`,
      });
    } else {
      seen.add(char);
      const currentLen = right - left + 1;
      const isNewLongest = currentLen > longest;
      if (isNewLongest) {
        longest = currentLen;
        longestStart = left;
        longestEnd = right;
      }

      steps.push({
        left,
        right,
        seen: [...seen].sort(),
        longest,
        longestWindow: s.slice(longestStart, longestEnd + 1),
        narration: `\`${char}\` is new. Add it. Window: \`${s.slice(left, right + 1)}\`.${isNewLongest ? ` Longest so far: \`${longest}\`.` : ""}`,
      });
    }
  }

  const last = steps[steps.length - 1];
  steps[steps.length - 1] = {
    ...last,
    narration: `Done. Longest substring without repeats: \`${last.longest}\` (\`${last.longestWindow}\`).`,
  };

  return steps;
}

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
// Mini cells for fixed/variable window diagrams
// ---------------------------------------------------------------------------

function MiniCells({
  count,
  start,
  end,
}: {
  count: number;
  start: number;
  end: number;
}) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={[
            "h-2.5 w-2.5 rounded-[1px]",
            i >= start && i <= end
              ? "bg-foreground/15"
              : "bg-foreground/[0.04]",
          ].join(" ")}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Window overlay hook — measures cell positions and returns animated coords
// ---------------------------------------------------------------------------

function useWindowOverlay(
  containerRef: React.RefObject<HTMLDivElement | null>,
  cellRefs: React.RefObject<(HTMLDivElement | null)[]>,
  start: number,
  end: number,
): { left: number; width: number } | null {
  const [pos, setPos] = useState<{ left: number; width: number } | null>(null);

  useEffect(() => {
    const update = () => {
      const container = containerRef.current;
      const cells = cellRefs.current;
      if (!container || !cells) return;
      const first = cells[start];
      const last = cells[end];
      if (!first || !last) return;

      const cr = container.getBoundingClientRect();
      const fr = first.getBoundingClientRect();
      const lr = last.getBoundingClientRect();

      setPos({
        left: fr.left - cr.left,
        width: lr.right - fr.left,
      });
    };

    update();

    const observer = new ResizeObserver(update);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [containerRef, cellRefs, start, end]);

  return pos;
}

// ---------------------------------------------------------------------------
// Max Sum Subarray interactive demo
// ---------------------------------------------------------------------------

function MaxSumDemo() {
  const [k, setK] = useState(WINDOW_SIZES[0]);
  const [stepIdx, setStepIdx] = useState(0);
  const stepIdxRef = useRef(stepIdx);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef<(HTMLDivElement | null)[]>([]);

  const steps = useMemo(() => computeMaxSumSteps(k), [k]);
  const step = steps[stepIdx];

  const overlayPos = useWindowOverlay(
    containerRef,
    cellRefs,
    step.windowStart,
    step.windowEnd,
  );

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
    setStepIdx((prev) => prev + 1);
  }, [steps.length, stop]);

  const play = useCallback(() => {
    if (stepIdx >= steps.length - 1) {
      setStepIdx(0);
    }
    setPlaying(true);
    intervalRef.current = setInterval(() => {
      if (document.hidden) return;
      if (stepIdxRef.current >= steps.length - 1) {
        stop();
        return;
      }
      setStepIdx((prev) => prev + 1);
    }, 800);
  }, [stepIdx, steps.length, stop]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Mirror stepIdx into a ref so the interval and handlers can read the current
  // step and stop outside the updater (ref writes in an effect are fine; a
  // setState there is not).
  useEffect(() => {
    stepIdxRef.current = stepIdx;
  }, [stepIdx]);

  const reset = useCallback(() => {
    stop();
    setStepIdx(0);
  }, [stop]);

  const handleKChange = useCallback(
    (newK: number) => {
      reset();
      setK(newK);
    },
    [reset],
  );

  const isLast = stepIdx >= steps.length - 1;

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span className="text-[11px] uppercase tracking-[0.2em] text-muted">
          Window size
        </span>
        {WINDOW_SIZES.map((size) => (
          <Pill
            key={size}
            onClick={() => handleKChange(size)}
            active={k === size}
          >
            k={size}
          </Pill>
        ))}
      </div>

      <div className="mb-2 flex items-baseline gap-4">
        <span className="font-mono text-2xl font-bold text-foreground">
          {step.sum}
        </span>
        <span className="font-mono text-[11px] text-muted">
          max: {step.maxSum}
        </span>
      </div>

      <div className="py-4">
        <div
          ref={containerRef}
          className="relative flex items-center justify-center gap-1 sm:gap-1.5"
        >
          {overlayPos && (
            <motion.div
              className="pointer-events-none absolute inset-y-0 rounded-sm border border-foreground/20 bg-foreground/10"
              initial={false}
              animate={overlayPos}
              transition={hoverSpring}
            />
          )}
          {MAX_SUM_ARRAY.map((val, i) => (
            <div
              key={i}
              ref={(el) => {
                cellRefs.current[i] = el;
              }}
              className="flex h-10 w-10 items-center justify-center rounded-sm border border-foreground/10 font-mono text-sm sm:h-12 sm:w-12"
            >
              {val}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2">
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
          <motion.div
            key={stepIdx}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            <Narration text={step.narration} />
            {isLast && (
              <p className="mt-1 font-mono text-[13px] font-semibold text-foreground/70">
                Max sum: {step.maxSum}
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Longest Substring Without Repeats interactive demo
// ---------------------------------------------------------------------------

function SubstringDemo() {
  const [input, setInput] = useState(SUBSTR_PRESETS[0]);
  const [stepIdx, setStepIdx] = useState(0);
  const stepIdxRef = useRef(stepIdx);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef<(HTMLDivElement | null)[]>([]);

  const steps = useMemo(() => computeSubstrSteps(input), [input]);
  const step = steps[stepIdx];

  const overlayPos = useWindowOverlay(
    containerRef,
    cellRefs,
    step.left,
    step.right,
  );

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
    setStepIdx((prev) => prev + 1);
  }, [steps.length, stop]);

  const play = useCallback(() => {
    if (stepIdx >= steps.length - 1) {
      setStepIdx(0);
    }
    setPlaying(true);
    intervalRef.current = setInterval(() => {
      if (document.hidden) return;
      if (stepIdxRef.current >= steps.length - 1) {
        stop();
        return;
      }
      setStepIdx((prev) => prev + 1);
    }, 800);
  }, [stepIdx, steps.length, stop]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Mirror stepIdx into a ref so the interval and handlers can read the current
  // step and stop outside the updater (ref writes in an effect are fine; a
  // setState there is not).
  useEffect(() => {
    stepIdxRef.current = stepIdx;
  }, [stepIdx]);

  const reset = useCallback(() => {
    stop();
    setStepIdx(0);
  }, [stop]);

  const handleInputChange = useCallback(
    (newInput: string) => {
      reset();
      setInput(newInput);
    },
    [reset],
  );

  const isLast = stepIdx >= steps.length - 1;

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span className="text-[11px] uppercase tracking-[0.2em] text-muted">
          Input
        </span>
        {SUBSTR_PRESETS.map((s) => (
          <Pill
            key={s}
            onClick={() => handleInputChange(s)}
            active={input === s}
          >
            &quot;{s}&quot;
          </Pill>
        ))}
      </div>

      <div className="mb-2">
        <span className="font-mono text-[11px] text-muted">
          longest: {step.longest}
        </span>
      </div>

      <div className="py-4">
        <div
          ref={containerRef}
          className="relative flex items-center justify-center gap-1 sm:gap-1.5"
        >
          {overlayPos && (
            <motion.div
              className="pointer-events-none absolute inset-y-0 rounded-sm border border-foreground/20 bg-foreground/10"
              initial={false}
              animate={overlayPos}
              transition={hoverSpring}
            />
          )}
          {input.split("").map((char, i) => (
            <div
              key={`${input}-${i}`}
              ref={(el) => {
                cellRefs.current[i] = el;
              }}
              className="flex h-10 w-10 items-center justify-center rounded-sm border border-foreground/10 font-mono text-sm sm:h-12 sm:w-12"
            >
              {char}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-1 flex min-h-[1.75rem] flex-wrap items-center gap-1.5">
        <span className="text-[11px] uppercase tracking-[0.2em] text-muted">
          Seen
        </span>
        <AnimatePresence>
          {step.seen.map((char) => (
            <motion.span
              key={char}
              className="inline-flex h-6 items-center rounded-sm border border-foreground/10 px-2 font-mono text-xs text-muted"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={hoverSpring}
            >
              {char}
            </motion.span>
          ))}
        </AnimatePresence>
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
          <motion.div
            key={stepIdx}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            <Narration text={step.narration} />
            {isLast && (
              <p className="mt-1 font-mono text-[13px] font-semibold text-foreground/70">
                Longest: {step.longest} (&quot;{step.longestWindow}&quot;)
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

export default function SlidingWindowContent() {
  const prefersReduced = useHubReducedMotion();
  const t = prefersReduced ? instantTransition : spring.smooth;

  return (
    <div className="min-h-dvh bg-background">
      <PageHeader
        breadcrumbs={[
          { label: "Learn", href: "/learn" },
          { label: "Sliding Window" },
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
              Sliding Window
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              Track a contiguous range of elements. Expand or shrink the window
              instead of recomputing from scratch every time.
            </p>
          </Section>

          {/* Demo 1: Max Sum Subarray */}
          <Section className="mt-14" transition={t}>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted">
              Max sum subarray of size K
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-muted">
              Slide a fixed-size window across the array. Instead of summing all
              K elements each time, subtract the element leaving the window and
              add the one entering.
            </p>
            <div className="mt-6">
              <MaxSumDemo />
            </div>
          </Section>

          {/* Fixed vs Variable window */}
          <Section className="mt-14" transition={t}>
            <div className="border-l-2 border-foreground/10 pl-4">
              <p className="text-[14px] leading-relaxed text-muted">
                <span className="text-foreground">Fixed window</span> — always
                the same size, slides one position at a time. Use when the
                problem says &quot;subarray of size k.&quot;
              </p>
              <p className="mt-2 text-[14px] leading-relaxed text-muted">
                <span className="text-foreground">Variable window</span> — grows
                (expand right) and shrinks (contract left) based on a condition.
                Use when the problem asks for the shortest or longest subarray
                that satisfies something.
              </p>

              <div className="mt-4 grid grid-cols-2 gap-6">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted">
                    Fixed
                  </span>
                  <div className="mt-1.5 space-y-1">
                    <MiniCells count={6} start={0} end={2} />
                    <MiniCells count={6} start={1} end={3} />
                    <MiniCells count={6} start={2} end={4} />
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted">
                    Variable
                  </span>
                  <div className="mt-1.5 space-y-1">
                    <MiniCells count={6} start={0} end={1} />
                    <MiniCells count={6} start={0} end={3} />
                    <MiniCells count={6} start={2} end={3} />
                  </div>
                </div>
              </div>
            </div>
          </Section>

          {/* Demo 2: Longest Substring Without Repeats */}
          <Section className="mt-14" transition={t}>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted">
              Longest substring without repeats
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-muted">
              A variable window. Expand the right edge one character at a time.
              If the new character is already in the window, shrink from the
              left until it&apos;s not.
            </p>
            <div className="mt-6">
              <SubstringDemo />
            </div>
          </Section>

          {/* Code section */}
          <Section className="mt-14" transition={t}>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted">
              Templates
            </h2>

            <p className="mt-4 font-mono text-[12px] text-muted">
              Fixed window
            </p>
            <pre className="mt-2 overflow-x-auto border-l-2 border-foreground/10 bg-foreground/[0.02] py-4 pl-4 pr-3 font-mono text-[13px] leading-relaxed">
              <span className="text-foreground/70">function</span>{" "}
              <span className="text-foreground">fixedWindow</span>(
              <span className="text-foreground">arr</span>:{" "}
              <span className="text-foreground/70">number</span>[],{" "}
              <span className="text-foreground">k</span>:{" "}
              <span className="text-foreground/70">number</span>) {"{\n"}
              {"  "}
              <span className="text-foreground/70">let</span> sum ={" "}
              <span className="text-foreground/50">0</span>
              {"\n"}
              {"  "}
              <span className="text-foreground/70">for</span> (
              <span className="text-foreground/70">let</span> i ={" "}
              <span className="text-foreground/50">0</span>; i {"<"} k; i++) sum
              += arr[i]
              {"\n"}
              {"  "}
              <span className="text-foreground/70">let</span> max = sum
              {"\n\n"}
              {"  "}
              <span className="text-foreground/70">for</span> (
              <span className="text-foreground/70">let</span> i = k; i {"<"}{" "}
              arr.length; i++) {"{\n"}
              {"    "}sum += arr[i] - arr[i - k]
              {"\n"}
              {"    "}max = Math.max(max, sum)
              {"\n"}
              {"  }\n"}
              {"  "}
              <span className="text-foreground/70">return</span> max
              {"\n"}
              {"}"}
            </pre>

            <p className="mt-6 font-mono text-[12px] text-muted">
              Variable window
            </p>
            <pre className="mt-2 overflow-x-auto border-l-2 border-foreground/10 bg-foreground/[0.02] py-4 pl-4 pr-3 font-mono text-[13px] leading-relaxed">
              <span className="text-foreground/70">function</span>{" "}
              <span className="text-foreground">variableWindow</span>(
              <span className="text-foreground">s</span>:{" "}
              <span className="text-foreground/70">string</span>) {"{\n"}
              {"  "}
              <span className="text-foreground/70">const</span> seen ={" "}
              <span className="text-foreground/70">new</span> Set{"<"}
              <span className="text-foreground/70">string</span>
              {">"}()
              {"\n"}
              {"  "}
              <span className="text-foreground/70">let</span> left ={" "}
              <span className="text-foreground/50">0</span>, longest ={" "}
              <span className="text-foreground/50">0</span>
              {"\n\n"}
              {"  "}
              <span className="text-foreground/70">for</span> (
              <span className="text-foreground/70">let</span> r ={" "}
              <span className="text-foreground/50">0</span>; r {"<"} s.length;
              r++) {"{\n"}
              {"    "}
              <span className="text-foreground/70">
                while
              </span> (seen.has(s[r])) {"{\n"}
              {"      "}seen.delete(s[left])
              {"\n"}
              {"      "}left++
              {"\n"}
              {"    }\n"}
              {"    "}seen.add(s[r])
              {"\n"}
              {"    "}longest = Math.max(longest, r - left +{" "}
              <span className="text-foreground/50">1</span>){"\n"}
              {"  }\n"}
              {"  "}
              <span className="text-foreground/70">return</span> longest
              {"\n"}
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
                <li>
                  &quot;Find the max/min/count of a subarray of size k&quot;
                </li>
                <li>Shortest or longest subarray that satisfies a condition</li>
                <li>Contiguous sequence of elements (substring, subarray)</li>
                <li>
                  &quot;Without repeats&quot; or &quot;at most k distinct&quot;
                </li>
              </ul>
              <p className="mt-3 font-mono text-[13px] text-muted">O(n) time</p>
            </div>
          </Section>

          {/* Bottom nav */}
          <nav className="mt-16 flex items-center border-t border-foreground/5 pt-6">
            <Link
              href="/learn/two-pointers"
              className="font-mono text-[13px] text-muted transition-colors hover:text-foreground"
            >
              ← Two Pointers
            </Link>
            <Link
              href="/learn/hash-maps"
              className="ml-auto font-mono text-[13px] text-muted transition-colors hover:text-foreground"
            >
              Hash Maps & Sets →
            </Link>
          </nav>
        </div>
      </main>
    </div>
  );
}
