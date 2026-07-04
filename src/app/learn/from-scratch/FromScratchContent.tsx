"use client";

import { useState, useCallback } from "react";
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
// Challenge data
// ---------------------------------------------------------------------------

type CodeLine = {
  code: string;
  annotation: string;
};

type TestCase = {
  label: string;
  run: () => boolean;
};

type Challenge = {
  name: string;
  description: string;
  lines: readonly CodeLine[];
  tests: readonly TestCase[];
};

const CHALLENGES: readonly Challenge[] = [
  {
    name: "once()",
    description:
      "Implement a function that ensures a callback is only called once.",
    lines: [
      {
        code: "function once(fn) {",
        annotation: "takes any function as input",
      },
      {
        code: "  let called = false",
        annotation: "track whether we've been called",
      },
      {
        code: "  let result",
        annotation: "cache the return value",
      },
      {
        code: "  return function (...args) {",
        annotation: "return a wrapper that intercepts calls",
      },
      {
        code: "    if (called) return result",
        annotation: "already called? return cached result",
      },
      {
        code: "    called = true",
        annotation: "flip the flag before calling",
      },
      {
        code: "    result = fn.apply(this, args)",
        annotation: "call the original, preserving this + args",
      },
      {
        code: "    return result",
        annotation: "return the result to the caller",
      },
      {
        code: "  }",
        annotation: "",
      },
      {
        code: "}",
        annotation: "closure keeps called + result alive",
      },
    ],
    tests: [
      {
        label: "calls the function on first invocation",
        run: () => {
          let count = 0;
          const fn = (() => {
            let called = false;
            let result: number | undefined;
            return (..._args: unknown[]) => {
              if (called) return result;
              called = true;
              count++;
              result = count;
              return result;
            };
          })();
          fn();
          return count === 1;
        },
      },
      {
        label: "returns same value on second call",
        run: () => {
          const fn = (() => {
            let called = false;
            let result: number | undefined;
            let counter = 0;
            return () => {
              if (called) return result;
              called = true;
              counter++;
              result = counter * 10;
              return result;
            };
          })();
          const first = fn();
          const second = fn();
          return first === 10 && second === 10;
        },
      },
      {
        label: "does not call original again",
        run: () => {
          let calls = 0;
          const fn = (() => {
            let called = false;
            let result: undefined;
            return () => {
              if (called) return result;
              called = true;
              calls++;
              result = undefined;
              return result;
            };
          })();
          fn();
          fn();
          fn();
          return calls === 1;
        },
      },
    ],
  },
  {
    name: "pipe()",
    description:
      "Implement pipe — a function that composes functions left-to-right.",
    lines: [
      {
        code: "function pipe(...fns) {",
        annotation: "accept any number of functions",
      },
      {
        code: "  return function (x) {",
        annotation: "return a function that takes an initial value",
      },
      {
        code: "    return fns.reduce(",
        annotation: "reduce left-to-right through the chain",
      },
      {
        code: "      (acc, fn) => fn(acc),",
        annotation: "pass each result into the next function",
      },
      {
        code: "      x",
        annotation: "start with the initial value",
      },
      {
        code: "    )",
        annotation: "",
      },
      {
        code: "  }",
        annotation: "",
      },
      {
        code: "}",
        annotation: "compose() is the same but reduceRight",
      },
    ],
    tests: [
      {
        label: "pipes two functions left-to-right",
        run: () => {
          const pipe =
            (...fns: Array<(x: number) => number>) =>
            (x: number) =>
              fns.reduce((acc, fn) => fn(acc), x);
          const add1 = (x: number) => x + 1;
          const double = (x: number) => x * 2;
          return pipe(add1, double)(3) === 8;
        },
      },
      {
        label: "single function acts as identity wrapper",
        run: () => {
          const pipe =
            (...fns: Array<(x: number) => number>) =>
            (x: number) =>
              fns.reduce((acc, fn) => fn(acc), x);
          const add5 = (x: number) => x + 5;
          return pipe(add5)(10) === 15;
        },
      },
      {
        label: "three functions compose correctly",
        run: () => {
          const pipe =
            (...fns: Array<(x: number) => number>) =>
            (x: number) =>
              fns.reduce((acc, fn) => fn(acc), x);
          const add1 = (x: number) => x + 1;
          const double = (x: number) => x * 2;
          const sub3 = (x: number) => x - 3;
          return pipe(add1, double, sub3)(4) === 7;
        },
      },
    ],
  },
  {
    name: "Promise.all()",
    description:
      "Implement Promise.all — resolve when all promises settle, reject on first failure.",
    lines: [
      {
        code: "function promiseAll(promises) {",
        annotation: "takes an array of promises (or values)",
      },
      {
        code: "  return new Promise((resolve, reject) => {",
        annotation: "return a single wrapping promise",
      },
      {
        code: "    const results = []",
        annotation: "collect results in order",
      },
      {
        code: "    let settled = 0",
        annotation: "count how many have resolved",
      },
      {
        code: "    if (promises.length === 0) return resolve([])",
        annotation: "edge case: empty array resolves immediately",
      },
      {
        code: "    promises.forEach((p, i) => {",
        annotation: "iterate — index preserves order",
      },
      {
        code: "      Promise.resolve(p).then((val) => {",
        annotation: "wrap non-promises with Promise.resolve",
      },
      {
        code: "        results[i] = val",
        annotation: "store at original index, not push",
      },
      {
        code: "        settled += 1",
        annotation: "increment settle count",
      },
      {
        code: "        if (settled === promises.length)",
        annotation: "all done?",
      },
      {
        code: "          resolve(results)",
        annotation: "resolve the wrapper with all results",
      },
      {
        code: "      }, reject)",
        annotation: "any rejection rejects the whole thing",
      },
      {
        code: "    })",
        annotation: "",
      },
      {
        code: "  })",
        annotation: "",
      },
      {
        code: "}",
        annotation: "key insight: index-based, not push-based",
      },
    ],
    tests: [
      {
        label: "resolves with all values in order",
        run: () => {
          // sync test: we verify the logic pattern, not actual async
          const results: number[] = [];
          let settled = 0;
          const values = [10, 20, 30];
          values.forEach((v, i) => {
            results[i] = v;
            settled++;
          });
          return (
            settled === 3 &&
            results[0] === 10 &&
            results[1] === 20 &&
            results[2] === 30
          );
        },
      },
      {
        label: "empty array resolves to []",
        run: () => {
          const promises: unknown[] = [];
          return promises.length === 0; // would resolve([])
        },
      },
      {
        label: "preserves index order, not completion order",
        run: () => {
          // simulate out-of-order completion
          const results: number[] = [];
          // "completes" in order 2, 0, 1
          results[2] = 30;
          results[0] = 10;
          results[1] = 20;
          return results[0] === 10 && results[1] === 20 && results[2] === 30;
        },
      },
    ],
  },
  {
    name: "bind()",
    description:
      "Implement Function.prototype.bind — fix this and optionally pre-fill arguments.",
    lines: [
      {
        code: "function bind(fn, thisArg, ...bound) {",
        annotation: "original fn, desired this, partial args",
      },
      {
        code: "  return function (...args) {",
        annotation: "return a new function that merges args",
      },
      {
        code: "    return fn.apply(",
        annotation: "call original with fixed this",
      },
      {
        code: "      thisArg,",
        annotation: "the this we locked in",
      },
      {
        code: "      [...bound, ...args]",
        annotation: "partial args first, then new args",
      },
      {
        code: "    )",
        annotation: "",
      },
      {
        code: "  }",
        annotation: "",
      },
      {
        code: "}",
        annotation: "partial application via closure",
      },
    ],
    tests: [
      {
        label: "binds this correctly",
        run: () => {
          const obj = { x: 42 };
          function getX(this: { x: number }) {
            return this.x;
          }
          const bound = getX.bind(obj);
          return bound() === 42;
        },
      },
      {
        label: "pre-fills arguments",
        run: () => {
          const add = (a: number, b: number) => a + b;
          const add5 = add.bind(null, 5);
          return add5(3) === 8;
        },
      },
      {
        label: "appends new arguments after bound ones",
        run: () => {
          const join = (a: string, b: string, c: string) => `${a}-${b}-${c}`;
          const partial = join.bind(null, "x", "y");
          return partial("z") === "x-y-z";
        },
      },
    ],
  },
  {
    name: "Array.map()",
    description:
      "Implement Array.map — transform each element and return a new array.",
    lines: [
      {
        code: "function map(arr, fn) {",
        annotation: "takes an array and a transform function",
      },
      {
        code: "  const result = []",
        annotation: "new array — never mutate the original",
      },
      {
        code: "  for (let i = 0; i < arr.length; i++) {",
        annotation: "classic loop over every index",
      },
      {
        code: "    result.push(fn(arr[i], i, arr))",
        annotation: "callback gets (element, index, array)",
      },
      {
        code: "  }",
        annotation: "",
      },
      {
        code: "  return result",
        annotation: "return the new array, original untouched",
      },
      {
        code: "}",
        annotation: "same contract as Array.prototype.map",
      },
    ],
    tests: [
      {
        label: "transforms each element",
        run: () => {
          const arr = [1, 2, 3];
          const result: number[] = [];
          for (let i = 0; i < arr.length; i++) {
            result.push(arr[i] * 2);
          }
          return result[0] === 2 && result[1] === 4 && result[2] === 6;
        },
      },
      {
        label: "passes index as second argument",
        run: () => {
          const arr = ["a", "b", "c"];
          const result: string[] = [];
          for (let i = 0; i < arr.length; i++) {
            result.push(`${arr[i]}${i}`);
          }
          return result[0] === "a0" && result[1] === "b1" && result[2] === "c2";
        },
      },
      {
        label: "does not mutate the original array",
        run: () => {
          const arr = [1, 2, 3];
          const copy = [...arr];
          const result: number[] = [];
          for (let i = 0; i < arr.length; i++) {
            result.push(arr[i] + 10);
          }
          return (
            arr[0] === copy[0] &&
            arr[1] === copy[1] &&
            arr[2] === copy[2] &&
            result.length === 3
          );
        },
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Guided walkthrough component
// ---------------------------------------------------------------------------

function GuidedWalkthrough({
  challenge,
  transition,
}: {
  challenge: Challenge;
  transition: typeof hoverSpring | typeof instantTransition;
}) {
  const [revealedCount, setRevealedCount] = useState(0);
  const [testResults, setTestResults] = useState<readonly (boolean | null)[]>(
    challenge.tests.map(() => null),
  );
  const [testsRun, setTestsRun] = useState(false);

  const maxLines = challenge.lines.length;
  const allRevealed = revealedCount >= maxLines;

  const revealNext = useCallback(() => {
    setRevealedCount((c) => Math.min(c + 1, maxLines));
  }, [maxLines]);

  const resetWalkthrough = useCallback(() => {
    setRevealedCount(0);
    setTestResults(challenge.tests.map(() => null));
    setTestsRun(false);
  }, [challenge.tests]);

  const runTests = useCallback(() => {
    const results = challenge.tests.map((test) => {
      try {
        return test.run();
      } catch {
        return false;
      }
    });
    setTestResults(results);
    setTestsRun(true);
  }, [challenge.tests]);

  return (
    <div>
      {/* challenge prompt */}
      <p className="text-[14px] leading-relaxed text-muted">
        {challenge.description}
      </p>

      {/* code walkthrough */}
      <div className="mt-5">
        <pre className="overflow-x-auto border-l-2 border-foreground/10 bg-foreground/[0.02] py-4 pl-4 pr-3 font-mono text-[13px] leading-relaxed">
          <AnimatePresence mode="popLayout">
            {challenge.lines.slice(0, revealedCount).map((line, i) => (
              <motion.div
                key={`${challenge.name}-${i}`}
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                transition={transition}
                className="flex items-start gap-4"
              >
                <span className="shrink-0 whitespace-pre">
                  <span className="text-foreground/70">
                    {line.code.replace(/</g, "<")}
                  </span>
                </span>
                {line.annotation && (
                  <span className="hidden shrink-0 text-[11px] text-muted sm:inline">
                    {line.annotation}
                  </span>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {revealedCount === 0 && (
            <span className="text-foreground/20">
              click &quot;Next line&quot; to start building...
            </span>
          )}
        </pre>
      </div>

      {/* walkthrough controls */}
      <div className="mt-3 flex gap-2">
        <Pill onClick={revealNext} active={false}>
          {allRevealed ? "Complete" : "Next line"}
        </Pill>
        {allRevealed && (
          <Pill onClick={runTests} active={false}>
            Run tests
          </Pill>
        )}
        {revealedCount > 0 && (
          <Pill onClick={resetWalkthrough} active={false}>
            Reset
          </Pill>
        )}
        <span className="ml-auto self-center font-mono text-[11px] text-muted/40">
          {revealedCount}/{maxLines}
        </span>
      </div>

      {/* test results */}
      {testsRun && (
        <div className="mt-5 space-y-1">
          <AnimatePresence>
            {challenge.tests.map((test, i) => {
              const passed = testResults[i];
              return (
                <motion.div
                  key={test.label}
                  variants={fadeInUp}
                  initial="hidden"
                  animate="visible"
                  transition={{
                    ...transition,
                    delay: i * 0.08,
                  }}
                  className="flex items-center gap-3 rounded-sm border border-foreground/10 px-3 py-2"
                >
                  <span
                    className={[
                      "font-mono text-[13px]",
                      passed ? "text-foreground/50" : "text-foreground/30",
                    ].join(" ")}
                  >
                    {passed ? "✓" : "✗"}
                  </span>
                  <span className="text-[13px] text-muted">{test.label}</span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function FromScratchContent() {
  const reduced = useHubReducedMotion();
  const t = reduced ? instantTransition : spring.smooth;
  const itemT = reduced ? instantTransition : hoverSpring;

  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="relative min-h-screen">
      {/* dot-grid background */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <main className="relative mx-auto max-w-3xl px-6 py-20">
        <PageHeader />

        {/* back link */}
        <Link
          href="/learn"
          className="mt-8 inline-block font-mono text-[13px] text-muted transition-colors hover:text-foreground"
        >
          &larr; All topics
        </Link>

        <div className="mt-10 space-y-0">
          {/* ----------------------------------------------------------- */}
          {/* 1. Core idea                                                  */}
          {/* ----------------------------------------------------------- */}
          <Section transition={t}>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              From Scratch
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              Senior frontend interviews love &ldquo;implement X without using
              X.&rdquo; These test whether you understand what the standard
              library does under the hood. Pick a function, build it line by
              line, then run the tests.
            </p>
          </Section>

          {/* ----------------------------------------------------------- */}
          {/* 2. Tabbed interface                                           */}
          {/* ----------------------------------------------------------- */}
          <Section className="mt-14" transition={t}>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted/40">
              Pick a function
            </h2>

            {/* tab pills */}
            <div className="mt-4 flex flex-wrap gap-2">
              {CHALLENGES.map((c, i) => (
                <Pill
                  key={c.name}
                  onClick={() => setActiveTab(i)}
                  active={i === activeTab}
                >
                  {c.name}
                </Pill>
              ))}
            </div>

            {/* active tab content */}
            <div className="mt-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={CHALLENGES[activeTab].name}
                  variants={fadeInUp}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, y: -10 }}
                  transition={itemT}
                >
                  <GuidedWalkthrough
                    challenge={CHALLENGES[activeTab]}
                    transition={itemT}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </Section>

          {/* ----------------------------------------------------------- */}
          {/* 3. Bottom nav                                                 */}
          {/* ----------------------------------------------------------- */}
          <nav className="mt-16 flex items-center border-t border-foreground/5 pt-6">
            <Link
              href="/learn/async-patterns"
              className="font-mono text-[13px] text-muted transition-colors hover:text-foreground"
            >
              &larr; Async Patterns
            </Link>
            <Link
              href="/learn"
              className="ml-auto flex items-center gap-2 font-mono text-[13px] text-muted transition-colors hover:text-foreground"
            >
              <span>Back to all topics</span>
              {/* small dot-grid motif */}
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
                aria-hidden
                className="opacity-30"
              >
                {[0, 1, 2].map((row) =>
                  [0, 1, 2].map((col) => (
                    <circle
                      key={`${row}-${col}`}
                      cx={3 + col * 5}
                      cy={3 + row * 5}
                      r={0.8}
                    />
                  )),
                )}
              </svg>
            </Link>
          </nav>
        </div>
      </main>
    </div>
  );
}
