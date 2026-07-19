"use client";

import { useState } from "react";
import type { WorkFeature } from "../_data/types";

const ACCENT = "var(--wp-accent, #60a5fa)";

type Node = { id: string; label: string; x: number; y: number; code: string };
type Edge = [string, string];

const NODES: Node[] = [
  { id: "trigger", label: "On purchase", x: 20, y: 40, code: "on(event = \"purchase\")" },
  { id: "filter", label: "Filter whales", x: 150, y: 20, code: "where(spend_30d > 100)" },
  { id: "enrich", label: "Enrich profile", x: 150, y: 90, code: "join(profiles, on = \"user_id\")" },
  { id: "action", label: "Send reward", x: 280, y: 55, code: "grant(item = \"vip_crate\")" },
];

const EDGES: Edge[] = [
  ["trigger", "filter"],
  ["trigger", "enrich"],
  ["filter", "action"],
  ["enrich", "action"],
];

const NODE_W = 96;
const NODE_H = 34;

/**
 * Vignette: portal v2's hook/workflow editor. The original used a node-graph
 * library plus a code editor; this is a hand-built SVG graph, click a node
 * to see its (read-only) config below.
 */
export default function WorkflowEditorDemo({ feature }: { feature: WorkFeature }) {
  const [selected, setSelected] = useState<string>("trigger");
  const byId = (id: string) => NODES.find((n) => n.id === id)!;
  const node = byId(selected);

  return (
    <div className="flex h-full min-h-64 flex-col gap-3 p-4">
      <p className="text-[13px] font-semibold text-foreground">{feature.title}</p>

      <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-border bg-background/40">
        <svg viewBox="0 0 400 150" className="h-full w-full" role="img" aria-label="Workflow graph">
          {EDGES.map(([from, to]) => {
            const a = byId(from);
            const b = byId(to);
            return (
              <line
                key={`${from}-${to}`}
                x1={a.x + NODE_W}
                y1={a.y + NODE_H / 2}
                x2={b.x}
                y2={b.y + NODE_H / 2}
                stroke="currentColor"
                strokeOpacity={0.3}
                strokeWidth={1.5}
              />
            );
          })}
          {NODES.map((n) => {
            const active = n.id === selected;
            return (
              <g
                key={n.id}
                transform={`translate(${n.x}, ${n.y})`}
                onClick={() => setSelected(n.id)}
                className="cursor-pointer"
              >
                <rect
                  width={NODE_W}
                  height={NODE_H}
                  rx={6}
                  fill="var(--color-background, #fff)"
                  stroke={active ? ACCENT : "currentColor"}
                  strokeOpacity={active ? 1 : 0.3}
                  strokeWidth={active ? 2 : 1}
                />
                <text
                  x={NODE_W / 2}
                  y={NODE_H / 2 + 3}
                  textAnchor="middle"
                  fontSize={9}
                  fill="currentColor"
                >
                  {n.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div>
        <p className="mb-1 text-[11px] text-muted">
          {node.label} · config (read-only)
        </p>
        <pre className="overflow-x-auto rounded-md border border-border bg-background p-2 font-mono text-[11px] text-foreground">
          {node.code}
        </pre>
      </div>
    </div>
  );
}
