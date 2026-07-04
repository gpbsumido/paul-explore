"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useInView } from "framer-motion";
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

function Kw({ children }: { children: React.ReactNode }) {
  return <span className="text-foreground/70">{children}</span>;
}

function Str({ children }: { children: React.ReactNode }) {
  return <span className="text-foreground/50">{children}</span>;
}

function Cmt({ children }: { children: React.ReactNode }) {
  return <span className="text-foreground/25">{children}</span>;
}

// ---------------------------------------------------------------------------
// Event loop simulator data
// ---------------------------------------------------------------------------

type QueueItem = {
  id: string;
  label: string;
  location: "callstack" | "microtask" | "macrotask" | "done";
  output?: string;
};

type Snippet = {
  name: string;
  steps: readonly QueueItem[][];
  narrations: readonly string[];
};

const SNIPPETS: readonly Snippet[] = [
  {
    name: "console logs",
    steps: [
      // step 0: push log('1')
      [{ id: "a", label: "console.log('1')", location: "callstack" }],
      // step 1: execute log('1'), push log('2')
      [
        { id: "a", label: "console.log('1')", location: "done", output: "1" },
        { id: "b", label: "console.log('2')", location: "callstack" },
      ],
      // step 2: execute log('2'), push log('3')
      [
        { id: "a", label: "console.log('1')", location: "done", output: "1" },
        { id: "b", label: "console.log('2')", location: "done", output: "2" },
        { id: "c", label: "console.log('3')", location: "callstack" },
      ],
      // step 3: all done
      [
        { id: "a", label: "console.log('1')", location: "done", output: "1" },
        { id: "b", label: "console.log('2')", location: "done", output: "2" },
        { id: "c", label: "console.log('3')", location: "done", output: "3" },
      ],
    ],
    narrations: [
      "Push console.log('1') onto call stack.",
      "Execute. Output: 1. Push console.log('2').",
      "Execute. Output: 2. Push console.log('3').",
      "Execute. Output: 3. Call stack empty. Done.",
    ],
  },
  {
    name: "setTimeout + Promise",
    steps: [
      // step 0: push log('start')
      [
        { id: "a", label: "console.log('start')", location: "callstack" },
        { id: "b", label: "setTimeout(cb, 0)", location: "callstack" },
        { id: "c", label: "Promise.resolve().then(cb)", location: "callstack" },
        { id: "d", label: "console.log('end')", location: "callstack" },
      ],
      // step 1: execute log('start'), register setTimeout
      [
        {
          id: "a",
          label: "console.log('start')",
          location: "done",
          output: "start",
        },
        { id: "b", label: "setTimeout(cb, 0)", location: "callstack" },
        { id: "c", label: "Promise.resolve().then(cb)", location: "callstack" },
        { id: "d", label: "console.log('end')", location: "callstack" },
      ],
      // step 2: setTimeout registers callback to macrotask queue
      [
        {
          id: "a",
          label: "console.log('start')",
          location: "done",
          output: "start",
        },
        { id: "b2", label: "() => log('timeout')", location: "macrotask" },
        { id: "c", label: "Promise.resolve().then(cb)", location: "callstack" },
        { id: "d", label: "console.log('end')", location: "callstack" },
      ],
      // step 3: promise.then registers to microtask queue
      [
        {
          id: "a",
          label: "console.log('start')",
          location: "done",
          output: "start",
        },
        { id: "b2", label: "() => log('timeout')", location: "macrotask" },
        { id: "c2", label: "() => log('promise')", location: "microtask" },
        { id: "d", label: "console.log('end')", location: "callstack" },
      ],
      // step 4: execute log('end')
      [
        {
          id: "a",
          label: "console.log('start')",
          location: "done",
          output: "start",
        },
        { id: "b2", label: "() => log('timeout')", location: "macrotask" },
        { id: "c2", label: "() => log('promise')", location: "microtask" },
        {
          id: "d",
          label: "console.log('end')",
          location: "done",
          output: "end",
        },
      ],
      // step 5: drain microtask queue (promise callback)
      [
        {
          id: "a",
          label: "console.log('start')",
          location: "done",
          output: "start",
        },
        { id: "b2", label: "() => log('timeout')", location: "macrotask" },
        { id: "c2", label: "() => log('promise')", location: "callstack" },
        {
          id: "d",
          label: "console.log('end')",
          location: "done",
          output: "end",
        },
      ],
      // step 6: promise callback executed
      [
        {
          id: "a",
          label: "console.log('start')",
          location: "done",
          output: "start",
        },
        { id: "b2", label: "() => log('timeout')", location: "macrotask" },
        {
          id: "c2",
          label: "() => log('promise')",
          location: "done",
          output: "promise",
        },
        {
          id: "d",
          label: "console.log('end')",
          location: "done",
          output: "end",
        },
      ],
      // step 7: macrotask callback to call stack
      [
        {
          id: "a",
          label: "console.log('start')",
          location: "done",
          output: "start",
        },
        { id: "b2", label: "() => log('timeout')", location: "callstack" },
        {
          id: "c2",
          label: "() => log('promise')",
          location: "done",
          output: "promise",
        },
        {
          id: "d",
          label: "console.log('end')",
          location: "done",
          output: "end",
        },
      ],
      // step 8: all done
      [
        {
          id: "a",
          label: "console.log('start')",
          location: "done",
          output: "start",
        },
        {
          id: "b2",
          label: "() => log('timeout')",
          location: "done",
          output: "timeout",
        },
        {
          id: "c2",
          label: "() => log('promise')",
          location: "done",
          output: "promise",
        },
        {
          id: "d",
          label: "console.log('end')",
          location: "done",
          output: "end",
        },
      ],
    ],
    narrations: [
      "Parse all four statements. Push them onto the call stack.",
      "Execute console.log('start'). Output: start.",
      "setTimeout registers its callback to the macrotask queue.",
      "Promise.resolve().then registers its callback to the microtask queue.",
      "Execute console.log('end'). Output: end. Call stack is now empty.",
      "Call stack empty — drain microtask queue first. Move promise callback to call stack.",
      "Execute promise callback. Output: promise. Microtask queue empty.",
      "Now process macrotask queue. Move timeout callback to call stack.",
      "Execute timeout callback. Output: timeout. All queues empty. Done.",
    ],
  },
  {
    name: "nested microtasks",
    steps: [
      // step 0: initial setup
      [
        { id: "a", label: "console.log('A')", location: "callstack" },
        { id: "b", label: "queueMicrotask(cb1)", location: "callstack" },
        { id: "c", label: "console.log('D')", location: "callstack" },
      ],
      // step 1: execute log('A')
      [
        { id: "a", label: "console.log('A')", location: "done", output: "A" },
        { id: "b", label: "queueMicrotask(cb1)", location: "callstack" },
        { id: "c", label: "console.log('D')", location: "callstack" },
      ],
      // step 2: register microtask (cb1 logs B then queues cb2)
      [
        { id: "a", label: "console.log('A')", location: "done", output: "A" },
        {
          id: "b2",
          label: "cb1: log('B') + queue(cb2)",
          location: "microtask",
        },
        { id: "c", label: "console.log('D')", location: "callstack" },
      ],
      // step 3: execute log('D')
      [
        { id: "a", label: "console.log('A')", location: "done", output: "A" },
        {
          id: "b2",
          label: "cb1: log('B') + queue(cb2)",
          location: "microtask",
        },
        { id: "c", label: "console.log('D')", location: "done", output: "D" },
      ],
      // step 4: drain microtask — run cb1
      [
        { id: "a", label: "console.log('A')", location: "done", output: "A" },
        {
          id: "b2",
          label: "cb1: log('B') + queue(cb2)",
          location: "callstack",
        },
        { id: "c", label: "console.log('D')", location: "done", output: "D" },
      ],
      // step 5: cb1 logs B, queues cb2
      [
        { id: "a", label: "console.log('A')", location: "done", output: "A" },
        {
          id: "b2",
          label: "cb1: log('B') + queue(cb2)",
          location: "done",
          output: "B",
        },
        { id: "c", label: "console.log('D')", location: "done", output: "D" },
        { id: "e", label: "cb2: log('C')", location: "microtask" },
      ],
      // step 6: drain new microtask cb2
      [
        { id: "a", label: "console.log('A')", location: "done", output: "A" },
        {
          id: "b2",
          label: "cb1: log('B') + queue(cb2)",
          location: "done",
          output: "B",
        },
        { id: "c", label: "console.log('D')", location: "done", output: "D" },
        { id: "e", label: "cb2: log('C')", location: "callstack" },
      ],
      // step 7: all done
      [
        { id: "a", label: "console.log('A')", location: "done", output: "A" },
        {
          id: "b2",
          label: "cb1: log('B') + queue(cb2)",
          location: "done",
          output: "B",
        },
        { id: "c", label: "console.log('D')", location: "done", output: "D" },
        { id: "e", label: "cb2: log('C')", location: "done", output: "C" },
      ],
    ],
    narrations: [
      "Parse synchronous code and one queueMicrotask call.",
      "Execute console.log('A'). Output: A.",
      "queueMicrotask registers cb1 to microtask queue. cb1 will log B and queue another microtask.",
      "Execute console.log('D'). Output: D. Call stack empty.",
      "Drain microtask queue. Move cb1 to call stack.",
      "cb1 logs B and queues cb2. Output: B. New microtask cb2 added.",
      "Microtask queue not empty yet — drain cb2 too. Nested microtasks run before any macrotask.",
      "Execute cb2. Output: C. All queues empty. Final order: A, D, B, C.",
    ],
  },
];

// ---------------------------------------------------------------------------
// Event loop simulator component
// ---------------------------------------------------------------------------

function EventLoopSimulator() {
  const [snippetIdx, setSnippetIdx] = useState(0);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reduced = useHubReducedMotion();
  const t = reduced ? instantTransition : hoverSpring;

  const snippet = SNIPPETS[snippetIdx];
  const currentItems = snippet.steps[step];
  const narration = snippet.narrations[step];
  const maxStep = snippet.steps.length - 1;

  const stopPlay = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setPlaying(false);
  }, []);

  const handleStep = useCallback(() => {
    setStep((s) => {
      if (s >= maxStep) {
        stopPlay();
        return s;
      }
      return s + 1;
    });
  }, [maxStep, stopPlay]);

  const handlePlay = useCallback(() => {
    if (playing) {
      stopPlay();
      return;
    }
    setPlaying(true);
    intervalRef.current = setInterval(() => {
      setStep((s) => {
        if (s >= maxStep) {
          stopPlay();
          return s;
        }
        return s + 1;
      });
    }, 800);
  }, [playing, maxStep, stopPlay]);

  const handleReset = useCallback(() => {
    stopPlay();
    setStep(0);
  }, [stopPlay]);

  const selectSnippet = useCallback(
    (idx: number) => {
      stopPlay();
      setSnippetIdx(idx);
      setStep(0);
    },
    [stopPlay],
  );

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const getItemsForLocation = (loc: "callstack" | "microtask" | "macrotask") =>
    currentItems.filter((item) => item.location === loc);

  const outputs = currentItems
    .filter((item) => item.output)
    .map((item) => item.output!);

  return (
    <div>
      {/* snippet presets */}
      <div className="flex flex-wrap gap-2">
        {SNIPPETS.map((s, i) => (
          <Pill
            key={s.name}
            onClick={() => selectSnippet(i)}
            active={i === snippetIdx}
          >
            {s.name}
          </Pill>
        ))}
      </div>

      {/* three columns */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        {(["callstack", "microtask", "macrotask"] as const).map((col) => {
          const label =
            col === "callstack"
              ? "Call Stack"
              : col === "microtask"
                ? "Microtask Queue"
                : "Macrotask Queue";
          const items = getItemsForLocation(col);
          return (
            <div key={col} className="min-h-[120px]">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted/40">
                {label}
              </p>
              <div className="mt-2 space-y-1.5">
                <AnimatePresence mode="popLayout">
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      variants={fadeInUp}
                      initial="hidden"
                      animate="visible"
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={t}
                      className="rounded-sm border border-foreground/10 bg-foreground/10 px-2 py-1.5 font-mono text-[11px] leading-tight text-foreground/70"
                    >
                      {item.label}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>

      {/* output */}
      <div className="mt-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted/40">
          Output
        </p>
        <div className="mt-2 min-h-[32px] font-mono text-[13px] text-foreground/60">
          <AnimatePresence mode="popLayout">
            {outputs.map((o, i) => (
              <motion.span
                key={`${snippetIdx}-${o}-${i}`}
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                transition={t}
                className="mr-3"
              >
                {o}
              </motion.span>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* narration */}
      <AnimatePresence mode="wait">
        <motion.p
          key={`${snippetIdx}-${step}`}
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={t}
          className="mt-3 text-[13px] text-muted"
        >
          {narration}
        </motion.p>
      </AnimatePresence>

      {/* controls */}
      <div className="mt-4 flex gap-2">
        <Pill onClick={handleStep} active={false}>
          Step
        </Pill>
        <Pill onClick={handlePlay} active={playing}>
          {playing ? "Pause" : "Play"}
        </Pill>
        <Pill onClick={handleReset} active={false}>
          Reset
        </Pill>
        <span className="ml-auto font-mono text-[11px] text-muted/40 self-center">
          {step}/{maxStep}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Promise patterns visual (scroll-triggered SVG timelines)
// ---------------------------------------------------------------------------

function PromisePatternsVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduced = useHubReducedMotion();

  // each pattern: label, bars (start%, width%), resolution dot x%
  const patterns = [
    {
      label: "Promise.all",
      bars: [
        { start: 5, width: 50 },
        { start: 5, width: 70 },
        { start: 5, width: 40 },
      ],
      dots: [{ x: 75 }], // resolves when slowest finishes
      note: "resolves when all settle",
    },
    {
      label: "Promise.allSettled",
      bars: [
        { start: 5, width: 50 },
        { start: 5, width: 70 },
        { start: 5, width: 40 },
      ],
      dots: [{ x: 75 }],
      note: "always resolves (no short-circuit)",
    },
    {
      label: "Promise.race",
      bars: [
        { start: 5, width: 50 },
        { start: 5, width: 70 },
        { start: 5, width: 40 },
      ],
      dots: [{ x: 45 }], // resolves at first finish
      note: "resolves at first settlement",
    },
  ];

  return (
    <div ref={ref} className="space-y-8">
      {patterns.map((p) => (
        <div key={p.label}>
          <p className="font-mono text-[11px] text-muted/40">{p.label}</p>
          <svg
            viewBox="0 0 400 70"
            className="mt-2 w-full"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            aria-hidden
          >
            {/* horizontal baseline */}
            <line
              x1={20}
              y1={55}
              x2={380}
              y2={55}
              strokeWidth={1}
              strokeOpacity={0.15}
            />

            {/* task bars */}
            {p.bars.map((bar, i) => {
              const y = 10 + i * 16;
              const x = (bar.start / 100) * 360 + 20;
              const w = (bar.width / 100) * 360;
              return (
                <motion.rect
                  key={i}
                  x={x}
                  y={y}
                  width={w}
                  height={10}
                  rx={2}
                  fill="currentColor"
                  fillOpacity={0.08 + i * 0.05}
                  stroke="none"
                  initial={{ scaleX: 0 }}
                  animate={inView ? { scaleX: 1 } : { scaleX: 0 }}
                  transition={
                    reduced
                      ? { duration: 0 }
                      : {
                          type: "spring",
                          stiffness: 120,
                          damping: 20,
                          delay: i * 0.12,
                        }
                  }
                  style={{ originX: "0%" }}
                />
              );
            })}

            {/* task labels */}
            {p.bars.map((bar, i) => {
              const y = 10 + i * 16 + 8;
              const x = (bar.start / 100) * 360 + 22;
              return (
                <text
                  key={`lbl-${i}`}
                  x={x}
                  y={y}
                  fontSize="7"
                  fontFamily="var(--font-mono, monospace)"
                  fill="currentColor"
                  stroke="none"
                  opacity={0.3}
                >
                  task {i + 1}
                </text>
              );
            })}

            {/* resolution dots */}
            {p.dots.map((dot, i) => {
              const cx = (dot.x / 100) * 360 + 20;
              return (
                <motion.circle
                  key={i}
                  cx={cx}
                  cy={55}
                  r={4}
                  fill="currentColor"
                  fillOpacity={0.25}
                  stroke="currentColor"
                  strokeWidth={1}
                  strokeOpacity={0.3}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={
                    inView ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }
                  }
                  transition={
                    reduced
                      ? { duration: 0 }
                      : {
                          type: "spring",
                          stiffness: 200,
                          damping: 18,
                          delay: 0.5,
                        }
                  }
                />
              );
            })}

            {/* resolution label */}
            <text
              x={(p.dots[0].x / 100) * 360 + 20}
              y={68}
              textAnchor="middle"
              fontSize="7"
              fontFamily="var(--font-mono, monospace)"
              fill="currentColor"
              stroke="none"
              opacity={0.25}
            >
              {p.note}
            </text>
          </svg>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sequential vs parallel SVG timelines
// ---------------------------------------------------------------------------

function SequentialVsParallel() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduced = useHubReducedMotion();

  return (
    <div ref={ref}>
      {/* Sequential code */}
      <p className="font-mono text-[12px] text-muted/40">
        Sequential (awaiting in a loop)
      </p>
      <pre className="mt-2 overflow-x-auto border-l-2 border-foreground/10 bg-foreground/[0.02] py-4 pl-4 pr-3 font-mono text-[13px] leading-relaxed">
        <Kw>for</Kw> (<Kw>const</Kw> url <Kw>of</Kw> urls) {"{\n"}
        {"  "}
        <Kw>const</Kw> res = <Kw>await</Kw> fetch(url){"\n"}
        {"  "}
        <Kw>const</Kw> data = <Kw>await</Kw> res.json(){"\n"}
        {"  "}results.push(data){"\n"}
        {"}"}
      </pre>

      {/* Sequential timeline */}
      <svg
        viewBox="0 0 400 40"
        className="mt-3 w-full"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        aria-hidden
      >
        <line
          x1={20}
          y1={20}
          x2={380}
          y2={20}
          strokeWidth={1}
          strokeOpacity={0.1}
        />
        {[0, 1, 2].map((i) => {
          const x = 20 + i * 110;
          return (
            <motion.rect
              key={i}
              x={x}
              y={12}
              width={100}
              height={16}
              rx={2}
              fill="currentColor"
              fillOpacity={0.08 + i * 0.04}
              stroke="none"
              initial={{ scaleX: 0 }}
              animate={inView ? { scaleX: 1 } : { scaleX: 0 }}
              transition={
                reduced
                  ? { duration: 0 }
                  : {
                      type: "spring",
                      stiffness: 120,
                      damping: 20,
                      delay: i * 0.15,
                    }
              }
              style={{ originX: "0%" }}
            />
          );
        })}
        <text
          x={358}
          y={36}
          fontSize="8"
          fontFamily="var(--font-mono, monospace)"
          fill="currentColor"
          stroke="none"
          opacity={0.3}
        >
          ~3s total
        </text>
      </svg>

      {/* Parallel code */}
      <p className="mt-8 font-mono text-[12px] text-muted/40">
        Parallel (Promise.all)
      </p>
      <pre className="mt-2 overflow-x-auto border-l-2 border-foreground/10 bg-foreground/[0.02] py-4 pl-4 pr-3 font-mono text-[13px] leading-relaxed">
        <Kw>const</Kw> results = <Kw>await</Kw> Promise.all({"\n"}
        {"  "}urls.map(<Kw>async</Kw> (url) {"=> {\n"}
        {"    "}
        <Kw>const</Kw> res = <Kw>await</Kw> fetch(url){"\n"}
        {"    "}
        <Kw>return</Kw> res.json(){"\n"}
        {"  "}
        {"}"}
        {"\n"}){"\n"}
        {")"}
      </pre>

      {/* Parallel timeline */}
      <svg
        viewBox="0 0 400 60"
        className="mt-3 w-full"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        aria-hidden
      >
        <line
          x1={20}
          y1={45}
          x2={380}
          y2={45}
          strokeWidth={1}
          strokeOpacity={0.1}
        />
        {[0, 1, 2].map((i) => {
          const y = 6 + i * 14;
          const w = 80 + i * 20; // varying widths to show different resolve times
          return (
            <motion.rect
              key={i}
              x={20}
              y={y}
              width={w}
              height={10}
              rx={2}
              fill="currentColor"
              fillOpacity={0.08 + i * 0.04}
              stroke="none"
              initial={{ scaleX: 0 }}
              animate={inView ? { scaleX: 1 } : { scaleX: 0 }}
              transition={
                reduced
                  ? { duration: 0 }
                  : {
                      type: "spring",
                      stiffness: 120,
                      damping: 20,
                      delay: i * 0.08,
                    }
              }
              style={{ originX: "0%" }}
            />
          );
        })}
        {/* resolution dot at slowest */}
        <motion.circle
          cx={140}
          cy={45}
          r={4}
          fill="currentColor"
          fillOpacity={0.25}
          stroke="currentColor"
          strokeWidth={1}
          strokeOpacity={0.3}
          initial={{ scale: 0 }}
          animate={inView ? { scale: 1 } : { scale: 0 }}
          transition={
            reduced
              ? { duration: 0 }
              : { delay: 0.5, type: "spring", stiffness: 200, damping: 18 }
          }
        />
        <text
          x={140}
          y={58}
          textAnchor="middle"
          fontSize="8"
          fontFamily="var(--font-mono, monospace)"
          fill="currentColor"
          stroke="none"
          opacity={0.3}
        >
          ~1s total
        </text>
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function AsyncContent() {
  const reduced = useHubReducedMotion();
  const t = reduced ? instantTransition : spring.smooth;

  return (
    <div className="min-h-dvh bg-background">
      <PageHeader
        breadcrumbs={[
          { label: "Learn", href: "/learn" },
          { label: "Async Patterns" },
        ]}
        maxWidth="max-w-3xl"
      />

      <main className="relative mx-auto max-w-3xl px-4 py-12 sm:py-16">
        {/* dot-grid background */}
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
          {/* back link */}
          <Link
            href="/learn"
            className="mb-10 inline-flex items-center gap-1 font-mono text-[13px] text-muted transition-colors hover:text-foreground"
          >
            &larr; All topics
          </Link>

          <div className="mt-10 space-y-0">
            {/* ----------------------------------------------------------- */}
            {/* 1. Core idea                                                  */}
            {/* ----------------------------------------------------------- */}
            <Section transition={t}>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Async Patterns
              </h1>
              <p className="mt-3 text-[15px] leading-relaxed text-muted">
                JavaScript is single-threaded. The event loop, microtask queue,
                and macrotask queue determine when your async code actually
                runs. Understanding the order isn&apos;t optional &mdash;
                it&apos;s the difference between code that works and code that
                works by accident.
              </p>
            </Section>

            {/* ----------------------------------------------------------- */}
            {/* 2. Event loop simulator                                       */}
            {/* ----------------------------------------------------------- */}
            <Section className="mt-14" transition={t}>
              <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted/40">
                Event loop simulator
              </h2>
              <p className="mt-3 text-[14px] leading-relaxed text-muted">
                Pick a snippet and step through it. Watch items move between the
                call stack and the two queues. Microtasks always drain before
                the next macrotask runs.
              </p>
              <div className="mt-6">
                <EventLoopSimulator />
              </div>
            </Section>

            {/* ----------------------------------------------------------- */}
            {/* 3. Promise patterns visual                                    */}
            {/* ----------------------------------------------------------- */}
            <Section className="mt-14" transition={t}>
              <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted/40">
                Promise combinators
              </h2>
              <p className="mt-3 text-[14px] leading-relaxed text-muted">
                Three tasks start at the same time. The difference is when the
                combinator resolves.{" "}
                <span className="font-mono text-foreground/70">
                  Promise.all
                </span>{" "}
                waits for every task.{" "}
                <span className="font-mono text-foreground/70">
                  Promise.race
                </span>{" "}
                resolves at the first settlement.{" "}
                <span className="font-mono text-foreground/70">
                  Promise.allSettled
                </span>{" "}
                never short-circuits.
              </p>
              <div className="mt-6">
                <PromisePatternsVisual />
              </div>
            </Section>

            {/* ----------------------------------------------------------- */}
            {/* 4. Sequential vs parallel                                     */}
            {/* ----------------------------------------------------------- */}
            <Section className="mt-14" transition={t}>
              <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted/40">
                Sequential vs parallel
              </h2>
              <p className="mt-3 text-[14px] leading-relaxed text-muted">
                Awaiting in a loop runs each request after the previous one
                finishes. Wrapping them in{" "}
                <span className="font-mono text-foreground/70">
                  Promise.all
                </span>{" "}
                fires them all at once. The code looks almost the same. The
                performance gap is 3&times;.
              </p>
              <div className="mt-6">
                <SequentialVsParallel />
              </div>
            </Section>

            {/* ----------------------------------------------------------- */}
            {/* 5. Code section                                               */}
            {/* ----------------------------------------------------------- */}
            <Section className="mt-14" transition={t}>
              <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted/40">
                The patterns
              </h2>

              <p className="mt-4 font-mono text-[12px] text-muted/40">
                Event loop quiz answer
              </p>
              <pre className="mt-2 overflow-x-auto border-l-2 border-foreground/10 bg-foreground/[0.02] py-4 pl-4 pr-3 font-mono text-[13px] leading-relaxed">
                console.log(<Str>&apos;1&apos;</Str>){"\n"}
                setTimeout(() {"=>"} console.log(<Str>&apos;2&apos;</Str>), 0)
                {"\n"}
                Promise.resolve().then(() {"=>"} console.log(
                <Str>&apos;3&apos;</Str>)){"\n"}
                console.log(<Str>&apos;4&apos;</Str>){"\n\n"}
                <Cmt>{"// Output: 1, 4, 3, 2"}</Cmt>
                {"\n"}
                <Cmt>{"// sync first, then microtask, then macrotask"}</Cmt>
              </pre>

              <p className="mt-6 font-mono text-[12px] text-muted/40">
                Promise.all usage
              </p>
              <pre className="mt-2 overflow-x-auto border-l-2 border-foreground/10 bg-foreground/[0.02] py-4 pl-4 pr-3 font-mono text-[13px] leading-relaxed">
                <Kw>const</Kw> [users, posts] = <Kw>await</Kw> Promise.all([
                {"\n"}
                {"  "}fetch(<Str>&apos;/api/users&apos;</Str>).then(r {"=>"}{" "}
                r.json()),{"\n"}
                {"  "}fetch(<Str>&apos;/api/posts&apos;</Str>).then(r {"=>"}{" "}
                r.json()),{"\n"}
                ]){"\n\n"}
                <Cmt>{"// both requests fly in parallel"}</Cmt>
                {"\n"}
                <Cmt>{"// rejects immediately if any fails"}</Cmt>
              </pre>

              <p className="mt-6 font-mono text-[12px] text-muted/40">
                Error handling with try/catch
              </p>
              <pre className="mt-2 overflow-x-auto border-l-2 border-foreground/10 bg-foreground/[0.02] py-4 pl-4 pr-3 font-mono text-[13px] leading-relaxed">
                <Kw>try</Kw> {"{\n"}
                {"  "}
                <Kw>const</Kw> data = <Kw>await</Kw> fetchData(){"\n"}
                {"  "}render(data){"\n"}
                {"}"} <Kw>catch</Kw> (err) {"{\n"}
                {"  "}showError(err.message){"\n"}
                {"}"} <Kw>finally</Kw> {"{\n"}
                {"  "}hideSpinner(){"\n"}
                {"}"}
                {"\n\n"}
                <Cmt>{"// finally always runs — cleanup goes here"}</Cmt>
              </pre>
            </Section>

            {/* ----------------------------------------------------------- */}
            {/* 6. Spot this pattern                                          */}
            {/* ----------------------------------------------------------- */}
            <Section className="mt-14" transition={t}>
              <div className="border-l-2 border-foreground/15 pl-4">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted/40">
                  Spot this pattern
                </h3>
                <ul className="mt-3 space-y-1.5 text-[13px] text-muted">
                  <li>
                    &ldquo;What&apos;s the output?&rdquo; interview questions
                    mixing setTimeout and Promises
                  </li>
                  <li>
                    Managing concurrent API calls — fetching user data and posts
                    in parallel
                  </li>
                  <li>
                    Error handling across async boundaries without swallowing
                    failures
                  </li>
                  <li>
                    Race conditions from stale closures over awaited values
                  </li>
                </ul>
                <p className="mt-3 font-mono text-[13px] text-muted/60">
                  Microtasks before macrotasks, always
                </p>
              </div>
            </Section>

            {/* ----------------------------------------------------------- */}
            {/* 7. Bottom nav                                                 */}
            {/* ----------------------------------------------------------- */}
            <nav className="mt-16 flex items-center border-t border-foreground/5 pt-6">
              <Link
                href="/learn/event-delegation"
                className="font-mono text-[13px] text-muted transition-colors hover:text-foreground"
              >
                &larr; Event Delegation
              </Link>
              <Link
                href="/learn/from-scratch"
                className="ml-auto font-mono text-[13px] text-muted transition-colors hover:text-foreground"
              >
                From Scratch &rarr;
              </Link>
            </nav>
          </div>
        </div>
      </main>
    </div>
  );
}
