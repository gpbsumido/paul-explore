"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { m, AnimatePresence } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import { useStepPlayer } from "@/hooks/useStepPlayer";
import { spring, fadeInUp, instantTransition } from "@/lib/animations";
import { useHubReducedMotion } from "@/app/providers";

// ---------------------------------------------------------------------------
// Shared config
// ---------------------------------------------------------------------------

const hoverSpring = { type: "spring" as const, stiffness: 180, damping: 22 };

// ---------------------------------------------------------------------------
// Static Fibonacci tree (bridge from recursion page)
// ---------------------------------------------------------------------------

const SFIB_R = 10;
const SFIB_LEAF_GAP = 32;
const SFIB_LEVEL_H = 42;

type SFibNode = {
  id: number;
  n: number;
  x: number;
  y: number;
  left: number | null;
  right: number | null;
  duplicate: boolean;
};

function buildStaticFibTree(rootN: number) {
  const nodes: SFibNode[] = [];
  const edges: [number, number][] = [];
  const seen = new Set<number>();
  let nextId = 0;

  function build(n: number): number {
    const id = nextId++;
    const dup = seen.has(n);
    seen.add(n);
    nodes.push({
      id,
      n,
      x: 0,
      y: 0,
      left: null,
      right: null,
      duplicate: dup,
    });
    if (n >= 2) {
      const leftId = build(n - 1);
      const rightId = build(n - 2);
      nodes[id].left = leftId;
      nodes[id].right = rightId;
      edges.push([id, leftId], [id, rightId]);
    }
    return id;
  }

  build(rootN);

  let leafIdx = 0;
  function assignX(nodeId: number, depth: number) {
    const node = nodes[nodeId];
    node.y = depth * SFIB_LEVEL_H + SFIB_R + 4;
    if (node.left === null) {
      node.x = leafIdx * SFIB_LEAF_GAP + SFIB_R + 8;
      leafIdx++;
    } else {
      assignX(node.left, depth + 1);
      assignX(node.right!, depth + 1);
      node.x = (nodes[node.left].x + nodes[node.right!].x) / 2;
    }
  }

  assignX(0, 0);

  let maxX = 0;
  let maxY = 0;
  for (const node of nodes) {
    if (node.x + SFIB_R + 8 > maxX) maxX = node.x + SFIB_R + 8;
    if (node.y + SFIB_R + 8 > maxY) maxY = node.y + SFIB_R + 8;
  }

  return { nodes, edges, width: Math.ceil(maxX), height: Math.ceil(maxY) };
}

const STATIC_TREE = buildStaticFibTree(5);

const STATIC_EDGE_COORDS = STATIC_TREE.edges.map(([from, to]) => {
  const f = STATIC_TREE.nodes[from];
  const t = STATIC_TREE.nodes[to];
  const dx = t.x - f.x;
  const dy = t.y - f.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  const ux = dx / len;
  const uy = dy / len;
  return {
    x1: f.x + ux * SFIB_R,
    y1: f.y + uy * SFIB_R,
    x2: t.x - ux * SFIB_R,
    y2: t.y - uy * SFIB_R,
  };
});

// ---------------------------------------------------------------------------
// Fibonacci bottom-up data
// ---------------------------------------------------------------------------

const FIB_TABLE_N = 7;

function computeFibValues(n: number) {
  const values = [0, 1];
  for (let i = 2; i <= n; i++) values.push(values[i - 1] + values[i - 2]);
  return values;
}

const FIB_VALUES = computeFibValues(FIB_TABLE_N);

type FibTableStep = {
  filledUpTo: number;
  narration: string;
};

function computeFibTableSteps(n: number, values: number[]): FibTableStep[] {
  const steps: FibTableStep[] = [
    {
      filledUpTo: -1,
      narration: "Build the table from the bottom up. No recursion needed.",
    },
    { filledUpTo: 0, narration: "Base case: f(`0`) = `0`." },
    { filledUpTo: 1, narration: "Base case: f(`1`) = `1`." },
  ];
  for (let i = 2; i <= n; i++) {
    steps.push({
      filledUpTo: i,
      narration: `f(\`${i}\`) = f(\`${i - 1}\`) + f(\`${i - 2}\`) = \`${values[i - 1]}\` + \`${values[i - 2]}\` = \`${values[i]}\`.`,
    });
  }
  return steps;
}

const FIB_TABLE_STEPS = computeFibTableSteps(FIB_TABLE_N, FIB_VALUES);

// ---------------------------------------------------------------------------
// Unique Paths data
// ---------------------------------------------------------------------------

function computeGrid(rows: number, cols: number) {
  const grid: number[][] = Array.from({ length: rows }, () =>
    Array(cols).fill(0),
  );
  for (let r = 0; r < rows; r++) grid[r][0] = 1;
  for (let c = 0; c < cols; c++) grid[0][c] = 1;
  for (let r = 1; r < rows; r++) {
    for (let c = 1; c < cols; c++) {
      grid[r][c] = grid[r - 1][c] + grid[r][c - 1];
    }
  }
  return grid;
}

function diagonalOrder(rows: number, cols: number): [number, number][] {
  const order: [number, number][] = [];
  for (let d = 0; d < rows + cols - 1; d++) {
    for (let r = Math.max(0, d - cols + 1); r <= Math.min(rows - 1, d); r++) {
      order.push([r, d - r]);
    }
  }
  return order;
}

type PathsStep = {
  filled: string[];
  active: string | null;
  narration: string;
};

function computePathsSteps(rows: number, cols: number): PathsStep[] {
  const grid = computeGrid(rows, cols);
  const order = diagonalOrder(rows, cols);
  const steps: PathsStep[] = [];
  const filled: string[] = [];

  steps.push({
    filled: [],
    active: null,
    narration: `Find unique paths from top-left to bottom-right in a \`${rows}\u00d7${cols}\` grid. Only move right or down.`,
  });

  for (const [r, c] of order) {
    const key = `${r},${c}`;
    filled.push(key);
    let narration: string;
    if (r === 0 && c === 0) {
      narration = "Start. `1` way to be at the origin.";
    } else if (r === 0) {
      narration = `Top edge. Cell \`(${r},${c})\` = \`1\`. Only one path \u2014 all right.`;
    } else if (c === 0) {
      narration = `Left edge. Cell \`(${r},${c})\` = \`1\`. Only one path \u2014 all down.`;
    } else {
      const above = grid[r - 1][c];
      const left = grid[r][c - 1];
      narration = `Cell \`(${r},${c})\` = above \`(${r - 1},${c})\` + left \`(${r},${c - 1})\` = \`${above}\` + \`${left}\` = \`${grid[r][c]}\`.`;
    }
    if (r === rows - 1 && c === cols - 1) {
      narration += ` Destination \u2014 \`${grid[r][c]}\` unique paths.`;
    }
    steps.push({ filled: [...filled], active: key, narration });
  }

  return steps;
}

// ---------------------------------------------------------------------------
// Climbing Stairs data
// ---------------------------------------------------------------------------

const STAIR_N = 6;
const STAIR_WAYS = [1, 1, 2, 3, 5, 8, 13];

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
// Fibonacci bottom-up demo
// ---------------------------------------------------------------------------

function FibBottomUpDemo() {

  const steps = FIB_TABLE_STEPS;
  const { stepIdx, playing, advance, play, stop, reset } = useStepPlayer(
    steps.length,
    { intervalMs: 600 },
  );
  const step = steps[stepIdx];

  return (
    <div>
      {/* Index labels */}
      <div className="flex gap-0.5 sm:gap-1">
        {FIB_VALUES.map((_, i) => (
          <div
            key={i}
            className="flex-1 text-center font-mono text-[10px] text-muted"
          >
            {i}
          </div>
        ))}
      </div>

      {/* Table cells */}
      <div className="mt-1 flex gap-0.5 sm:gap-1">
        {FIB_VALUES.map((val, i) => {
          const isFilled = i <= step.filledUpTo;
          const isActive = i === step.filledUpTo && stepIdx > 0;
          return (
            <div
              key={i}
              className={[
                "flex flex-1 items-center justify-center rounded-sm border font-mono text-sm transition-colors",
                "h-11 sm:h-12",
                isActive
                  ? "border-foreground/20 bg-foreground/15"
                  : isFilled
                    ? "border-foreground/15 bg-foreground/10"
                    : "border-foreground/10",
              ].join(" ")}
            >
              <AnimatePresence>
                {isFilled && (
                  <m.span
                    key={`v-${i}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 0.8, scale: 1 }}
                    transition={hoverSpring}
                  >
                    {val}
                  </m.span>
                )}
              </AnimatePresence>
            </div>
          );
        })}
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
          </m.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Unique Paths grid demo
// ---------------------------------------------------------------------------

const GRID_PRESETS = [
  { rows: 3, cols: 3, label: "3\u00d73" },
  { rows: 4, cols: 4, label: "4\u00d74" },
  { rows: 5, cols: 5, label: "5\u00d75" },
  { rows: 6, cols: 6, label: "6\u00d76" },
] as const;

function UniquePathsDemo() {
  const [presetIdx, setPresetIdx] = useState(1);

  const { rows, cols } = GRID_PRESETS[presetIdx];
  const grid = useMemo(() => computeGrid(rows, cols), [rows, cols]);
  const steps = useMemo(() => computePathsSteps(rows, cols), [rows, cols]);
  const { stepIdx, playing, advance, play, stop, reset } = useStepPlayer(
    steps.length,
    { intervalMs: 400 },
  );
  const step = steps[stepIdx];

  const filledSet = useMemo(() => new Set(step.filled), [step.filled]);

  const handlePreset = useCallback(
    (idx: number) => {
      reset();
      setPresetIdx(idx);
    },
    [reset],
  );

  return (
    <div>
      {/* Preset pills */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-[11px] uppercase tracking-[0.2em] text-muted">
          Grid
        </span>
        {GRID_PRESETS.map((preset, i) => (
          <Pill
            key={preset.label}
            onClick={() => handlePreset(i)}
            active={presetIdx === i}
          >
            {preset.label}
          </Pill>
        ))}
      </div>

      {/* Grid */}
      <div
        className="inline-grid gap-0.5 sm:gap-1"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: rows * cols }, (_, idx) => {
          const r = Math.floor(idx / cols);
          const c = idx % cols;
          const key = `${r},${c}`;
          const isFilled = filledSet.has(key);
          const isActive = step.active === key;
          return (
            <div
              key={key}
              className={[
                "flex items-center justify-center rounded-sm border font-mono text-[13px] transition-colors",
                "h-10 w-10 sm:h-12 sm:w-12",
                isActive
                  ? "border-foreground/20 bg-foreground/15"
                  : isFilled
                    ? "border-foreground/15 bg-foreground/[0.08]"
                    : "border-foreground/10",
              ].join(" ")}
            >
              <AnimatePresence>
                {isFilled && (
                  <m.span
                    key={`p-${key}`}
                    className={
                      isActive ? "text-foreground" : "text-foreground/60"
                    }
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={hoverSpring}
                  >
                    {grid[r][c]}
                  </m.span>
                )}
              </AnimatePresence>
            </div>
          );
        })}
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
          </m.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Climbing Stairs demo (auto-animates on scroll)
// ---------------------------------------------------------------------------

function ClimbingStairsDemo() {
  const stepW = 52;
  const stepH = 34;
  const pad = 12;
  const groundY = STAIR_N * stepH + pad;
  const totalW = STAIR_N * stepW + 2 * pad;
  const totalH = groundY + pad;

  let staircasePath = `M ${pad} ${groundY}`;
  for (let i = 0; i < STAIR_N; i++) {
    staircasePath += ` V ${groundY - (i + 1) * stepH}`;
    staircasePath += ` H ${pad + (i + 1) * stepW}`;
  }
  staircasePath += ` V ${groundY} Z`;

  return (
    <svg
      viewBox={`0 0 ${totalW} ${totalH}`}
      className="mx-auto w-full"
      style={{ maxHeight: "240px" }}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
    >
      {/* Staircase outline */}
      <path
        d={staircasePath}
        strokeWidth={1}
        strokeOpacity={0.15}
        fill="currentColor"
        fillOpacity={0.02}
      />

      {/* Internal step dividers */}
      {Array.from({ length: STAIR_N - 1 }, (_, i) => {
        const y = groundY - (i + 1) * stepH;
        return (
          <line
            key={`div-${i}`}
            x1={pad}
            y1={y}
            x2={pad + (i + 1) * stepW}
            y2={y}
            strokeWidth={1}
            strokeOpacity={0.06}
          />
        );
      })}

      {/* Ways count on each step */}
      {Array.from({ length: STAIR_N }, (_, i) => {
        const cx = pad + i * stepW + stepW / 2;
        const cy = groundY - (i + 1) * stepH + stepH / 2 + 5;
        return (
          <m.text
            key={`w-${i}`}
            x={cx}
            textAnchor="middle"
            fontSize="14"
            fontFamily="var(--font-mono, monospace)"
            fill="currentColor"
            stroke="none"
            initial={{ opacity: 0, y: cy + 8 }}
            whileInView={{ opacity: 0.7, y: cy }}
            viewport={{ once: true }}
            transition={{ ...hoverSpring, delay: i * 0.12 }}
          >
            {STAIR_WAYS[i + 1]}
          </m.text>
        );
      })}

      {/* Step number labels at bottom */}
      {Array.from({ length: STAIR_N }, (_, i) => (
        <text
          key={`n-${i}`}
          x={pad + i * stepW + stepW / 2}
          y={groundY + 11}
          textAnchor="middle"
          fontSize="8"
          fontFamily="var(--font-mono, monospace)"
          fill="currentColor"
          stroke="none"
          opacity={0.2}
        >
          n={i + 1}
        </text>
      ))}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Main content
// ---------------------------------------------------------------------------

export default function DPContent() {
  const prefersReduced = useHubReducedMotion();
  const t = prefersReduced ? instantTransition : spring.smooth;

  return (
    <div className="min-h-dvh bg-background">
      <PageHeader
        breadcrumbs={[
          { label: "Learn", href: "/learn" },
          { label: "Dynamic Programming" },
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
              Dynamic Programming
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              If a problem has overlapping subproblems &mdash; you solve the
              same smaller problem multiple times &mdash; and optimal
              substructure &mdash; the best solution builds from best
              sub-solutions &mdash; cache the results. That&apos;s DP.
            </p>
          </Section>

          {/* ----------------------------------------------------------- */}
          {/* 2. Fibonacci bridge                                          */}
          {/* ----------------------------------------------------------- */}
          <Section className="mt-14" transition={t}>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted">
              From recursion to DP
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-muted">
              Here&apos;s the fib(5) call tree. Dashed nodes are redundant
              &mdash; the same subproblem solved again. The tree grows
              exponentially because we keep redoing work.
            </p>

            {/* Static fib tree SVG */}
            <div className="mt-4 py-2">
              <svg
                viewBox={`0 0 ${STATIC_TREE.width} ${STATIC_TREE.height}`}
                className="mx-auto w-full"
                style={{ maxHeight: "200px" }}
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                preserveAspectRatio="xMidYMid meet"
                aria-hidden
              >
                {/* Edges */}
                {STATIC_EDGE_COORDS.map((e, i) => (
                  <line
                    key={`e-${i}`}
                    x1={e.x1}
                    y1={e.y1}
                    x2={e.x2}
                    y2={e.y2}
                    strokeWidth={1.5}
                    strokeOpacity={0.12}
                  />
                ))}

                {/* Nodes */}
                {STATIC_TREE.nodes.map((node) => (
                  <g key={node.id}>
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={SFIB_R}
                      fill="currentColor"
                      fillOpacity={node.duplicate ? 0.02 : 0.05}
                      stroke="currentColor"
                      strokeWidth={1.5}
                      strokeOpacity={node.duplicate ? 0.2 : 0.35}
                      strokeDasharray={node.duplicate ? "3 2" : "none"}
                    />
                    <text
                      x={node.x}
                      y={node.y + 4}
                      textAnchor="middle"
                      fontSize="9"
                      fontFamily="var(--font-mono, monospace)"
                      fill="currentColor"
                      stroke="none"
                      opacity={node.duplicate ? 0.25 : 0.5}
                    >
                      {node.n}
                    </text>
                  </g>
                ))}
              </svg>
            </div>

            {/* Bridge callout */}
            <div className="mt-4 border-l-2 border-foreground/10 pl-4">
              <p className="text-[14px] leading-relaxed text-muted">
                Remember how memoization pruned the tree? DP is just doing that
                systematically. Instead of recursing and caching, fill a table
                from the base cases up.
              </p>
            </div>

            {/* Bottom-up table demo */}
            <p className="mt-6 font-mono text-[12px] text-muted">
              Bottom-up Fibonacci table
            </p>
            <div className="mt-3">
              <FibBottomUpDemo />
            </div>
          </Section>

          {/* ----------------------------------------------------------- */}
          {/* 3. Unique Paths grid                                         */}
          {/* ----------------------------------------------------------- */}
          <Section className="mt-14" transition={t}>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted">
              Unique Paths
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-muted">
              How many ways can you reach the bottom-right corner of a grid,
              moving only right or down? Each cell&apos;s count is the sum of
              the cell above and the cell to the left. Watch the grid fill in
              diagonal waves.
            </p>
            <div className="mt-6">
              <UniquePathsDemo />
            </div>
          </Section>

          {/* ----------------------------------------------------------- */}
          {/* 4. Top-down vs Bottom-up                                     */}
          {/* ----------------------------------------------------------- */}
          <Section className="mt-14" transition={t}>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted">
              Two directions, same idea
            </h2>

            {/* Top-down */}
            <div className="mt-6 border-l-2 border-foreground/10 pl-4">
              <p className="font-mono text-[12px] text-muted">Top-down</p>
              <p className="mt-2 text-[14px] leading-relaxed text-muted">
                Recursion + cache. Start with the big problem, recurse into
                subproblems, cache results so you never recompute.
              </p>
              {/* Direction diagram */}
              <svg
                viewBox="0 0 90 56"
                className="mt-3"
                style={{ width: 90, height: 56 }}
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                {/* Root node */}
                <circle
                  cx={45}
                  cy={10}
                  r={6}
                  strokeOpacity={0.25}
                  strokeWidth={1.5}
                  fill="currentColor"
                  fillOpacity={0.04}
                />
                {/* Left child */}
                <circle
                  cx={24}
                  cy={40}
                  r={6}
                  strokeOpacity={0.25}
                  strokeWidth={1.5}
                  fill="currentColor"
                  fillOpacity={0.04}
                />
                {/* Right child */}
                <circle
                  cx={66}
                  cy={40}
                  r={6}
                  strokeOpacity={0.25}
                  strokeWidth={1.5}
                  fill="currentColor"
                  fillOpacity={0.04}
                />
                {/* Edges */}
                <line
                  x1={40}
                  y1={15}
                  x2={28}
                  y2={35}
                  strokeWidth={1.5}
                  strokeOpacity={0.15}
                />
                <line
                  x1={50}
                  y1={15}
                  x2={62}
                  y2={35}
                  strokeWidth={1.5}
                  strokeOpacity={0.15}
                />
                {/* Down arrow */}
                <line
                  x1={8}
                  y1={12}
                  x2={8}
                  y2={38}
                  strokeWidth={1.5}
                  strokeOpacity={0.2}
                />
                <polyline
                  points="5,33 8,40 11,33"
                  strokeWidth={1.5}
                  strokeOpacity={0.2}
                />
                {/* Up arrow */}
                <line
                  x1={82}
                  y1={38}
                  x2={82}
                  y2={12}
                  strokeWidth={1.5}
                  strokeOpacity={0.2}
                />
                <polyline
                  points="79,17 82,10 85,17"
                  strokeWidth={1.5}
                  strokeOpacity={0.2}
                />
                {/* Labels */}
                <text
                  x={8}
                  y={50}
                  textAnchor="middle"
                  fontSize="6"
                  fontFamily="var(--font-mono, monospace)"
                  fill="currentColor"
                  stroke="none"
                  opacity={0.25}
                >
                  recurse
                </text>
                <text
                  x={82}
                  y={50}
                  textAnchor="middle"
                  fontSize="6"
                  fontFamily="var(--font-mono, monospace)"
                  fill="currentColor"
                  stroke="none"
                  opacity={0.25}
                >
                  combine
                </text>
              </svg>
            </div>

            {/* Bottom-up */}
            <div className="mt-6 border-l-2 border-foreground/10 pl-4">
              <p className="font-mono text-[12px] text-muted">Bottom-up</p>
              <p className="mt-2 text-[14px] leading-relaxed text-muted">
                Loop + table. Start with the smallest subproblems and build up
                to the answer iteratively. No recursion overhead.
              </p>
              {/* Direction diagram */}
              <svg
                viewBox="0 0 120 36"
                className="mt-3"
                style={{ width: 120, height: 36 }}
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                {/* Row of cells */}
                {[0, 1, 2, 3].map((i) => (
                  <rect
                    key={i}
                    x={8 + i * 26}
                    y={4}
                    width={18}
                    height={16}
                    rx={2}
                    strokeWidth={1}
                    strokeOpacity={0.2}
                    fill="currentColor"
                    fillOpacity={0.03}
                  />
                ))}
                {/* Right arrow */}
                <line
                  x1={8}
                  y1={30}
                  x2={106}
                  y2={30}
                  strokeWidth={1.5}
                  strokeOpacity={0.15}
                />
                <polyline
                  points="100,27 108,30 100,33"
                  strokeWidth={1.5}
                  strokeOpacity={0.15}
                />
                {/* Label */}
                <text
                  x={58}
                  y={15}
                  textAnchor="middle"
                  fontSize="6"
                  fontFamily="var(--font-mono, monospace)"
                  fill="currentColor"
                  stroke="none"
                  opacity={0.25}
                >
                  fill &rarr;
                </text>
              </svg>
            </div>

            <div className="mt-6 border-l-2 border-foreground/10 pl-4">
              <p className="text-[13px] leading-relaxed text-muted">
                Top-down = recursion + cache. Bottom-up = loop + table. Same
                idea, different direction. Bottom-up avoids stack depth limits
                and often runs faster in practice.
              </p>
            </div>
          </Section>

          {/* ----------------------------------------------------------- */}
          {/* 5. Climbing Stairs mini-demo                                 */}
          {/* ----------------------------------------------------------- */}
          <Section className="mt-14" transition={t}>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted">
              Climbing Stairs
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-muted">
              You can climb 1 or 2 steps at a time. How many distinct ways to
              reach step n? Each step&apos;s count = the two steps below it.
              Same recurrence as Fibonacci.
            </p>
            <div className="mt-6">
              <ClimbingStairsDemo />
            </div>
          </Section>

          {/* ----------------------------------------------------------- */}
          {/* 6. Code templates                                            */}
          {/* ----------------------------------------------------------- */}
          <Section className="mt-14" transition={t}>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted">
              Templates
            </h2>

            <p className="mt-4 font-mono text-[12px] text-muted">
              Top-down (memoized recursion)
            </p>
            <pre className="mt-2 overflow-x-auto border-l-2 border-foreground/10 bg-foreground/[0.02] py-4 pl-4 pr-3 font-mono text-[13px] leading-relaxed">
              <span className="text-foreground/70">function</span>{" "}
              <span className="text-foreground">solve</span>(n, memo ={" "}
              <span className="text-foreground/70">new</span> Map()) {"{\n"}
              {"  "}
              <span className="text-foreground/70">if</span> (memo.has(n)){" "}
              <span className="text-foreground/70">return</span> memo.get(n)
              {"\n"}
              {"  "}
              <span className="text-foreground/70">if</span> (n {"<="} 1){" "}
              <span className="text-foreground/70">return</span> n{"\n\n"}
              {"  "}
              <span className="text-foreground/70">const</span> result = solve(n
              - 1, memo){"\n"}
              {"                 "}+ solve(n - 2, memo){"\n"}
              {"  "}memo.set(n, result){"\n"}
              {"  "}
              <span className="text-foreground/70">return</span> result{"\n"}
              {"}"}
            </pre>

            <p className="mt-6 font-mono text-[12px] text-muted">
              Bottom-up (table iteration)
            </p>
            <pre className="mt-2 overflow-x-auto border-l-2 border-foreground/10 bg-foreground/[0.02] py-4 pl-4 pr-3 font-mono text-[13px] leading-relaxed">
              <span className="text-foreground/70">function</span>{" "}
              <span className="text-foreground">solve</span>(n) {"{\n"}
              {"  "}
              <span className="text-foreground/70">const</span> dp = [base0,
              base1]{"\n\n"}
              {"  "}
              <span className="text-foreground/70">for</span> (
              <span className="text-foreground/70">let</span> i = 2; i {"<="} n;
              i++) {"{\n"}
              {"    "}dp[i] = dp[i - 1] + dp[i - 2]{"\n"}
              {"  }\n"}
              {"  "}
              <span className="text-foreground/70">return</span> dp[n]{"\n"}
              {"}"}
            </pre>

            <p className="mt-6 font-mono text-[12px] text-muted">
              Climbing Stairs (concrete example)
            </p>
            <pre className="mt-2 overflow-x-auto border-l-2 border-foreground/10 bg-foreground/[0.02] py-4 pl-4 pr-3 font-mono text-[13px] leading-relaxed">
              <span className="text-foreground/70">function</span>{" "}
              <span className="text-foreground">climbStairs</span>(n) {"{\n"}
              {"  "}
              <span className="text-foreground/70">if</span> (n {"<="} 2){" "}
              <span className="text-foreground/70">return</span> n{"\n"}
              {"  "}
              <span className="text-foreground/70">let</span> prev2 = 1, prev1 =
              2{"\n\n"}
              {"  "}
              <span className="text-foreground/70">for</span> (
              <span className="text-foreground/70">let</span> i = 3; i {"<="} n;
              i++) {"{\n"}
              {"    "}
              <span className="text-foreground/70">const</span> curr = prev1 +
              prev2{"\n"}
              {"    "}prev2 = prev1{"\n"}
              {"    "}prev1 = curr{"\n"}
              {"  }\n"}
              {"  "}
              <span className="text-foreground/70">return</span> prev1{"\n"}
              {"}"}
            </pre>
          </Section>

          {/* ----------------------------------------------------------- */}
          {/* 7. Spot this pattern                                         */}
          {/* ----------------------------------------------------------- */}
          <Section className="mt-14" transition={t}>
            <div className="border-l-2 border-foreground/15 pl-4">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted">
                Spot this pattern
              </h3>
              <ul className="mt-3 space-y-1.5 text-[13px] text-muted">
                <li>
                  &ldquo;Number of ways&rdquo; to reach a state or make a
                  selection
                </li>
                <li>
                  &ldquo;Minimum cost&rdquo; or &ldquo;maximum value&rdquo;
                  across choices
                </li>
                <li>
                  &ldquo;Longest/shortest sequence&rdquo; with a constraint
                </li>
                <li>
                  Overlapping subproblems &mdash; same recursive calls appear
                  multiple times
                </li>
              </ul>
              <p className="mt-3 font-mono text-[13px] text-muted">
                O(n&sup2;) or O(n*m) time &mdash; polynomial, not exponential
              </p>
            </div>
          </Section>

          {/* ----------------------------------------------------------- */}
          {/* 8. Bottom nav                                                */}
          {/* ----------------------------------------------------------- */}
          <nav className="mt-16 flex items-center border-t border-foreground/5 pt-6">
            <Link
              href="/learn/recursion-backtracking"
              className="font-mono text-[13px] text-muted transition-colors hover:text-foreground"
            >
              &larr; Recursion &amp; Backtracking
            </Link>
            <Link
              href="/learn/debounce-throttle"
              className="ml-auto font-mono text-[13px] text-muted transition-colors hover:text-foreground"
            >
              Debounce &amp; Throttle &rarr;
            </Link>
          </nav>
        </div>
      </main>
    </div>
  );
}
