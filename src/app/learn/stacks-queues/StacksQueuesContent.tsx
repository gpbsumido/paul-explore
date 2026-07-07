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
// Valid Parentheses demo data & logic
// ---------------------------------------------------------------------------

const PARENS_PRESETS = ["()[]{}", "([)]", "{[]}", "(()", "]{"];

const MATCHING: Record<string, string> = { ")": "(", "]": "[", "}": "{" };
const OPENERS = new Set(["(", "[", "{"]);

type ParensStep = {
  charIndex: number;
  char: string;
  stack: string[];
  action: "push" | "pop" | "mismatch" | "start" | "done";
  narration: string;
  valid?: boolean;
};

function computeParensSteps(s: string): ParensStep[] {
  const steps: ParensStep[] = [];
  const stack: string[] = [];

  steps.push({
    charIndex: -1,
    char: "",
    stack: [],
    action: "start",
    narration: `Start with an empty stack. Scan \`${s}\` left to right.`,
  });

  for (let i = 0; i < s.length; i++) {
    const char = s[i];

    if (OPENERS.has(char)) {
      stack.push(char);
      steps.push({
        charIndex: i,
        char,
        stack: [...stack],
        action: "push",
        narration: `\`${char}\` is an opener — push it onto the stack.`,
      });
    } else {
      const expected = MATCHING[char];
      if (stack.length > 0 && stack[stack.length - 1] === expected) {
        stack.pop();
        steps.push({
          charIndex: i,
          char,
          stack: [...stack],
          action: "pop",
          narration: `\`${char}\` matches top \`${expected}\` — pop it. Match!`,
        });
      } else {
        const top = stack.length > 0 ? stack[stack.length - 1] : "empty";
        steps.push({
          charIndex: i,
          char,
          stack: [...stack],
          action: "mismatch",
          narration: `\`${char}\` expects \`${expected}\` but top is \`${top}\`. Mismatch!`,
          valid: false,
        });
        return steps;
      }
    }
  }

  const valid = stack.length === 0;
  steps.push({
    charIndex: s.length,
    char: "",
    stack: [...stack],
    action: "done",
    narration: valid
      ? "Stack is empty. All brackets matched."
      : `Done scanning but stack still has \`${stack.join("")}\`. Invalid.`,
    valid,
  });

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
// Stack & Queue side-by-side interactive
// ---------------------------------------------------------------------------

function StackQueueDemo() {
  const [stackItems, setStackItems] = useState<number[]>([1, 2, 3]);
  const [stackCounter, setStackCounter] = useState(4);
  const [queueItems, setQueueItems] = useState<number[]>([1, 2, 3]);
  const [queueCounter, setQueueCounter] = useState(4);
  const [newestStack, setNewestStack] = useState<number | null>(null);
  const [newestQueue, setNewestQueue] = useState<number | null>(null);

  const pushStack = useCallback(() => {
    setStackItems((prev) => [...prev, stackCounter]);
    setNewestStack(stackCounter);
    setStackCounter((c) => c + 1);
  }, [stackCounter]);

  const popStack = useCallback(() => {
    setStackItems((prev) => {
      if (prev.length === 0) return prev;
      return prev.slice(0, -1);
    });
    setNewestStack(null);
  }, []);

  const enqueue = useCallback(() => {
    setQueueItems((prev) => [...prev, queueCounter]);
    setNewestQueue(queueCounter);
    setQueueCounter((c) => c + 1);
  }, [queueCounter]);

  const dequeue = useCallback(() => {
    setQueueItems((prev) => {
      if (prev.length === 0) return prev;
      return prev.slice(1);
    });
    setNewestQueue(null);
  }, []);

  return (
    <div className="grid gap-8 sm:grid-cols-2">
      {/* Stack column */}
      <div>
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted/40">
          Stack (LIFO)
        </span>
        <div className="mt-3 flex min-h-[10rem] flex-col-reverse items-center gap-1">
          <AnimatePresence>
            {stackItems.map((item, i) => {
              const isTop = i === stackItems.length - 1;
              return (
                <motion.div
                  key={item}
                  className={[
                    "flex h-8 w-24 items-center justify-center rounded-sm border font-mono text-xs",
                    item === newestStack
                      ? "border-foreground/20 bg-foreground/5"
                      : "border-foreground/10",
                  ].join(" ")}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={hoverSpring}
                  layout
                >
                  {item}
                  {isTop && (
                    <span className="ml-2 text-[10px] text-muted/40">
                      ← top
                    </span>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
          {stackItems.length === 0 && (
            <span className="font-mono text-[11px] text-muted/30">empty</span>
          )}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Pill onClick={pushStack}>push</Pill>
          <Pill onClick={popStack}>pop</Pill>
        </div>
      </div>

      {/* Queue column */}
      <div>
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted/40">
          Queue (FIFO)
        </span>
        <div className="mt-3 flex min-h-[10rem] items-end gap-1">
          <AnimatePresence>
            {queueItems.map((item, i) => {
              const isFront = i === 0;
              return (
                <motion.div
                  key={item}
                  className={[
                    "flex h-10 w-10 flex-col items-center justify-center rounded-sm border font-mono text-xs sm:h-12 sm:w-12",
                    item === newestQueue
                      ? "border-foreground/20 bg-foreground/5"
                      : "border-foreground/10",
                  ].join(" ")}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={hoverSpring}
                  layout
                >
                  {item}
                  {isFront && (
                    <span className="text-[9px] text-muted/40">front</span>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
          {queueItems.length === 0 && (
            <span className="font-mono text-[11px] text-muted/30">empty</span>
          )}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Pill onClick={enqueue}>enqueue</Pill>
          <Pill onClick={dequeue}>dequeue</Pill>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Valid Parentheses interactive demo
// ---------------------------------------------------------------------------

function ParensDemo() {
  const [input, setInput] = useState(PARENS_PRESETS[0]);
  const [stepIdx, setStepIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const steps = useMemo(() => computeParensSteps(input), [input]);
  const step = steps[stepIdx];

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
      if (document.hidden) return;
      setStepIdx((prev) => {
        if (prev >= steps.length - 1) {
          stop();
          return prev;
        }
        return prev + 1;
      });
    }, 800);
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

  const handleInputChange = useCallback(
    (newInput: string) => {
      reset();
      setInput(newInput);
    },
    [reset],
  );

  const isLast = stepIdx >= steps.length - 1;
  const isMismatch = step.action === "mismatch";
  const isDone = step.action === "done";
  const showVerdict = isMismatch || (isDone && step.valid !== undefined);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-[11px] uppercase tracking-[0.2em] text-muted/40">
          Input
        </span>
        {PARENS_PRESETS.map((s) => (
          <Pill
            key={s}
            onClick={() => handleInputChange(s)}
            active={input === s}
          >
            {s}
          </Pill>
        ))}
      </div>

      {/* Input characters */}
      <div className="flex items-center justify-center gap-1 py-4">
        {input.split("").map((char, i) => {
          const isCurrentOrPast = step.charIndex >= i;
          const isCurrent = step.charIndex === i;
          const isError = isMismatch && isCurrent;

          return (
            <motion.div
              key={`${input}-${i}`}
              className={[
                "flex h-10 w-10 items-center justify-center rounded-sm border font-mono text-sm",
                isError
                  ? "border-foreground/50 bg-foreground/10"
                  : isCurrent
                    ? "border-foreground/20 bg-foreground/10"
                    : "border-foreground/10",
              ].join(" ")}
              animate={{
                opacity: isCurrentOrPast || step.action === "start" ? 1 : 0.4,
              }}
              transition={hoverSpring}
            >
              {char}
            </motion.div>
          );
        })}
      </div>

      {/* Stack visualization */}
      <div className="mt-2 flex items-center gap-3">
        <span className="text-[11px] uppercase tracking-[0.2em] text-muted/40">
          Stack
        </span>
        <div className="flex min-h-[2rem] flex-wrap items-center gap-1">
          <AnimatePresence>
            {step.stack.map((char, i) => {
              const isTop = i === step.stack.length - 1;
              const justPushed = step.action === "push" && isTop;
              return (
                <motion.span
                  key={`${i}-${char}`}
                  className={[
                    "inline-flex h-7 w-7 items-center justify-center rounded-sm border font-mono text-xs",
                    justPushed
                      ? "border-foreground/20 bg-foreground/10"
                      : isMismatch && isTop
                        ? "border-foreground/50"
                        : "border-foreground/10",
                  ].join(" ")}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8, y: -8 }}
                  transition={hoverSpring}
                >
                  {char}
                </motion.span>
              );
            })}
          </AnimatePresence>
          {step.stack.length === 0 && step.action !== "start" && (
            <span className="font-mono text-[11px] text-muted/30">empty</span>
          )}
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
        <span className="ml-auto font-mono text-[11px] text-muted/40">
          {stepIdx + 1}/{steps.length}
        </span>
      </div>

      {/* Narration */}
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
            {isLast && showVerdict && (
              <p className="mt-1 font-mono text-[13px] font-semibold text-foreground/70">
                {step.valid ? "valid" : "invalid"}
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

export default function StacksQueuesContent() {
  const prefersReduced = useHubReducedMotion();
  const t = prefersReduced ? instantTransition : spring.smooth;

  return (
    <div className="min-h-dvh bg-background">
      <PageHeader
        breadcrumbs={[
          { label: "Learn", href: "/learn" },
          { label: "Stacks & Queues" },
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
              Stacks & Queues
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              Stack: last in, first out. Queue: first in, first out. That&apos;s
              it. Most of the cleverness is in recognizing which one a problem
              needs.
            </p>
          </Section>

          {/* 2. Side-by-side interactive */}
          <Section className="mt-14" transition={t}>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted/40">
              Push, pop, enqueue, dequeue
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-muted">
              A stack grows and shrinks from the top. A queue grows at the back
              and shrinks from the front.
            </p>
            <div className="mt-6">
              <StackQueueDemo />
            </div>
          </Section>

          {/* 3. Valid Parentheses demo */}
          <Section className="mt-14" transition={t}>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted/40">
              Valid Parentheses
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-muted">
              The classic stack problem. Scan left to right — push openers, pop
              when you find a matching closer. If the stack is empty at the end,
              the string is valid.
            </p>
            <div className="mt-6">
              <ParensDemo />
            </div>
          </Section>

          {/* 4. When to use which */}
          <Section className="mt-14" transition={t}>
            <div className="border-l-2 border-foreground/10 pl-4">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted/40">
                When to use which
              </h3>
              <div className="mt-3 space-y-4">
                <div>
                  <p className="text-[13px] font-semibold text-foreground/70">
                    Stack
                  </p>
                  <ul className="mt-1 space-y-1 text-[13px] text-muted">
                    <li>Undo/redo, back button navigation</li>
                    <li>Matching brackets, parsing nested structures</li>
                    <li>DFS traversal (iterative version)</li>
                    <li>Monotonic stack for next-greater-element</li>
                  </ul>
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-foreground/70">
                    Queue
                  </p>
                  <ul className="mt-1 space-y-1 text-[13px] text-muted">
                    <li>BFS traversal (level by level)</li>
                    <li>Task scheduling, rate limiting</li>
                    <li>Sliding window maximum (with deque)</li>
                    <li>Message queues, event loops</li>
                  </ul>
                </div>
              </div>
            </div>
          </Section>

          {/* 5. Code section */}
          <Section className="mt-14" transition={t}>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted/40">
              Templates
            </h2>

            <p className="mt-4 font-mono text-[12px] text-muted/40">
              Stack — valid parentheses
            </p>
            <pre className="mt-2 overflow-x-auto border-l-2 border-foreground/10 bg-foreground/[0.02] py-4 pl-4 pr-3 font-mono text-[13px] leading-relaxed">
              <span className="text-foreground/70">function</span> isValid( s:{" "}
              <span className="text-foreground/70">string</span>) {"{\n"}
              {"  "}
              <span className="text-foreground/70">const</span> stack:{" "}
              <span className="text-foreground/70">string</span>[] = []
              {"\n"}
              {"  "}
              <span className="text-foreground/70">const</span> map = {"{"}{" "}
              <span className="text-foreground/50">
                &quot;)&quot;: &quot;(&quot;, &quot;]&quot;: &quot;[&quot;,
                &quot;{"}{"}&quot;: &quot;{"{"}
              </span>
              &quot; {"}"}
              {"\n\n"}
              {"  "}
              <span className="text-foreground/70">for</span> (
              <span className="text-foreground/70">const</span> c{" "}
              <span className="text-foreground/70">of</span> s) {"{\n"}
              {"    "}
              <span className="text-foreground/70">if</span> (c{" "}
              <span className="text-foreground/70">in</span> map) {"{\n"}
              {"      "}
              <span className="text-foreground/70">if</span> (stack.pop() !==
              map[c]) <span className="text-foreground/70">return</span>{" "}
              <span className="text-foreground/50">false</span>
              {"\n"}
              {"    } "}
              <span className="text-foreground/70">else</span> {"{\n"}
              {"      "}stack.push(c)
              {"\n"}
              {"    }\n"}
              {"  }\n"}
              {"  "}
              <span className="text-foreground/70">return</span> stack.length
              === <span className="text-foreground/50">0</span>
              {"\n"}
              {"}"}
            </pre>

            <p className="mt-6 font-mono text-[12px] text-muted/40">
              Queue — BFS level order
            </p>
            <pre className="mt-2 overflow-x-auto border-l-2 border-foreground/10 bg-foreground/[0.02] py-4 pl-4 pr-3 font-mono text-[13px] leading-relaxed">
              <span className="text-foreground/70">function</span> bfs(root:{" "}
              <span className="text-foreground/70">Node</span>) {"{\n"}
              {"  "}
              <span className="text-foreground/70">const</span> queue = [root]
              {"\n\n"}
              {"  "}
              <span className="text-foreground/70">
                while
              </span> (queue.length) {"{\n"}
              {"    "}
              <span className="text-foreground/70">const</span> node =
              queue.shift()!
              {"\n"}
              {"    "}
              <span className="text-foreground/25">{"// process node"}</span>
              {"\n"}
              {"    "}
              <span className="text-foreground/70">for</span> (
              <span className="text-foreground/70">const</span> child{" "}
              <span className="text-foreground/70">of</span> node.children)
              {"\n"}
              {"      "}queue.push(child)
              {"\n"}
              {"  }\n"}
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
                <li>
                  Nested structures that need matching (brackets, HTML tags)
                </li>
                <li>
                  &quot;Process in order&quot; or &quot;level by level&quot;
                </li>
                <li>
                  &quot;Next greater/smaller element&quot; — monotonic stack
                </li>
                <li>Undo, backtrack, or &quot;most recent first&quot;</li>
              </ul>
              <p className="mt-3 font-mono text-[13px] text-muted/60">
                O(n) time, O(n) space
              </p>
            </div>
          </Section>

          {/* 7. Bottom nav */}
          <nav className="mt-16 flex items-center border-t border-foreground/5 pt-6">
            <Link
              href="/learn/hash-maps"
              className="font-mono text-[13px] text-muted transition-colors hover:text-foreground"
            >
              ← Hash Maps & Sets
            </Link>
            <Link
              href="/learn/binary-search"
              className="ml-auto font-mono text-[13px] text-muted transition-colors hover:text-foreground"
            >
              Binary Search →
            </Link>
          </nav>
        </div>
      </main>
    </div>
  );
}
