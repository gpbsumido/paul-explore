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
const NODE_R = 14;
const GRAPH_R = 16;

// ---------------------------------------------------------------------------
// Tree data
// ---------------------------------------------------------------------------

type TreeNode = {
  id: number;
  value: number;
  x: number;
  y: number;
  left: number | null;
  right: number | null;
};

const TREE: TreeNode[] = [
  { id: 0, value: 1, x: 160, y: 28, left: 1, right: 2 },
  { id: 1, value: 2, x: 80, y: 85, left: 3, right: 4 },
  { id: 2, value: 3, x: 240, y: 85, left: 5, right: 6 },
  { id: 3, value: 4, x: 40, y: 142, left: null, right: null },
  { id: 4, value: 5, x: 120, y: 142, left: null, right: null },
  { id: 5, value: 6, x: 200, y: 142, left: null, right: null },
  { id: 6, value: 7, x: 280, y: 142, left: null, right: null },
];

const TREE_EDGES: [number, number][] = [
  [0, 1],
  [0, 2],
  [1, 3],
  [1, 4],
  [2, 5],
  [2, 6],
];

// ---------------------------------------------------------------------------
// Edge coordinate computation (endpoints on circle circumference)
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

const TREE_EDGE_COORDS = computeEdgeCoords(TREE, TREE_EDGES, NODE_R);

// ---------------------------------------------------------------------------
// Tree traversal step types and computation
// ---------------------------------------------------------------------------

type TraversalMode = "pre" | "in" | "post" | "bfs";

type TreeStep = {
  visited: number[];
  activeNode: number;
  traversedEdges: number[];
  dsLabel: string;
  dsValues: number[];
  visitOrder: number[];
  narration: string;
};

function computeDFSSteps(mode: "pre" | "in" | "post"): TreeStep[] {
  const steps: TreeStep[] = [];
  const visited: number[] = [];
  const order: number[] = [];
  const traversedEdges: number[] = [];
  const callStack: number[] = [];

  const labels: Record<string, [string, string]> = {
    pre: ["Pre-order", "visit, left, right"],
    in: ["In-order", "left, visit, right"],
    post: ["Post-order", "left, right, visit"],
  };
  const [modeLabel, modeRule] = labels[mode];

  steps.push({
    visited: [],
    activeNode: -1,
    traversedEdges: [],
    dsLabel: "Stack",
    dsValues: [],
    visitOrder: [],
    narration: `${modeLabel}: ${modeRule}.`,
  });

  function dfs(nodeId: number) {
    const node = TREE[nodeId];
    callStack.push(nodeId);

    const edgeIdx = TREE_EDGES.findIndex(([, to]) => to === nodeId);
    if (edgeIdx >= 0 && !traversedEdges.includes(edgeIdx)) {
      traversedEdges.push(edgeIdx);
    }

    const visit = () => {
      visited.push(nodeId);
      order.push(node.value);
      const isLeaf = node.left === null && node.right === null;
      let narr: string;

      if (mode === "pre") {
        if (isLeaf) {
          narr = `Visit \`${node.value}\`. Leaf node, backtrack.`;
        } else {
          const children = [node.left, node.right].filter(
            (c) => c !== null,
          ) as number[];
          narr = `Visit \`${node.value}\`. Push ${children.map((c) => `\`${TREE[c].value}\``).join(", ")} onto stack.`;
        }
      } else if (mode === "in") {
        if (isLeaf) {
          narr = `Visit \`${node.value}\`. Leaf -- backtrack.`;
        } else if (node.right !== null) {
          narr = `Visit \`${node.value}\`. Go right to \`${TREE[node.right].value}\`.`;
        } else {
          narr = `Visit \`${node.value}\`. No right child, backtrack.`;
        }
      } else {
        if (isLeaf) {
          narr = `Visit \`${node.value}\`. Leaf -- backtrack.`;
        } else {
          narr = `Both subtrees done. Visit \`${node.value}\`.`;
        }
      }

      steps.push({
        visited: [...visited],
        activeNode: nodeId,
        traversedEdges: [...traversedEdges],
        dsLabel: "Stack",
        dsValues: callStack.map((id) => TREE[id].value),
        visitOrder: [...order],
        narration: narr,
      });
    };

    if (mode === "pre") visit();
    if (node.left !== null) dfs(node.left);
    if (mode === "in") visit();
    if (node.right !== null) dfs(node.right);
    if (mode === "post") visit();

    callStack.pop();
  }

  dfs(0);
  return steps;
}

function computeTreeBFSSteps(): TreeStep[] {
  const steps: TreeStep[] = [];
  const visited: number[] = [];
  const order: number[] = [];
  const traversedEdges: number[] = [];
  const queue: number[] = [0];

  steps.push({
    visited: [],
    activeNode: -1,
    traversedEdges: [],
    dsLabel: "Queue",
    dsValues: [TREE[0].value],
    visitOrder: [],
    narration: `Enqueue root \`${TREE[0].value}\`. Process level by level.`,
  });

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    const node = TREE[nodeId];
    visited.push(nodeId);
    order.push(node.value);

    const edgeIdx = TREE_EDGES.findIndex(([, to]) => to === nodeId);
    if (edgeIdx >= 0) traversedEdges.push(edgeIdx);

    const children: number[] = [];
    if (node.left !== null) {
      queue.push(node.left);
      children.push(TREE[node.left].value);
    }
    if (node.right !== null) {
      queue.push(node.right);
      children.push(TREE[node.right].value);
    }

    const childText =
      children.length > 0
        ? ` Enqueue ${children.map((c) => `\`${c}\``).join(", ")}.`
        : " No children.";

    steps.push({
      visited: [...visited],
      activeNode: nodeId,
      traversedEdges: [...traversedEdges],
      dsLabel: "Queue",
      dsValues: queue.map((id) => TREE[id].value),
      visitOrder: [...order],
      narration: `Dequeue \`${node.value}\`.${childText}`,
    });
  }

  return steps;
}

function computeTreeSteps(mode: TraversalMode): TreeStep[] {
  return mode === "bfs" ? computeTreeBFSSteps() : computeDFSSteps(mode);
}

// ---------------------------------------------------------------------------
// Graph data
// ---------------------------------------------------------------------------

type GraphNode = { id: number; label: string; x: number; y: number };

const GRAPH: GraphNode[] = [
  { id: 0, label: "A", x: 55, y: 45 },
  { id: 1, label: "B", x: 170, y: 35 },
  { id: 2, label: "C", x: 285, y: 45 },
  { id: 3, label: "D", x: 55, y: 150 },
  { id: 4, label: "E", x: 170, y: 155 },
  { id: 5, label: "F", x: 285, y: 150 },
];

const GRAPH_EDGES: [number, number][] = [
  [0, 1],
  [0, 3],
  [1, 2],
  [1, 3],
  [2, 5],
  [3, 4],
  [4, 5],
];

const GRAPH_EDGE_COORDS = computeEdgeCoords(GRAPH, GRAPH_EDGES, GRAPH_R);

const GRAPH_ADJ: number[][] = (() => {
  const adj: number[][] = Array.from({ length: GRAPH.length }, () => []);
  for (const [u, v] of GRAPH_EDGES) {
    adj[u].push(v);
    adj[v].push(u);
  }
  return adj;
})();

function findEdgeIndex(a: number, b: number): number {
  return GRAPH_EDGES.findIndex(
    ([u, v]) => (u === a && v === b) || (u === b && v === a),
  );
}

// ---------------------------------------------------------------------------
// Graph BFS step types and computation
// ---------------------------------------------------------------------------

type GraphStep = {
  explored: number[];
  queue: number[];
  visitedSet: number[];
  activeNode: number;
  exploredEdges: number[];
  pathNodes: number[];
  pathEdges: number[];
  nodeLevels: Record<number, number>;
  narration: string;
};

const GRAPH_PRESETS: [number, number][] = [
  [0, 5],
  [2, 3],
  [1, 4],
];

function computeGraphBFSSteps(start: number, target: number): GraphStep[] {
  const steps: GraphStep[] = [];
  const visitedSet = new Set<number>();
  const parent = new Map<number, number>();
  const queue: number[] = [start];
  const explored: number[] = [];
  const exploredEdges: number[] = [];
  const levels: Record<number, number> = { [start]: 0 };
  visitedSet.add(start);

  steps.push({
    explored: [],
    queue: [start],
    visitedSet: [start],
    activeNode: -1,
    exploredEdges: [],
    pathNodes: [],
    pathEdges: [],
    nodeLevels: { ...levels },
    narration: `Start BFS from \`${GRAPH[start].label}\`. Target: \`${GRAPH[target].label}\`.`,
  });

  if (start === target) {
    steps.push({
      explored: [start],
      queue: [],
      visitedSet: [start],
      activeNode: start,
      exploredEdges: [],
      pathNodes: [start],
      pathEdges: [],
      nodeLevels: { ...levels },
      narration: `\`${GRAPH[start].label}\` is already the target!`,
    });
    return steps;
  }

  while (queue.length > 0) {
    const node = queue.shift()!;
    explored.push(node);

    if (node === target) {
      const path: number[] = [];
      let curr: number | undefined = target;
      while (curr !== undefined && curr !== start) {
        path.unshift(curr);
        curr = parent.get(curr);
      }
      path.unshift(start);

      const pathEdgeIndices: number[] = [];
      for (let i = 0; i < path.length - 1; i++) {
        const ei = findEdgeIndex(path[i], path[i + 1]);
        if (ei >= 0) pathEdgeIndices.push(ei);
      }

      steps.push({
        explored: [...explored],
        queue: [...queue],
        visitedSet: [...visitedSet],
        activeNode: node,
        exploredEdges: [...exploredEdges],
        pathNodes: path,
        pathEdges: pathEdgeIndices,
        nodeLevels: { ...levels },
        narration: `\`${GRAPH[target].label}\` found! Path: ${path.map((n) => `\`${GRAPH[n].label}\``).join(" \u2192 ")}.`,
      });
      break;
    }

    const newNeighbors: number[] = [];
    const alreadyVisited: number[] = [];

    for (const neighbor of GRAPH_ADJ[node]) {
      if (!visitedSet.has(neighbor)) {
        visitedSet.add(neighbor);
        parent.set(neighbor, node);
        levels[neighbor] = (levels[node] ?? 0) + 1;
        queue.push(neighbor);
        newNeighbors.push(neighbor);
        const ei = findEdgeIndex(node, neighbor);
        if (ei >= 0) exploredEdges.push(ei);
      } else {
        alreadyVisited.push(neighbor);
      }
    }

    let narration = `Dequeue \`${GRAPH[node].label}\`.`;
    if (newNeighbors.length > 0) {
      narration += ` Explore ${newNeighbors.map((n) => `\`${GRAPH[n].label}\``).join(", ")}.`;
    }
    if (alreadyVisited.length > 0 && newNeighbors.length > 0) {
      narration += ` ${alreadyVisited.map((n) => `\`${GRAPH[n].label}\``).join(", ")} already visited.`;
    }
    if (newNeighbors.length === 0) {
      narration += " All neighbors visited.";
    }

    steps.push({
      explored: [...explored],
      queue: [...queue],
      visitedSet: [...visitedSet],
      activeNode: node,
      exploredEdges: [...exploredEdges],
      pathNodes: [],
      pathEdges: [],
      nodeLevels: { ...levels },
      narration,
    });
  }

  return steps;
}

// ---------------------------------------------------------------------------
// DOM tree data (static illustration)
// ---------------------------------------------------------------------------

const DOM_NODES = [
  { label: "div", x: 150, y: 18 },
  { label: "header", x: 60, y: 58 },
  { label: "main", x: 240, y: 58 },
  { label: "h1", x: 60, y: 98 },
  { label: "p", x: 205, y: 98 },
  { label: "img", x: 275, y: 98 },
];

const DOM_EDGES: [number, number][] = [
  [0, 1],
  [0, 2],
  [1, 3],
  [2, 4],
  [2, 5],
];

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
// Tree traversal demo
// ---------------------------------------------------------------------------

const MODE_LABELS: Record<TraversalMode, string> = {
  pre: "Pre-order",
  in: "In-order",
  post: "Post-order",
  bfs: "BFS",
};

function TreeTraversalDemo() {
  const [mode, setMode] = useState<TraversalMode>("pre");
  const [stepIdx, setStepIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const steps = useMemo(() => computeTreeSteps(mode), [mode]);
  const step = steps[stepIdx];

  const visitedSet = useMemo(() => new Set(step.visited), [step.visited]);
  const traversedSet = useMemo(
    () => new Set(step.traversedEdges),
    [step.traversedEdges],
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

  const handleModeChange = useCallback(
    (newMode: TraversalMode) => {
      reset();
      setMode(newMode);
    },
    [reset],
  );

  const isBFS = mode === "bfs";

  return (
    <div>
      {/* Mode pills */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-[11px] uppercase tracking-[0.2em] text-muted/40">
          Mode
        </span>
        {(["pre", "in", "post", "bfs"] as TraversalMode[]).map((m) => (
          <Pill key={m} onClick={() => handleModeChange(m)} active={mode === m}>
            {MODE_LABELS[m]}
          </Pill>
        ))}
      </div>

      {/* SVG tree */}
      <div className="py-2">
        <svg
          viewBox="0 0 320 170"
          className="mx-auto w-full max-w-md"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          {/* Background edges */}
          {TREE_EDGE_COORDS.map((e, i) => (
            <line
              key={`bg-${i}`}
              x1={e.x1}
              y1={e.y1}
              x2={e.x2}
              y2={e.y2}
              strokeWidth={1.5}
              strokeOpacity={0.12}
            />
          ))}

          {/* Traversed edges with pathLength animation */}
          <AnimatePresence>
            {TREE_EDGE_COORDS.map((e, i) =>
              traversedSet.has(i) ? (
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
          {TREE.map((node) => {
            const isVisited = visitedSet.has(node.id);
            const isActive = step.activeNode === node.id;
            return (
              <g key={node.id}>
                <motion.circle
                  cx={node.x}
                  cy={node.y}
                  r={NODE_R}
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  initial={false}
                  animate={{
                    fillOpacity: isActive ? 0.25 : isVisited ? 0.2 : 0.03,
                    strokeOpacity: isActive ? 0.9 : isVisited ? 0.7 : 0.3,
                  }}
                  transition={hoverSpring}
                />
                <text
                  x={node.x}
                  y={node.y + 4}
                  textAnchor="middle"
                  fontSize="11"
                  fontFamily="var(--font-mono, monospace)"
                  fill="currentColor"
                  stroke="none"
                  opacity={isVisited || isActive ? 0.8 : 0.4}
                >
                  {node.value}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Data structure + visit order */}
      <div className="mt-3 grid gap-4 sm:grid-cols-[auto_1fr]">
        {/* Stack (vertical) or Queue (horizontal) */}
        <div className="min-w-[4.5rem]">
          <span className="text-[11px] uppercase tracking-[0.2em] text-muted/40">
            {step.dsLabel}
          </span>
          {!isBFS ? (
            <div className="mt-2 flex min-h-[2rem] flex-col-reverse items-center gap-1">
              <AnimatePresence>
                {step.dsValues.map((val, i) => (
                  <motion.div
                    key={`stack-${val}`}
                    className={[
                      "flex h-7 w-10 items-center justify-center rounded-sm border font-mono text-[10px]",
                      i === step.dsValues.length - 1
                        ? "border-foreground/20 bg-foreground/5"
                        : "border-foreground/10",
                    ].join(" ")}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={hoverSpring}
                  >
                    {val}
                  </motion.div>
                ))}
              </AnimatePresence>
              {step.dsValues.length === 0 && stepIdx > 0 && (
                <span className="font-mono text-[10px] text-muted/30">
                  empty
                </span>
              )}
            </div>
          ) : (
            <div className="mt-2 flex min-h-[2rem] items-center gap-1">
              {step.dsValues.length > 0 && (
                <span className="mr-0.5 font-mono text-[9px] text-muted/30">
                  front&thinsp;&rarr;
                </span>
              )}
              <AnimatePresence>
                {step.dsValues.map((val) => (
                  <motion.div
                    key={`queue-${val}`}
                    className="flex h-7 w-8 items-center justify-center rounded-sm border border-foreground/10 font-mono text-[10px]"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={hoverSpring}
                  >
                    {val}
                  </motion.div>
                ))}
              </AnimatePresence>
              {step.dsValues.length === 0 && stepIdx > 0 && (
                <span className="font-mono text-[10px] text-muted/30">
                  empty
                </span>
              )}
            </div>
          )}
        </div>

        {/* Visit order */}
        <div>
          <span className="text-[11px] uppercase tracking-[0.2em] text-muted/40">
            Visit order
          </span>
          <div className="mt-2 flex min-h-[2rem] flex-wrap items-center gap-1">
            <AnimatePresence>
              {step.visitOrder.map((val, i) => (
                <motion.span
                  key={`order-${val}`}
                  className={[
                    "inline-flex h-7 w-8 items-center justify-center rounded-sm border font-mono text-[10px]",
                    i === step.visitOrder.length - 1 && stepIdx > 0
                      ? "border-foreground/20 bg-foreground/5"
                      : "border-foreground/10",
                  ].join(" ")}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={hoverSpring}
                >
                  {val}
                </motion.span>
              ))}
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
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Graph BFS demo
// ---------------------------------------------------------------------------

function GraphBFSDemo() {
  const [start, setStart] = useState(GRAPH_PRESETS[0][0]);
  const [target, setTarget] = useState(GRAPH_PRESETS[0][1]);
  const [stepIdx, setStepIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const steps = useMemo(
    () => computeGraphBFSSteps(start, target),
    [start, target],
  );
  const step = steps[stepIdx];

  const exploredSet = useMemo(() => new Set(step.explored), [step.explored]);
  const exploredEdgeSet = useMemo(
    () => new Set(step.exploredEdges),
    [step.exploredEdges],
  );
  const pathNodeSet = useMemo(() => new Set(step.pathNodes), [step.pathNodes]);
  const pathEdgeSet = useMemo(() => new Set(step.pathEdges), [step.pathEdges]);

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

  const handlePreset = useCallback(
    (s: number, t: number) => {
      reset();
      setStart(s);
      setTarget(t);
    },
    [reset],
  );

  const handleNodeClick = useCallback(
    (nodeId: number) => {
      if (nodeId === start) return;
      reset();
      setTarget(nodeId);
    },
    [start, reset],
  );

  const isLast = stepIdx >= steps.length - 1;

  return (
    <div>
      {/* Preset pills */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-[11px] uppercase tracking-[0.2em] text-muted/40">
          Path
        </span>
        {GRAPH_PRESETS.map(([s, t]) => (
          <Pill
            key={`${s}-${t}`}
            onClick={() => handlePreset(s, t)}
            active={start === s && target === t}
          >
            {GRAPH[s].label} &rarr; {GRAPH[t].label}
          </Pill>
        ))}
      </div>

      <p className="mb-3 font-mono text-[11px] text-muted/40">
        click any node to change target
      </p>

      {/* SVG graph */}
      <div className="py-2">
        <svg
          viewBox="0 0 340 195"
          className="mx-auto w-full max-w-md"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          {/* Background edges */}
          {GRAPH_EDGE_COORDS.map((e, i) => (
            <line
              key={`bg-${i}`}
              x1={e.x1}
              y1={e.y1}
              x2={e.x2}
              y2={e.y2}
              strokeWidth={1.5}
              strokeOpacity={0.12}
            />
          ))}

          {/* Explored edges */}
          <AnimatePresence>
            {GRAPH_EDGE_COORDS.map((e, i) => {
              const isPath = pathEdgeSet.has(i);
              return exploredEdgeSet.has(i) ? (
                <motion.line
                  key={`fg-${i}`}
                  x1={e.x1}
                  y1={e.y1}
                  x2={e.x2}
                  y2={e.y2}
                  strokeWidth={isPath ? 2 : 1.5}
                  initial={{ pathLength: 0, strokeOpacity: 0 }}
                  animate={{
                    pathLength: 1,
                    strokeOpacity: isPath ? 0.6 : 0.35,
                  }}
                  transition={hoverSpring}
                />
              ) : null;
            })}
          </AnimatePresence>

          {/* Nodes */}
          {GRAPH.map((node) => {
            const isStart = node.id === start;
            const isTarget = node.id === target;
            const isExplored = exploredSet.has(node.id);
            const isActive = step.activeNode === node.id;
            const isOnPath = pathNodeSet.has(node.id);
            const level = step.nodeLevels[node.id] ?? 0;

            return (
              <g
                key={node.id}
                style={{ cursor: node.id === start ? "default" : "pointer" }}
                onClick={() => handleNodeClick(node.id)}
              >
                <motion.circle
                  cx={node.x}
                  cy={node.y}
                  r={GRAPH_R}
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth={isStart ? 2 : 1.5}
                  strokeDasharray={isTarget ? "4 3" : "none"}
                  initial={false}
                  animate={{
                    fillOpacity: isActive
                      ? 0.3
                      : isOnPath
                        ? 0.25
                        : isExplored
                          ? 0.2
                          : isStart || isTarget
                            ? 0.06
                            : 0.03,
                    strokeOpacity: isActive
                      ? 0.9
                      : isOnPath
                        ? 0.8
                        : isExplored
                          ? 0.7
                          : isStart || isTarget
                            ? 0.6
                            : 0.3,
                  }}
                  transition={{
                    ...hoverSpring,
                    delay: isExplored && !isActive ? level * 0.08 : 0,
                  }}
                />
                <text
                  x={node.x}
                  y={node.y + 4.5}
                  textAnchor="middle"
                  fontSize="12"
                  fontFamily="var(--font-mono, monospace)"
                  fill="currentColor"
                  stroke="none"
                  opacity={
                    isActive || isExplored || isStart || isTarget ? 0.8 : 0.4
                  }
                  style={{
                    pointerEvents: "none",
                  }}
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Queue + Visited chips */}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <span className="text-[11px] uppercase tracking-[0.2em] text-muted/40">
            Queue
          </span>
          <div className="mt-2 flex min-h-[2rem] items-center gap-1">
            {step.queue.length > 0 && (
              <span className="mr-0.5 font-mono text-[9px] text-muted/30">
                front&thinsp;&rarr;
              </span>
            )}
            <AnimatePresence>
              {step.queue.map((id) => (
                <motion.div
                  key={`gq-${id}`}
                  className="flex h-7 w-8 items-center justify-center rounded-sm border border-foreground/10 font-mono text-[10px]"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={hoverSpring}
                >
                  {GRAPH[id].label}
                </motion.div>
              ))}
            </AnimatePresence>
            {step.queue.length === 0 && stepIdx > 0 && (
              <span className="font-mono text-[10px] text-muted/30">empty</span>
            )}
          </div>
        </div>

        <div>
          <span className="text-[11px] uppercase tracking-[0.2em] text-muted/40">
            Visited
          </span>
          <div className="mt-2 flex min-h-[2rem] flex-wrap items-center gap-1">
            <AnimatePresence>
              {step.visitedSet.map((id) => (
                <motion.span
                  key={`gv-${id}`}
                  className="inline-flex h-7 w-8 items-center justify-center rounded-sm border border-foreground/10 font-mono text-[10px]"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={hoverSpring}
                >
                  {GRAPH[id].label}
                </motion.span>
              ))}
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
            {isLast && step.pathNodes.length > 0 && (
              <p className="mt-1 font-mono text-[13px] font-semibold text-foreground/70">
                shortest path: {step.pathNodes.length - 1}{" "}
                {step.pathNodes.length - 1 === 1 ? "edge" : "edges"}
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

export default function TreesGraphsContent() {
  const prefersReduced = useHubReducedMotion();
  const t = prefersReduced ? instantTransition : spring.smooth;

  return (
    <div className="min-h-dvh bg-background">
      <PageHeader
        breadcrumbs={[
          { label: "Learn", href: "/learn" },
          { label: "Trees & Graphs" },
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
              Trees & Graphs
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              Trees and graphs are just nodes connected by edges. A tree has no
              cycles. Most tree and graph problems reduce to &quot;visit every
              node in some order.&quot;
            </p>
          </Section>

          {/* 2. Interactive tree traversal */}
          <Section className="mt-14" transition={t}>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted/40">
              Tree traversal
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-muted">
              DFS goes deep before going wide. BFS goes wide before going deep.
              The three DFS orderings differ only in{" "}
              <span className="text-foreground">when</span> you process the
              current node relative to its children.
            </p>
            <div className="mt-6">
              <TreeTraversalDemo />
            </div>
          </Section>

          {/* 3. DOM tree analogy */}
          <Section className="mt-14" transition={t}>
            <div className="border-l-2 border-foreground/10 pl-4">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted/40">
                You already use trees
              </h3>

              <div className="mt-4 flex justify-center">
                <svg
                  viewBox="0 0 300 115"
                  className="w-full max-w-[14rem]"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth={1}
                  aria-hidden
                >
                  {DOM_EDGES.map(([from, to], i) => (
                    <line
                      key={i}
                      x1={DOM_NODES[from].x}
                      y1={DOM_NODES[from].y + 6}
                      x2={DOM_NODES[to].x}
                      y2={DOM_NODES[to].y - 6}
                      strokeOpacity={0.2}
                    />
                  ))}
                  {DOM_NODES.map((node, i) => (
                    <g key={i}>
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={4}
                        fill="currentColor"
                        fillOpacity={0.15}
                        strokeOpacity={0.4}
                      />
                      <text
                        x={node.x}
                        y={node.y + 16}
                        textAnchor="middle"
                        fontSize="9"
                        fontFamily="var(--font-mono, monospace)"
                        fill="currentColor"
                        stroke="none"
                        opacity={0.5}
                      >
                        {node.label}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>

              <p className="mt-4 text-[13px] leading-relaxed text-muted">
                The DOM is a tree.{" "}
                <code className="font-mono text-foreground/70">
                  document.querySelector
                </code>{" "}
                walks it depth-first, pre-order, left to right. That&apos;s why
                it returns the{" "}
                <span className="text-foreground">
                  first match in document order
                </span>
                .
              </p>
            </div>
          </Section>

          {/* 4. Interactive graph BFS */}
          <Section className="mt-14" transition={t}>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted/40">
              Graph BFS — shortest path
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-muted">
              Unlike a tree, a graph can have cycles. BFS explores level by
              level and finds the shortest path in an unweighted graph. A{" "}
              <span className="text-foreground">visited set</span> prevents
              revisiting nodes.
            </p>
            <div className="mt-6">
              <GraphBFSDemo />
            </div>
          </Section>

          {/* 5. Code templates */}
          <Section className="mt-14" transition={t}>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted/40">
              Templates
            </h2>

            <p className="mt-4 font-mono text-[12px] text-muted/40">
              Tree DFS — recursive
            </p>
            <pre className="mt-2 overflow-x-auto border-l-2 border-foreground/10 bg-foreground/[0.02] py-4 pl-4 pr-3 font-mono text-[13px] leading-relaxed">
              <span className="text-foreground/70">function</span>{" "}
              <span className="text-foreground">dfs</span>(
              <span className="text-foreground">node</span>:{" "}
              <span className="text-foreground/70">TreeNode</span> |{" "}
              <span className="text-foreground/70">null</span>) {"{\n"}
              {"  "}
              <span className="text-foreground/70">if</span> (!node){" "}
              <span className="text-foreground/70">return</span>
              {"\n\n"}
              {"  "}
              <span className="text-foreground/25">
                {"// pre-order: process here"}
              </span>
              {"\n"}
              {"  "}dfs(node.left)
              {"\n"}
              {"  "}
              <span className="text-foreground/25">
                {"// in-order: process here"}
              </span>
              {"\n"}
              {"  "}dfs(node.right)
              {"\n"}
              {"  "}
              <span className="text-foreground/25">
                {"// post-order: process here"}
              </span>
              {"\n"}
              {"}"}
            </pre>

            <p className="mt-6 font-mono text-[12px] text-muted/40">
              Tree BFS — iterative with queue
            </p>
            <pre className="mt-2 overflow-x-auto border-l-2 border-foreground/10 bg-foreground/[0.02] py-4 pl-4 pr-3 font-mono text-[13px] leading-relaxed">
              <span className="text-foreground/70">function</span>{" "}
              <span className="text-foreground">bfs</span>(
              <span className="text-foreground">root</span>:{" "}
              <span className="text-foreground/70">TreeNode</span>) {"{\n"}
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
              <span className="text-foreground/70">if</span> (node.left)
              queue.push(node.left)
              {"\n"}
              {"    "}
              <span className="text-foreground/70">if</span> (node.right)
              queue.push(node.right)
              {"\n"}
              {"  }\n"}
              {"}"}
            </pre>

            <p className="mt-6 font-mono text-[12px] text-muted/40">
              Graph BFS — with visited set
            </p>
            <pre className="mt-2 overflow-x-auto border-l-2 border-foreground/10 bg-foreground/[0.02] py-4 pl-4 pr-3 font-mono text-[13px] leading-relaxed">
              <span className="text-foreground/70">function</span>{" "}
              <span className="text-foreground">bfs</span>(
              <span className="text-foreground">graph</span>:{" "}
              <span className="text-foreground/70">number</span>[][],{" "}
              <span className="text-foreground">start</span>:{" "}
              <span className="text-foreground/70">number</span>) {"{\n"}
              {"  "}
              <span className="text-foreground/70">const</span> visited ={" "}
              <span className="text-foreground/70">new</span> Set([start])
              {"\n"}
              {"  "}
              <span className="text-foreground/70">const</span> queue = [start]
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
              <span className="text-foreground/70">const</span> nb{" "}
              <span className="text-foreground/70">of</span> graph[node])
              {"\n"}
              {"      "}
              <span className="text-foreground/70">
                if
              </span> (!visited.has(nb)) {"{\n"}
              {"        "}visited.add(nb)
              {"\n"}
              {"        "}queue.push(nb)
              {"\n"}
              {"      }\n"}
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
                <li>Hierarchical data (file systems, org charts, DOM)</li>
                <li>Shortest path in an unweighted graph</li>
                <li>&quot;Process level by level&quot;</li>
                <li>Connected components</li>
                <li>Cycle detection</li>
              </ul>
              <p className="mt-3 font-mono text-[13px] text-muted/60">
                O(V + E) time
              </p>
            </div>
          </Section>

          {/* 7. Bottom nav */}
          <nav className="mt-16 flex items-center border-t border-foreground/5 pt-6">
            <Link
              href="/learn/binary-search"
              className="font-mono text-[13px] text-muted transition-colors hover:text-foreground"
            >
              &larr; Binary Search
            </Link>
            <Link
              href="/learn/recursion-backtracking"
              className="ml-auto font-mono text-[13px] text-muted transition-colors hover:text-foreground"
            >
              Recursion & Backtracking &rarr;
            </Link>
          </nav>
        </div>
      </main>
    </div>
  );
}
