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
// Fibonacci call tree data
// ---------------------------------------------------------------------------

const FIB_R = 12;
const FIB_LEAF_GAP = 38;
const FIB_LEVEL_H = 48;

type FibNode = {
  id: number;
  n: number;
  x: number;
  y: number;
  left: number | null;
  right: number | null;
  firstOccurrence: boolean;
};

function buildFibTree(rootN: number) {
  const nodes: FibNode[] = [];
  const edges: [number, number][] = [];
  const seen = new Set<number>();
  let nextId = 0;

  function build(n: number): number {
    const id = nextId++;
    const first = !seen.has(n);
    seen.add(n);
    nodes.push({
      id,
      n,
      x: 0,
      y: 0,
      left: null,
      right: null,
      firstOccurrence: first,
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
    node.y = depth * FIB_LEVEL_H + FIB_R + 4;

    if (node.left === null) {
      node.x = leafIdx * FIB_LEAF_GAP + FIB_R + 10;
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
    if (node.x + FIB_R + 10 > maxX) maxX = node.x + FIB_R + 10;
    if (node.y + FIB_R + 10 > maxY) maxY = node.y + FIB_R + 10;
  }

  return { nodes, edges, width: Math.ceil(maxX), height: Math.ceil(maxY) };
}

// ---------------------------------------------------------------------------
// Edge endpoint computation (on circle circumference)
// ---------------------------------------------------------------------------

function computeEdgeCoords(
  nodes: Array<{ x: number; y: number }>,
  edges: [number, number][],
  r: number,
) {
  return edges.map(([from, to]) => {
    const f = nodes[from];
    const t = nodes[to];
    const dx = t.x - f.x;
    const dy = t.y - f.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const ux = dx / len;
    const uy = dy / len;
    return {
      x1: f.x + ux * r,
      y1: f.y + uy * r,
      x2: t.x - ux * r,
      y2: t.y - uy * r,
    };
  });
}

// ---------------------------------------------------------------------------
// Precomputed Fibonacci trees + edge coords
// ---------------------------------------------------------------------------

const FIB_PRESETS = [3, 4, 5, 6] as const;

const FIB_TREES = Object.fromEntries(
  FIB_PRESETS.map((n) => [n, buildFibTree(n)]),
) as Record<number, ReturnType<typeof buildFibTree>>;

const FIB_EDGE_COORDS = Object.fromEntries(
  FIB_PRESETS.map((n) => [
    n,
    computeEdgeCoords(FIB_TREES[n].nodes, FIB_TREES[n].edges, FIB_R),
  ]),
) as Record<number, ReturnType<typeof computeEdgeCoords>>;

// ---------------------------------------------------------------------------
// Fibonacci step computation
// ---------------------------------------------------------------------------

type FibStep = {
  activeNode: number;
  resolved: number[];
  callStack: number[];
  activeEdges: number[];
  cacheHits: number[];
  cache: Array<[number, number]>;
  narration: string;
};

function computeFibSteps(rootN: number, withMemo: boolean): FibStep[] {
  const tree = FIB_TREES[rootN];
  const { nodes, edges } = tree;
  const steps: FibStep[] = [];
  const resolved: number[] = [];
  const callStack: number[] = [];
  const activeEdges: number[] = [];
  const cacheHits: number[] = [];
  const memo = new Map<number, number>();

  steps.push({
    activeNode: -1,
    resolved: [],
    callStack: [],
    activeEdges: [],
    cacheHits: [],
    cache: [],
    narration: withMemo
      ? `Compute fib(\`${rootN}\`) with memoization.`
      : `Compute fib(\`${rootN}\`) recursively. Watch for repeated work.`,
  });

  function dfs(nodeId: number): number {
    const node = nodes[nodeId];
    callStack.push(nodeId);

    const edgeIdx = edges.findIndex(([, to]) => to === nodeId);
    if (edgeIdx >= 0 && !activeEdges.includes(edgeIdx)) {
      activeEdges.push(edgeIdx);
    }

    if (withMemo && memo.has(node.n)) {
      const val = memo.get(node.n)!;
      cacheHits.push(nodeId);
      resolved.push(nodeId);
      steps.push({
        activeNode: nodeId,
        resolved: [...resolved],
        callStack: [...callStack],
        activeEdges: [...activeEdges],
        cacheHits: [...cacheHits],
        cache: [...memo.entries()],
        narration: `Cache hit: fib(\`${node.n}\`) = \`${val}\`. Skip subtree.`,
      });
      callStack.pop();
      return val;
    }

    if (node.n <= 1) {
      resolved.push(nodeId);
      if (withMemo) memo.set(node.n, node.n);
      steps.push({
        activeNode: nodeId,
        resolved: [...resolved],
        callStack: [...callStack],
        activeEdges: [...activeEdges],
        cacheHits: [...cacheHits],
        cache: withMemo ? [...memo.entries()] : [],
        narration: `Base case: fib(\`${node.n}\`) = \`${node.n}\`.`,
      });
      callStack.pop();
      return node.n;
    }

    steps.push({
      activeNode: nodeId,
      resolved: [...resolved],
      callStack: [...callStack],
      activeEdges: [...activeEdges],
      cacheHits: [...cacheHits],
      cache: withMemo ? [...memo.entries()] : [],
      narration: `Call fib(\`${node.n}\`). Need fib(\`${node.n - 1}\`) + fib(\`${node.n - 2}\`).`,
    });

    const leftVal = dfs(node.left!);
    const rightVal = dfs(node.right!);
    const result = leftVal + rightVal;

    resolved.push(nodeId);
    if (withMemo) memo.set(node.n, result);

    steps.push({
      activeNode: nodeId,
      resolved: [...resolved],
      callStack: [...callStack],
      activeEdges: [...activeEdges],
      cacheHits: [...cacheHits],
      cache: withMemo ? [...memo.entries()] : [],
      narration: `fib(\`${node.n}\`) = \`${leftVal}\` + \`${rightVal}\` = \`${result}\`.`,
    });

    callStack.pop();
    return result;
  }

  dfs(0);
  return steps;
}

function getVisibleWithMemo(rootN: number) {
  const tree = FIB_TREES[rootN];
  const { nodes } = tree;
  const visibleNodes = new Set<number>();
  const seen = new Set<number>();

  function dfs(nodeId: number) {
    const node = nodes[nodeId];
    visibleNodes.add(nodeId);
    if (seen.has(node.n)) return;
    seen.add(node.n);
    if (node.left !== null) dfs(node.left);
    if (node.right !== null) dfs(node.right);
  }

  dfs(0);

  const visibleEdges = new Set<number>();
  tree.edges.forEach(([from, to], i) => {
    if (visibleNodes.has(from) && visibleNodes.has(to)) visibleEdges.add(i);
  });

  return { nodes: visibleNodes, edges: visibleEdges };
}

// ---------------------------------------------------------------------------
// Subsets backtracking data
// ---------------------------------------------------------------------------

const SUBSET_R = 12;
const SUBSET_LEAF_GAP = 44;
const SUBSET_LEVEL_H = 52;

type SubsetNode = {
  id: number;
  subset: number[];
  x: number;
  y: number;
  left: number | null;
  right: number | null;
  isLeaf: boolean;
  elementConsidered: number | null;
};

function buildSubsetTree() {
  const elements = [1, 2, 3];
  const nodes: SubsetNode[] = [];
  const edges: [number, number, string][] = [];
  let nextId = 0;

  function build(depth: number, current: number[]): number {
    const id = nextId++;
    const isLeaf = depth >= elements.length;
    nodes.push({
      id,
      subset: [...current],
      x: 0,
      y: 0,
      left: null,
      right: null,
      isLeaf,
      elementConsidered: isLeaf ? null : elements[depth],
    });

    if (!isLeaf) {
      const leftId = build(depth + 1, [...current, elements[depth]]);
      const rightId = build(depth + 1, current);
      nodes[id].left = leftId;
      nodes[id].right = rightId;
      edges.push(
        [id, leftId, `+${elements[depth]}`],
        [id, rightId, `\u2212${elements[depth]}`],
      );
    }

    return id;
  }

  build(0, []);

  let leafIdx = 0;
  function assignX(nodeId: number, depth: number) {
    const node = nodes[nodeId];
    node.y = depth * SUBSET_LEVEL_H + SUBSET_R + 4;

    if (node.isLeaf) {
      node.x = leafIdx * SUBSET_LEAF_GAP + SUBSET_R + 10;
      leafIdx++;
    } else {
      assignX(node.left!, depth + 1);
      assignX(node.right!, depth + 1);
      node.x = (nodes[node.left!].x + nodes[node.right!].x) / 2;
    }
  }

  assignX(0, 0);

  let maxX = 0;
  let maxY = 0;
  for (const node of nodes) {
    if (node.x + SUBSET_R + 10 > maxX) maxX = node.x + SUBSET_R + 10;
    if (node.y + SUBSET_R + 22 > maxY) maxY = node.y + SUBSET_R + 22;
  }

  return { nodes, edges, width: Math.ceil(maxX), height: Math.ceil(maxY) };
}

const SUBSET_TREE = buildSubsetTree();

const SUBSET_EDGE_PAIRS = SUBSET_TREE.edges.map(
  ([from, to]) => [from, to] as [number, number],
);
const SUBSET_EDGE_POSITIONS = computeEdgeCoords(
  SUBSET_TREE.nodes,
  SUBSET_EDGE_PAIRS,
  SUBSET_R,
);
const SUBSET_EDGE_COORDS = SUBSET_EDGE_POSITIONS.map((pos, i) => ({
  ...pos,
  label: SUBSET_TREE.edges[i][2],
}));

// ---------------------------------------------------------------------------
// Subset step computation
// ---------------------------------------------------------------------------

type SubsetStep = {
  activeNode: number;
  activePath: number[];
  activePathEdges: number[];
  backtracked: number[];
  backtrackedEdges: number[];
  results: number[][];
  narration: string;
};

function computeSubsetSteps(): SubsetStep[] {
  const { nodes, edges } = SUBSET_TREE;
  const steps: SubsetStep[] = [];
  const activePath: number[] = [];
  const activePathEdges: number[] = [];
  const backtracked: number[] = [];
  const backtrackedEdges: number[] = [];
  const results: number[][] = [];

  steps.push({
    activeNode: -1,
    activePath: [],
    activePathEdges: [],
    backtracked: [],
    backtrackedEdges: [],
    results: [],
    narration:
      "Generate all subsets of `[1, 2, 3]`. At each element, include or skip.",
  });

  function dfs(nodeId: number) {
    const node = nodes[nodeId];
    activePath.push(nodeId);

    const edgeIdx = edges.findIndex(([, to]) => to === nodeId);
    if (edgeIdx >= 0) activePathEdges.push(edgeIdx);

    if (node.isLeaf) {
      results.push([...node.subset]);
      const label =
        node.subset.length > 0 ? `[${node.subset.join(", ")}]` : "[]";
      steps.push({
        activeNode: nodeId,
        activePath: [...activePath],
        activePathEdges: [...activePathEdges],
        backtracked: [...backtracked],
        backtrackedEdges: [...backtrackedEdges],
        results: results.map((r) => [...r]),
        narration: `Leaf: result = \`${label}\`. Backtrack.`,
      });
    } else {
      const label =
        node.subset.length > 0 ? `[${node.subset.join(", ")}]` : "[]";
      steps.push({
        activeNode: nodeId,
        activePath: [...activePath],
        activePathEdges: [...activePathEdges],
        backtracked: [...backtracked],
        backtrackedEdges: [...backtrackedEdges],
        results: results.map((r) => [...r]),
        narration: `At \`${label}\`. Include or skip \`${node.elementConsidered}\`?`,
      });

      dfs(node.left!);
      dfs(node.right!);
    }

    activePath.pop();
    backtracked.push(nodeId);
    if (edgeIdx >= 0) {
      activePathEdges.pop();
      backtrackedEdges.push(edgeIdx);
    }
  }

  dfs(0);
  return steps;
}

const SUBSET_STEPS = computeSubsetSteps();

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
// Fibonacci call tree demo
// ---------------------------------------------------------------------------

function FibonacciDemo() {
  const [n, setN] = useState<number>(5);
  const [memoEnabled, setMemoEnabled] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tree = FIB_TREES[n];
  const edgeCoords = FIB_EDGE_COORDS[n];
  const steps = useMemo(
    () => computeFibSteps(n, memoEnabled),
    [n, memoEnabled],
  );
  const step = steps[stepIdx];

  const resolvedSet = useMemo(() => new Set(step.resolved), [step.resolved]);
  const traversedSet = useMemo(
    () => new Set(step.activeEdges),
    [step.activeEdges],
  );
  const cacheHitSet = useMemo(() => new Set(step.cacheHits), [step.cacheHits]);

  const { nodes: visibleNodeSet, edges: visibleEdgeSet } = useMemo(() => {
    if (!memoEnabled) {
      return {
        nodes: new Set(tree.nodes.map((nd) => nd.id)),
        edges: new Set(tree.edges.map((_, i) => i)),
      };
    }
    return getVisibleWithMemo(n);
  }, [n, memoEnabled, tree.nodes, tree.edges]);

  const memoNodeCount = useMemo(() => getVisibleWithMemo(n).nodes.size, [n]);

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
    if (stepIdx >= steps.length - 1) setStepIdx(0);
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

  const handlePreset = useCallback(
    (newN: number) => {
      reset();
      setN(newN);
    },
    [reset],
  );

  const handleMemoToggle = useCallback(
    (on: boolean) => {
      reset();
      setMemoEnabled(on);
    },
    [reset],
  );

  return (
    <div>
      {/* Preset pills + memo toggle */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-[11px] uppercase tracking-[0.2em] text-muted">
          n
        </span>
        {FIB_PRESETS.map((preset) => (
          <Pill
            key={preset}
            onClick={() => handlePreset(preset)}
            active={n === preset}
          >
            {preset}
          </Pill>
        ))}
        <span className="mx-1 text-foreground/10">|</span>
        <Pill onClick={() => handleMemoToggle(false)} active={!memoEnabled}>
          No memo
        </Pill>
        <Pill onClick={() => handleMemoToggle(true)} active={memoEnabled}>
          Memo
        </Pill>
      </div>

      {/* Call count comparison */}
      <p className="mb-3 font-mono text-[11px] text-muted">
        {tree.nodes.length} calls without memo &middot; {memoNodeCount} with
        memo
      </p>

      {/* SVG tree */}
      <div className="py-2">
        <svg
          viewBox={`0 0 ${tree.width} ${tree.height}`}
          className="mx-auto w-full"
          style={{ maxHeight: "300px" }}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden
        >
          {/* Background edges */}
          {edgeCoords.map((e, i) => (
            <motion.line
              key={`bg-${i}`}
              x1={e.x1}
              y1={e.y1}
              x2={e.x2}
              y2={e.y2}
              strokeWidth={1.5}
              initial={false}
              animate={{
                strokeOpacity: visibleEdgeSet.has(i) ? 0.12 : 0.03,
              }}
              transition={hoverSpring}
            />
          ))}

          {/* Traversed edges */}
          <AnimatePresence>
            {edgeCoords.map((e, i) =>
              traversedSet.has(i) && visibleEdgeSet.has(i) ? (
                <motion.line
                  key={`fg-${i}`}
                  x1={e.x1}
                  y1={e.y1}
                  x2={e.x2}
                  y2={e.y2}
                  strokeWidth={1.5}
                  strokeOpacity={0.5}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={hoverSpring}
                />
              ) : null,
            )}
          </AnimatePresence>

          {/* Nodes */}
          {tree.nodes.map((node) => {
            const isVisible = visibleNodeSet.has(node.id);
            const isActive = step.activeNode === node.id;
            const isResolved = resolvedSet.has(node.id);
            const isCacheHit = cacheHitSet.has(node.id);
            const isDuplicate = !node.firstOccurrence;

            return (
              <g key={node.id}>
                <motion.circle
                  cx={node.x}
                  cy={node.y}
                  r={FIB_R}
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeDasharray={isDuplicate && !memoEnabled ? "3 2" : "none"}
                  initial={false}
                  animate={{
                    fillOpacity: !isVisible
                      ? 0.01
                      : isActive
                        ? 0.25
                        : isCacheHit
                          ? 0.15
                          : isResolved
                            ? 0.15
                            : 0.03,
                    strokeOpacity: !isVisible
                      ? 0.04
                      : isActive
                        ? 0.9
                        : isResolved
                          ? 0.7
                          : isDuplicate
                            ? 0.25
                            : 0.3,
                  }}
                  transition={hoverSpring}
                />
                <motion.text
                  x={node.x}
                  y={node.y + 4}
                  textAnchor="middle"
                  fontSize="10"
                  fontFamily="var(--font-mono, monospace)"
                  fill="currentColor"
                  stroke="none"
                  initial={false}
                  animate={{
                    opacity: !isVisible
                      ? 0
                      : isActive || isResolved
                        ? 0.8
                        : 0.4,
                  }}
                  transition={hoverSpring}
                >
                  {node.n}
                </motion.text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Call stack + cache */}
      <div className="mt-3 grid gap-4 sm:grid-cols-[auto_1fr]">
        <div className="min-w-[5rem]">
          <span className="text-[11px] uppercase tracking-[0.2em] text-muted">
            Call stack
          </span>
          <div className="mt-2 flex min-h-[2rem] flex-col-reverse items-center gap-1">
            <AnimatePresence>
              {step.callStack.map((nodeId) => (
                <motion.div
                  key={`stack-${nodeId}`}
                  className={[
                    "flex h-7 items-center justify-center rounded-sm border px-2 font-mono text-[10px]",
                    nodeId === step.activeNode
                      ? "border-foreground/20 bg-foreground/5"
                      : "border-foreground/10",
                  ].join(" ")}
                  initial={{ opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={hoverSpring}
                >
                  f({tree.nodes[nodeId].n})
                </motion.div>
              ))}
            </AnimatePresence>
            {step.callStack.length === 0 && stepIdx > 0 && (
              <span className="font-mono text-[10px] text-muted">empty</span>
            )}
          </div>
        </div>

        {memoEnabled && (
          <div>
            <span className="text-[11px] uppercase tracking-[0.2em] text-muted">
              Cache
            </span>
            <div className="mt-2 flex min-h-[2rem] flex-wrap items-center gap-1">
              <AnimatePresence>
                {step.cache.map(([arg, val]) => (
                  <motion.span
                    key={`cache-${arg}`}
                    className="inline-flex h-7 items-center justify-center rounded-sm border border-foreground/10 px-2 font-mono text-[10px]"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={hoverSpring}
                  >
                    f({arg})={val}
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
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
          <motion.div
            key={stepIdx}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            <Narration text={step.narration} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Subsets backtracking demo
// ---------------------------------------------------------------------------

function SubsetsDemo() {
  const [stepIdx, setStepIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const steps = SUBSET_STEPS;
  const step = steps[stepIdx];

  const activePathSet = useMemo(
    () => new Set(step.activePath),
    [step.activePath],
  );
  const activeEdgeSet = useMemo(
    () => new Set(step.activePathEdges),
    [step.activePathEdges],
  );
  const backtrackedSet = useMemo(
    () => new Set(step.backtracked),
    [step.backtracked],
  );
  const backtrackedEdgeSet = useMemo(
    () => new Set(step.backtrackedEdges),
    [step.backtrackedEdges],
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
    if (stepIdx >= steps.length - 1) setStepIdx(0);
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
    }, 900);
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

  return (
    <div>
      {/* SVG tree */}
      <div className="py-2">
        <svg
          viewBox={`0 0 ${SUBSET_TREE.width} ${SUBSET_TREE.height}`}
          className="mx-auto w-full"
          style={{ maxHeight: "260px" }}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden
        >
          {/* Background edges */}
          {SUBSET_EDGE_COORDS.map((e, i) => (
            <line
              key={`bg-${i}`}
              x1={e.x1}
              y1={e.y1}
              x2={e.x2}
              y2={e.y2}
              strokeWidth={1.5}
              strokeOpacity={0.08}
            />
          ))}

          {/* Backtracked edges */}
          {SUBSET_EDGE_COORDS.map((e, i) =>
            backtrackedEdgeSet.has(i) && !activeEdgeSet.has(i) ? (
              <line
                key={`back-${i}`}
                x1={e.x1}
                y1={e.y1}
                x2={e.x2}
                y2={e.y2}
                strokeWidth={1.5}
                strokeOpacity={0.18}
              />
            ) : null,
          )}

          {/* Active path edges */}
          <AnimatePresence>
            {SUBSET_EDGE_COORDS.map((e, i) =>
              activeEdgeSet.has(i) ? (
                <motion.line
                  key={`active-${i}`}
                  x1={e.x1}
                  y1={e.y1}
                  x2={e.x2}
                  y2={e.y2}
                  strokeWidth={1.5}
                  strokeOpacity={0.5}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={hoverSpring}
                />
              ) : null,
            )}
          </AnimatePresence>

          {/* Edge labels */}
          {SUBSET_EDGE_COORDS.map((e, i) => {
            const midX = (e.x1 + e.x2) / 2;
            const midY = (e.y1 + e.y2) / 2;
            const isInclude = i % 2 === 0;
            return (
              <text
                key={`label-${i}`}
                x={midX + (isInclude ? -7 : 7)}
                y={midY + 1}
                textAnchor="middle"
                fontSize="7"
                fontFamily="var(--font-mono, monospace)"
                fill="currentColor"
                stroke="none"
                opacity={0.25}
              >
                {e.label}
              </text>
            );
          })}

          {/* Nodes */}
          {SUBSET_TREE.nodes.map((node) => {
            const isActive = step.activeNode === node.id;
            const isOnPath = activePathSet.has(node.id);
            const isBacktracked = backtrackedSet.has(node.id);

            return (
              <g key={node.id}>
                <motion.circle
                  cx={node.x}
                  cy={node.y}
                  r={SUBSET_R}
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  initial={false}
                  animate={{
                    fillOpacity: isActive
                      ? 0.25
                      : isOnPath
                        ? 0.15
                        : isBacktracked
                          ? 0.08
                          : 0.03,
                    strokeOpacity: isActive
                      ? 0.9
                      : isOnPath
                        ? 0.6
                        : isBacktracked
                          ? 0.2
                          : 0.15,
                  }}
                  transition={hoverSpring}
                />
                {/* Element label for internal nodes */}
                {!node.isLeaf && (
                  <text
                    x={node.x}
                    y={node.y + 3.5}
                    textAnchor="middle"
                    fontSize="9"
                    fontFamily="var(--font-mono, monospace)"
                    fill="currentColor"
                    stroke="none"
                    opacity={
                      isActive || isOnPath ? 0.7 : isBacktracked ? 0.3 : 0.25
                    }
                  >
                    {node.elementConsidered}?
                  </text>
                )}
                {/* Subset label for leaf nodes */}
                {node.isLeaf && (
                  <text
                    x={node.x}
                    y={node.y + SUBSET_R + 12}
                    textAnchor="middle"
                    fontSize="8"
                    fontFamily="var(--font-mono, monospace)"
                    fill="currentColor"
                    stroke="none"
                    opacity={isBacktracked || isActive ? 0.5 : 0.25}
                  >
                    {node.subset.length > 0
                      ? `{${node.subset.join(",")}}`
                      : "{}"}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Results */}
      <div className="mt-3">
        <span className="text-[11px] uppercase tracking-[0.2em] text-muted">
          Results
        </span>
        <div className="mt-2 flex min-h-[2rem] flex-wrap items-center gap-1">
          <AnimatePresence>
            {step.results.map((subset, i) => {
              const label = subset.length > 0 ? `[${subset.join(",")}]` : "[]";
              return (
                <motion.span
                  key={`result-${label}`}
                  className={[
                    "inline-flex h-7 items-center justify-center rounded-sm border px-2 font-mono text-[10px]",
                    i === step.results.length - 1 && stepIdx > 0
                      ? "border-foreground/20 bg-foreground/5"
                      : "border-foreground/10",
                  ].join(" ")}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={hoverSpring}
                >
                  {label}
                </motion.span>
              );
            })}
          </AnimatePresence>
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
          <motion.div
            key={stepIdx}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            <Narration text={step.narration} />
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

export default function RecursionBacktrackingContent() {
  const prefersReduced = useHubReducedMotion();
  const t = prefersReduced ? instantTransition : spring.smooth;

  return (
    <div className="min-h-dvh bg-background">
      <PageHeader
        breadcrumbs={[
          { label: "Learn", href: "/learn" },
          { label: "Recursion & Backtracking" },
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
              Recursion &amp; Backtracking
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              Recursion solves a problem by solving a smaller version of itself.
              Backtracking explores choices, undoing each one that leads to a
              dead end. Together they power tree traversals, combinatorial
              search, and constraint solving.
            </p>
          </Section>

          {/* 2. Interactive Fibonacci call tree */}
          <Section className="mt-14" transition={t}>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted">
              Fibonacci call tree
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-muted">
              Every fib(n) call spawns two more. Without memoization, the same
              subproblems are solved over and over &mdash; dashed nodes are
              redundant. Toggle <span className="text-foreground">memo</span> to
              see how caching eliminates the repeated work.
            </p>
            <div className="mt-6">
              <FibonacciDemo />
            </div>
          </Section>

          {/* 3. Why recursion feels hard */}
          <Section className="mt-14" transition={t}>
            <div className="border-l-2 border-foreground/10 pl-4">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted">
                Why recursion feels hard
              </h3>
              <p className="mt-3 text-[13px] leading-relaxed text-muted">
                Your brain tries to trace every recursive call at once.
                Don&apos;t. Trust that the recursive call returns the right
                answer for the smaller input, then combine. Think about{" "}
                <span className="text-foreground">one level</span> at a time,
                not the whole tree.
              </p>
            </div>
          </Section>

          {/* 4. Interactive backtracking -- subsets */}
          <Section className="mt-14" transition={t}>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted">
              Backtracking &mdash; subsets
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-muted">
              To generate all subsets, make a binary choice at each element:
              include it or skip it. The decision tree has 2<sup>n</sup> leaves,
              one per subset. Watch the path{" "}
              <span className="text-foreground">advance</span> and{" "}
              <span className="text-foreground">backtrack</span>.
            </p>
            <div className="mt-6">
              <SubsetsDemo />
            </div>
          </Section>

          {/* 5. Code templates */}
          <Section className="mt-14" transition={t}>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted">
              Templates
            </h2>

            <p className="mt-4 font-mono text-[12px] text-muted">
              Recursive template
            </p>
            <pre className="mt-2 overflow-x-auto border-l-2 border-foreground/10 bg-foreground/[0.02] py-4 pl-4 pr-3 font-mono text-[13px] leading-relaxed">
              <span className="text-foreground/70">function</span>{" "}
              <span className="text-foreground">solve</span>(
              <span className="text-foreground">problem</span>) {"{\n"}
              {"  "}
              <span className="text-foreground/70">if</span> (baseCase){" "}
              <span className="text-foreground/70">return</span> baseSolution
              {"\n\n"}
              {"  "}
              <span className="text-foreground/25">
                {"// break into smaller pieces"}
              </span>
              {"\n"}
              {"  "}
              <span className="text-foreground/70">const</span> sub =
              solve(smallerProblem)
              {"\n"}
              {"  "}
              <span className="text-foreground/70">return</span> combine(sub)
              {"\n"}
              {"}"}
            </pre>

            <p className="mt-6 font-mono text-[12px] text-muted">
              Backtracking &mdash; choose / explore / unchoose
            </p>
            <pre className="mt-2 overflow-x-auto border-l-2 border-foreground/10 bg-foreground/[0.02] py-4 pl-4 pr-3 font-mono text-[13px] leading-relaxed">
              <span className="text-foreground/70">function</span>{" "}
              <span className="text-foreground">backtrack</span>(
              <span className="text-foreground">path</span>,{" "}
              <span className="text-foreground">choices</span>) {"{\n"}
              {"  "}
              <span className="text-foreground/70">if</span> (isSolution(path))
              {"{\n"}
              {"    "}results.push([...path])
              {"\n"}
              {"    "}
              <span className="text-foreground/70">return</span>
              {"\n"}
              {"  }\n\n"}
              {"  "}
              <span className="text-foreground/70">for</span> (
              <span className="text-foreground/70">const</span> c{" "}
              <span className="text-foreground/70">of</span> choices) {"{\n"}
              {"    "}path.push(c)
              {"           "}
              <span className="text-foreground/25">{"// choose"}</span>
              {"\n"}
              {"    "}backtrack(path, next)
              {"   "}
              <span className="text-foreground/25">{"// explore"}</span>
              {"\n"}
              {"    "}path.pop()
              {"            "}
              <span className="text-foreground/25">{"// unchoose"}</span>
              {"\n"}
              {"  }\n"}
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
                <li>Permutations, combinations, subsets</li>
                <li>Constraint satisfaction (sudoku, N-queens, word search)</li>
                <li>Tree/graph DFS (recursion is the natural fit)</li>
                <li>Divide and conquer (merge sort, quick sort)</li>
              </ul>
              <p className="mt-3 font-mono text-[13px] text-muted">
                O(2&#x207F;) or O(n!) time &mdash; exponential by nature
              </p>
            </div>
          </Section>

          {/* 7. Bottom nav */}
          <nav className="mt-16 flex items-center border-t border-foreground/5 pt-6">
            <Link
              href="/learn/trees-graphs"
              className="font-mono text-[13px] text-muted transition-colors hover:text-foreground"
            >
              &larr; Trees &amp; Graphs
            </Link>
            <Link
              href="/learn/dynamic-programming"
              className="ml-auto font-mono text-[13px] text-muted transition-colors hover:text-foreground"
            >
              Dynamic Programming &rarr;
            </Link>
          </nav>
        </div>
      </main>
    </div>
  );
}
