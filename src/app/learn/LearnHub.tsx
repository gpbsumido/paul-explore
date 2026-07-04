"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import {
  spring,
  fadeInUp,
  staggerContainer,
  instantTransition,
} from "@/lib/animations";
import { useHubReducedMotion } from "@/app/providers";

// ---------------------------------------------------------------------------
// Topic data — matches the plan's 13 topics across 2 categories
// ---------------------------------------------------------------------------

type Topic = {
  id: string;
  title: string;
  subtitle: string;
  category: "Core Algorithms" | "Frontend Patterns";
  difficulty: 1 | 2 | 3;
};

const TOPICS: Topic[] = [
  {
    id: "two-pointers",
    title: "Two Pointers",
    subtitle: "Walk both ends toward the middle and see what falls out.",
    category: "Core Algorithms",
    difficulty: 1,
  },
  {
    id: "sliding-window",
    title: "Sliding Window",
    subtitle:
      "The pattern that makes subarray problems click — fixed-size or shrinkable.",
    category: "Core Algorithms",
    difficulty: 1,
  },
  {
    id: "hash-maps",
    title: "Hash Maps & Sets",
    subtitle: "Trade space for speed. O(1) lookup changes what's possible.",
    category: "Core Algorithms",
    difficulty: 2,
  },
  {
    id: "stacks-queues",
    title: "Stacks & Queues",
    subtitle:
      "Last in first out, first in first out. Most problems reduce to picking the right one.",
    category: "Core Algorithms",
    difficulty: 2,
  },
  {
    id: "binary-search",
    title: "Binary Search",
    subtitle: "Halve the search space every step — not just for sorted arrays.",
    category: "Core Algorithms",
    difficulty: 2,
  },
  {
    id: "trees-graphs",
    title: "Trees & Graphs",
    subtitle:
      "Nodes and edges. Most tree and graph problems boil down to traversal order.",
    category: "Core Algorithms",
    difficulty: 3,
  },
  {
    id: "recursion-backtracking",
    title: "Recursion & Backtracking",
    subtitle: "Solve it by solving a smaller version. Undo what doesn't work.",
    category: "Core Algorithms",
    difficulty: 3,
  },
  {
    id: "dynamic-programming",
    title: "Dynamic Programming",
    subtitle:
      "Overlapping subproblems, optimal substructure — the real intuition behind DP.",
    category: "Core Algorithms",
    difficulty: 3,
  },
  {
    id: "debounce-throttle",
    title: "Debounce & Throttle",
    subtitle:
      "Wait until they stop, or fire at most once per interval. Two sentences, two patterns.",
    category: "Frontend Patterns",
    difficulty: 1,
  },
  {
    id: "memoization",
    title: "Memoization",
    subtitle:
      "Same input, same output? Cache it. useMemo and useCallback are just the React version.",
    category: "Frontend Patterns",
    difficulty: 2,
  },
  {
    id: "event-delegation",
    title: "Event Delegation",
    subtitle:
      "One handler on the parent, not fifty on the children. Events bubble — use it.",
    category: "Frontend Patterns",
    difficulty: 2,
  },
  {
    id: "async-patterns",
    title: "Async Patterns",
    subtitle:
      "The event loop, microtasks, and why your setTimeout fires after your Promise.",
    category: "Frontend Patterns",
    difficulty: 3,
  },
  {
    id: "from-scratch",
    title: "From Scratch",
    subtitle:
      "Implement the thing without using the thing. The interview question that tests understanding.",
    category: "Frontend Patterns",
    difficulty: 3,
  },
];

const CATEGORIES = ["Core Algorithms", "Frontend Patterns"] as const;

// ---------------------------------------------------------------------------
// Shared hover spring — slightly softer than spring.smooth for relaxed feel
// ---------------------------------------------------------------------------

const hoverSpring = { type: "spring" as const, stiffness: 180, damping: 22 };

// ---------------------------------------------------------------------------
// Animated concept marks — each mark animates on hover to show what the
// algorithm does. Static elements provide context, motion elements animate.
// ---------------------------------------------------------------------------

function TwoPointersMark({ h }: { h: boolean }) {
  return (
    <>
      <line
        x1="42"
        y1="50"
        x2="118"
        y2="50"
        strokeDasharray="4 6"
        strokeOpacity="0.3"
      />
      <polyline points="70,43 82,50 70,57" strokeOpacity="0.4" />
      <polyline points="90,43 78,50 90,57" strokeOpacity="0.4" />
      <motion.circle
        cy="50"
        r="8"
        animate={{ cx: h ? 72 : 30 }}
        transition={hoverSpring}
      />
      <motion.circle
        cy="50"
        r="8"
        animate={{ cx: h ? 88 : 130 }}
        transition={hoverSpring}
      />
    </>
  );
}

function SlidingWindowMark({ h }: { h: boolean }) {
  return (
    <>
      {[20, 38, 56, 74, 92, 110, 128].map((x) => (
        <line
          key={x}
          x1={x}
          y1="38"
          x2={x}
          y2="62"
          strokeOpacity="0.15"
          strokeWidth="1"
        />
      ))}
      <motion.rect
        y="30"
        width="42"
        height="40"
        rx="6"
        strokeOpacity="0.5"
        animate={{ x: h ? 86 : 50 }}
        transition={hoverSpring}
      />
    </>
  );
}

function HashMapsMark({ h }: { h: boolean }) {
  const arrows = ["M42 30 L100 30", "M42 50 L100 68", "M42 70 L100 50"];
  return (
    <>
      <circle cx="35" cy="30" r="5" />
      <circle cx="35" cy="50" r="5" />
      <circle cx="35" cy="70" r="5" />
      <rect x="100" y="22" width="30" height="56" rx="4" strokeOpacity="0.2" />
      <line x1="100" y1="40" x2="130" y2="40" strokeOpacity="0.12" />
      <line x1="100" y1="58" x2="130" y2="58" strokeOpacity="0.12" />
      {arrows.map((d, i) => (
        <motion.path
          key={i}
          d={d}
          animate={{ strokeOpacity: h ? 0.6 : 0.25 }}
          transition={{ ...hoverSpring, delay: h ? i * 0.08 : 0 }}
        />
      ))}
    </>
  );
}

function StacksQueuesMark({ h }: { h: boolean }) {
  return (
    <>
      <motion.rect
        x="24"
        y={22}
        width="44"
        height="12"
        rx="3"
        animate={{ y: h ? 8 : 22, opacity: h ? 0 : 1 }}
        transition={hoverSpring}
        strokeOpacity={0.5}
      />
      {[1, 2, 3].map((i) => (
        <rect
          key={i}
          x="24"
          y={22 + i * 16}
          width="44"
          height="12"
          rx="3"
          strokeOpacity={0.5 - i * 0.1}
        />
      ))}
      <motion.path
        d="M46 16 L46 10"
        strokeOpacity="0.25"
        animate={{ opacity: h ? 0 : 1 }}
        transition={hoverSpring}
      />
      <motion.polyline
        points="42,14 46,8 50,14"
        strokeOpacity="0.25"
        animate={{ opacity: h ? 0 : 1 }}
        transition={hoverSpring}
      />
      <circle cx="115" cy="50" r="24" strokeOpacity="0.15" />
      <path d="M94 38 L115 26" strokeOpacity="0.3" />
      <path d="M136 62 L115 74" strokeOpacity="0.3" />
    </>
  );
}

function BinarySearchMark({ h }: { h: boolean }) {
  return (
    <>
      {[20, 34, 48, 62, 76, 90, 104, 118, 132].map((x, i) => {
        const isLeft = x <= 76;
        return isLeft ? (
          <motion.line
            key={x}
            x1={x}
            y1={70 - (i + 1) * 5}
            x2={x}
            y2="72"
            strokeWidth="1"
            animate={{ strokeOpacity: h ? 0.05 : 0.15 }}
            transition={hoverSpring}
          />
        ) : (
          <motion.line
            key={x}
            x1={x}
            y1={70 - (i + 1) * 5}
            x2={x}
            y2="72"
            strokeWidth="1"
            animate={{ strokeOpacity: h ? 0.6 : 0.4 }}
            transition={hoverSpring}
          />
        );
      })}
      <line
        x1="80"
        y1="12"
        x2="80"
        y2="80"
        strokeDasharray="3 5"
        strokeOpacity="0.3"
      />
      <path d="M72 18 L80 12 L88 18" strokeOpacity="0.4" />
    </>
  );
}

function TreesGraphsMark({ h }: { h: boolean }) {
  const levels: Array<{ cx: number; cy: number; r: number; delay: number }> = [
    { cx: 80, cy: 18, r: 5, delay: 0 },
    { cx: 50, cy: 48, r: 5, delay: 0.08 },
    { cx: 110, cy: 48, r: 5, delay: 0.08 },
    { cx: 35, cy: 78, r: 4, delay: 0.16 },
    { cx: 65, cy: 78, r: 4, delay: 0.16 },
    { cx: 95, cy: 78, r: 4, delay: 0.16 },
    { cx: 125, cy: 78, r: 4, delay: 0.16 },
  ];
  return (
    <>
      <line x1="76" y1="23" x2="54" y2="43" strokeOpacity="0.2" />
      <line x1="84" y1="23" x2="106" y2="43" strokeOpacity="0.2" />
      <line x1="47" y1="53" x2="38" y2="74" strokeOpacity="0.15" />
      <line x1="53" y1="53" x2="62" y2="74" strokeOpacity="0.15" />
      <line x1="107" y1="53" x2="98" y2="74" strokeOpacity="0.15" />
      <line x1="113" y1="53" x2="122" y2="74" strokeOpacity="0.15" />
      {levels.map((n) => (
        <motion.circle
          key={`${n.cx}-${n.cy}`}
          cx={n.cx}
          cy={n.cy}
          r={n.r}
          fill="currentColor"
          animate={{
            fillOpacity: h ? 0.25 : 0,
            strokeOpacity: h ? 0.7 : 0.35,
          }}
          transition={{ ...hoverSpring, delay: h ? n.delay : 0 }}
        />
      ))}
    </>
  );
}

function RecursionMark({ h }: { h: boolean }) {
  return (
    <>
      <path
        d="M80 50 Q80 28 58 28 Q36 28 36 50 Q36 74 64 74 Q88 74 88 54 Q88 40 74 40"
        strokeOpacity="0.15"
      />
      <motion.path
        d="M80 50 Q80 28 58 28 Q36 28 36 50 Q36 74 64 74 Q88 74 88 54 Q88 40 74 40"
        strokeOpacity="0.5"
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: h ? 1 : 0 }}
        transition={{ type: "tween", duration: 0.6, ease: "easeOut" }}
      />
      <motion.circle
        cx="74"
        cy="40"
        r="3"
        fill="currentColor"
        strokeOpacity="0.4"
        animate={{ fillOpacity: h ? 0.4 : 0.15, r: h ? 5 : 3 }}
        transition={hoverSpring}
      />
      <circle cx="80" cy="50" r="2" fill="currentColor" fillOpacity="0.25" />
    </>
  );
}

function DPMark({ h }: { h: boolean }) {
  return (
    <>
      {Array.from({ length: 30 }, (_, i) => {
        const row = Math.floor(i / 6);
        const col = i % 6;
        const shouldFill = row + col <= 4;
        return (
          <motion.rect
            key={i}
            x={30 + col * 17}
            y={12 + row * 16}
            width="12"
            height="11"
            rx="2"
            fill={shouldFill ? "currentColor" : "none"}
            animate={{
              fillOpacity: shouldFill ? (h ? 0.2 : 0.06) : 0,
              strokeOpacity: shouldFill ? (h ? 0.55 : 0.35) : 0.08,
            }}
            transition={{ ...hoverSpring, delay: h ? (row + col) * 0.04 : 0 }}
          />
        );
      })}
    </>
  );
}

function DebounceMark({ h }: { h: boolean }) {
  return (
    <>
      <line x1="20" y1="35" x2="140" y2="35" strokeOpacity="0.08" />
      {[
        24, 30, 33, 38, 52, 56, 58, 62, 64, 80, 84, 86, 100, 106, 110, 114, 130,
      ].map((x) => (
        <circle
          key={`r${x}`}
          cx={x}
          cy="35"
          r="2"
          fill="currentColor"
          fillOpacity="0.25"
          stroke="none"
        />
      ))}
      <line x1="20" y1="65" x2="140" y2="65" strokeOpacity="0.08" />
      {[33, 62, 86, 114].map((x, i) => (
        <motion.circle
          key={`t${x}`}
          cx={x}
          cy="65"
          fill="currentColor"
          strokeOpacity="0.4"
          animate={{
            r: h ? 5 : 3.5,
            fillOpacity: h ? 0.35 : 0.12,
          }}
          transition={{ ...hoverSpring, delay: h ? i * 0.07 : 0 }}
        />
      ))}
    </>
  );
}

function MemoizationMark({ h }: { h: boolean }) {
  return (
    <>
      <motion.rect
        x="55"
        y="30"
        width="50"
        height="26"
        rx="6"
        animate={{ strokeOpacity: h ? 0.6 : 0.35 }}
        transition={hoverSpring}
      />
      <path d="M40 43 L55 43" strokeOpacity="0.25" />
      <path d="M105 43 L120 43" strokeOpacity="0.25" />
      <motion.path
        d="M120 43 Q138 43 138 60 Q138 76 80 76 Q22 76 22 60 Q22 43 40 43"
        strokeDasharray="4 5"
        animate={{ strokeOpacity: h ? 0.5 : 0.2 }}
        transition={hoverSpring}
      />
    </>
  );
}

function EventDelegationMark({ h }: { h: boolean }) {
  return (
    <>
      <motion.rect
        x="30"
        y="15"
        width="100"
        height="70"
        rx="6"
        animate={{ strokeOpacity: h ? 0.35 : 0.12 }}
        transition={{ ...hoverSpring, delay: h ? 0.12 : 0 }}
      />
      <motion.rect
        x="46"
        y="28"
        width="68"
        height="44"
        rx="4"
        animate={{ strokeOpacity: h ? 0.5 : 0.2 }}
        transition={{ ...hoverSpring, delay: h ? 0.06 : 0 }}
      />
      <motion.rect
        x="60"
        y="39"
        width="40"
        height="22"
        rx="3"
        animate={{ strokeOpacity: h ? 0.65 : 0.3 }}
        transition={hoverSpring}
      />
      <motion.circle
        cx="80"
        cy="50"
        fill="currentColor"
        strokeOpacity="0.5"
        animate={{ r: h ? 6 : 4, fillOpacity: h ? 0.3 : 0.12 }}
        transition={hoverSpring}
      />
    </>
  );
}

function AsyncMark({ h }: { h: boolean }) {
  return (
    <>
      <circle cx="80" cy="50" r="28" strokeOpacity="0.15" />
      <motion.path
        d="M80 22 A28 28 0 0 1 104 36"
        strokeWidth="2.5"
        animate={{ strokeOpacity: h ? 0.8 : 0.5 }}
        transition={hoverSpring}
      />
      <motion.g animate={{ x: h ? 4 : 0 }} transition={hoverSpring}>
        <path d="M108 50 L108 38 L120 38" strokeOpacity="0.2" />
        <rect
          x="120"
          y="33"
          width="22"
          height="10"
          rx="3"
          strokeOpacity="0.3"
        />
      </motion.g>
      <motion.g animate={{ x: h ? -4 : 0 }} transition={hoverSpring}>
        <path d="M52 50 L52 62 L40 62" strokeOpacity="0.2" />
        <rect x="18" y="57" width="22" height="10" rx="3" strokeOpacity="0.3" />
      </motion.g>
    </>
  );
}

function FromScratchMark({ h }: { h: boolean }) {
  return (
    <>
      <motion.path
        d="M50 22 L28 50 L50 78"
        strokeOpacity="0.4"
        strokeWidth="2.5"
        animate={{ x: h ? 10 : 0 }}
        transition={hoverSpring}
      />
      <motion.path
        d="M110 22 L132 50 L110 78"
        strokeOpacity="0.4"
        strokeWidth="2.5"
        animate={{ x: h ? -10 : 0 }}
        transition={hoverSpring}
      />
      <line
        x1="68"
        y1="72"
        x2="92"
        y2="28"
        strokeOpacity="0.2"
        strokeWidth="1.5"
      />
    </>
  );
}

const MARK_COMPONENTS: Record<string, React.ComponentType<{ h: boolean }>> = {
  "two-pointers": TwoPointersMark,
  "sliding-window": SlidingWindowMark,
  "hash-maps": HashMapsMark,
  "stacks-queues": StacksQueuesMark,
  "binary-search": BinarySearchMark,
  "trees-graphs": TreesGraphsMark,
  "recursion-backtracking": RecursionMark,
  "dynamic-programming": DPMark,
  "debounce-throttle": DebounceMark,
  memoization: MemoizationMark,
  "event-delegation": EventDelegationMark,
  "async-patterns": AsyncMark,
  "from-scratch": FromScratchMark,
};

function ConceptMark({ id, hovered }: { id: string; hovered: boolean }) {
  const Mark = MARK_COMPONENTS[id];
  return (
    <svg
      viewBox="0 0 160 100"
      className="h-full w-full"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      aria-hidden
    >
      {Mark && <Mark h={hovered} />}
    </svg>
  );
}

function DifficultyDots({ level }: { level: 1 | 2 | 3 }) {
  return (
    <span className="inline-flex gap-1" aria-label={`Difficulty ${level} of 3`}>
      {[1, 2, 3].map((n) => (
        <span
          key={n}
          className={[
            "inline-block h-[5px] w-[5px] rounded-full",
            n <= level ? "bg-foreground/30" : "bg-foreground/[0.06]",
          ].join(" ")}
        />
      ))}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Animated topic card
// ---------------------------------------------------------------------------

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

function TopicCard({
  topic,
  num,
  transition,
}: {
  topic: Topic;
  num: string;
  transition: typeof spring.smooth | typeof instantTransition;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div variants={cardVariants} transition={transition}>
      <Link
        href={`/learn/${topic.id}`}
        className="group block"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="flex h-28 items-center justify-center text-foreground/40 transition-colors duration-300 group-hover:text-foreground/60">
          <ConceptMark id={topic.id} hovered={hovered} />
        </div>
        <div className="mt-3 flex items-baseline gap-2.5">
          <span className="font-mono text-xs tabular-nums text-foreground/50 transition-colors duration-200 group-hover:text-foreground/70">
            {num}
          </span>
          <h3 className="text-[15px] font-semibold tracking-tight text-foreground">
            {topic.title}
          </h3>
        </div>
        <p className="mt-1 pl-7 text-[13px] leading-snug text-muted">
          {topic.subtitle}
        </p>
        <div className="mt-2.5 pl-7">
          <DifficultyDots level={topic.difficulty} />
        </div>
      </Link>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Hub
// ---------------------------------------------------------------------------

export default function LearnHub() {
  const prefersReduced = useHubReducedMotion();
  const t = prefersReduced ? instantTransition : spring.smooth;

  return (
    <div className="min-h-dvh bg-background">
      <PageHeader
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Learn" }]}
      />

      <main className="relative mx-auto max-w-4xl px-4 py-16 sm:py-20">
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
          <motion.h1
            className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl"
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            transition={t}
          >
            Learn
          </motion.h1>
          <motion.p
            className="mt-4 max-w-lg text-[15px] leading-relaxed text-muted"
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            transition={
              prefersReduced
                ? instantTransition
                : { ...spring.smooth, delay: 0.1 }
            }
          >
            These aren&apos;t reference docs. Each topic starts with something
            you can poke at — an interactive demo that builds the intuition
            before any code appears. Pick one and give it five minutes.
          </motion.p>

          {CATEGORIES.map((category, catIdx) => {
            const topics = TOPICS.filter((t) => t.category === category);
            return (
              <section key={category} className="mt-16">
                <motion.h2
                  className="mb-8 text-[11px] font-bold uppercase tracking-[0.2em] text-muted/40"
                  variants={fadeInUp}
                  initial="hidden"
                  animate="visible"
                  transition={
                    prefersReduced
                      ? instantTransition
                      : { ...spring.smooth, delay: 0.15 + catIdx * 0.2 }
                  }
                >
                  {category}
                </motion.h2>
                <motion.div
                  className="grid gap-x-10 gap-y-14 sm:grid-cols-2"
                  variants={staggerContainer(0.06, 0.2 + catIdx * 0.25)}
                  initial="hidden"
                  animate="visible"
                >
                  {topics.map((topic) => {
                    const num = String(TOPICS.indexOf(topic) + 1).padStart(
                      2,
                      "0",
                    );
                    return (
                      <TopicCard
                        key={topic.id}
                        topic={topic}
                        num={num}
                        transition={t}
                      />
                    );
                  })}
                </motion.div>
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}
