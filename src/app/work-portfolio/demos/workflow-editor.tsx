"use client";

import { useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import Modal from "@/components/ui/Modal";
import type { WorkFeature } from "../_data/types";

const ACCENT = "var(--wp-accent, #4a83c8)";

type Node = { id: string; label: string; x: number; y: number; code: string };
type Edge = [string, string];

const INITIAL_NODES: Node[] = [
  {
    id: "trigger",
    label: "On purchase",
    x: 20,
    y: 40,
    code: 'on(event = "purchase")',
  },
  {
    id: "filter",
    label: "Filter whales",
    x: 150,
    y: 20,
    code: "where(spend_30d > 100)",
  },
  {
    id: "enrich",
    label: "Enrich profile",
    x: 150,
    y: 90,
    code: 'join(profiles, on = "user_id")',
  },
  {
    id: "action",
    label: "Send reward",
    x: 280,
    y: 55,
    code: 'grant(item = "vip_crate")',
  },
];

const INITIAL_EDGES: Edge[] = [
  ["trigger", "filter"],
  ["trigger", "enrich"],
  ["filter", "action"],
  ["enrich", "action"],
];

const NODE_W = 96;
const NODE_H = 34;
const VIEW_W = 400;
const VIEW_H = 150;

/** Move one node to a new position, leaving the rest untouched. */
export function moveNode(
  nodes: Node[],
  id: string,
  x: number,
  y: number,
): Node[] {
  return nodes.map((n) => (n.id === id ? { ...n, x, y } : n));
}

/** Add an edge, skipping self-links and duplicates. */
export function addEdge(edges: Edge[], from: string, to: string): Edge[] {
  if (from === to) return edges;
  if (edges.some(([a, b]) => a === from && b === to)) return edges;
  return [...edges, [from, to]];
}

/** Remove the edge matching from -> to. */
export function removeEdge(edges: Edge[], from: string, to: string): Edge[] {
  return edges.filter(([a, b]) => !(a === from && b === to));
}

/**
 * Vignette: portal v2's hook/workflow editor. A hand-built SVG node graph you
 * can actually edit: drag nodes around, click one to edit its config, and add
 * or remove connections between them. The original paired a node-graph library
 * with a code editor; this rebuilds the idea from scratch.
 */
export default function WorkflowEditorDemo({
  feature,
}: {
  feature: WorkFeature;
}) {
  const [nodes, setNodes] = useState<Node[]>(INITIAL_NODES);
  const [edges, setEdges] = useState<Edge[]>(INITIAL_EDGES);
  const [selected, setSelected] = useState<string>("trigger");
  const [from, setFrom] = useState<string>("trigger");
  const [to, setTo] = useState<string>("action");
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{
    id: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  const byId = (id: string) => nodes.find((n) => n.id === id)!;
  const node = byId(selected);

  const setCode = (code: string) =>
    setNodes((ns) => ns.map((n) => (n.id === selected ? { ...n, code } : n)));
  const setLabel = (label: string) =>
    setNodes((ns) => ns.map((n) => (n.id === selected ? { ...n, label } : n)));

  const onPointerDown = (e: ReactPointerEvent, id: string) => {
    setSelected(id);
    const n = byId(id);
    drag.current = {
      id,
      startX: e.clientX,
      startY: e.clientY,
      origX: n.x,
      origY: n.y,
    };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    if (!drag.current || !svgRef.current) return;
    // Read everything off the ref here, at event time. The updater below runs
    // when React flushes, and a fast drag delivers its moves and its pointerup
    // in one task -- so by then endDrag has already nulled the ref, and
    // reaching through it there threw on null and took the demo down to its
    // error boundary. The id is a value now, not a lookup done later.
    const { id, origX, origY, startX, startY } = drag.current;
    const scaleX = VIEW_W / svgRef.current.clientWidth;
    const scaleY = VIEW_H / svgRef.current.clientHeight;
    const nextX = origX + (e.clientX - startX) * scaleX;
    const nextY = origY + (e.clientY - startY) * scaleY;
    const clampedX = Math.max(0, Math.min(VIEW_W - NODE_W, nextX));
    const clampedY = Math.max(0, Math.min(VIEW_H - NODE_H, nextY));
    setNodes((ns) => moveNode(ns, id, clampedX, clampedY));
  };

  const endDrag = () => {
    drag.current = null;
  };

  // Clicking a node opens an action menu anchored to it; "Configure" opens the
  // editor modal, the others act on the graph directly.
  const [menuNode, setMenuNode] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);

  const openNode = (id: string) => {
    setSelected(id);
    setMenuNode(id);
  };

  const duplicateNode = (id: string) => {
    const src = byId(id);
    const copyId = `${src.id}-copy-${crypto.randomUUID().slice(0, 6)}`;
    setNodes((ns) => [
      ...ns,
      {
        ...src,
        id: copyId,
        label: `${src.label} copy`,
        x: Math.min(VIEW_W - NODE_W, src.x + 24),
        y: Math.min(VIEW_H - NODE_H, src.y + 24),
      },
    ]);
    setSelected(copyId);
    setMenuNode(null);
  };

  const deleteNode = (id: string) => {
    if (nodes.length <= 1) return;
    setEdges((es) => es.filter(([a, b]) => a !== id && b !== id));
    setNodes((ns) => {
      const remaining = ns.filter((n) => n.id !== id);
      setSelected(remaining[0]?.id ?? "");
      return remaining;
    });
    setMenuNode(null);
  };

  const menu = menuNode ? byId(menuNode) : null;
  const editNode = editing ? byId(editing) : null;

  return (
    <div
      className="flex h-full min-h-64 flex-col gap-3 p-5 text-foreground"
      style={{
        background: "hsl(212 44% 8%)",
        backgroundImage:
          "linear-gradient(hsl(210 85% 62% / 0.06) 1px, transparent 1px), linear-gradient(90deg, hsl(210 85% 62% / 0.06) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    >
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
          Analytics portal v2{" "}
          <span style={{ color: "hsl(210 85% 66%)" }}>&#47;&#47;</span> workflows
        </p>
        <p className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {feature.title}
        </p>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden rounded-lg border border-border bg-background/40">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="h-full w-full touch-none"
          role="img"
          aria-label="Workflow graph"
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
          onClick={() => setMenuNode(null)}
        >
          {edges.map(([f, t]) => {
            const a = byId(f);
            const b = byId(t);
            return (
              <line
                key={`${f}-${t}`}
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
          {nodes.map((n) => {
            const active = n.id === selected;
            return (
              <g
                key={n.id}
                transform={`translate(${n.x}, ${n.y})`}
                onPointerDown={(e) => onPointerDown(e, n.id)}
                onClick={(e) => {
                  e.stopPropagation();
                  openNode(n.id);
                }}
                className="cursor-grab active:cursor-grabbing"
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

        {menu && (
          <div
            role="menu"
            aria-label={`Actions for ${menu.label}`}
            className="absolute z-20 w-40 -translate-x-1/2 rounded-lg border border-border bg-surface-raised/95 p-1 shadow-xl backdrop-blur-sm"
            style={{
              left: `${((menu.x + NODE_W / 2) / VIEW_W) * 100}%`,
              top: `${((menu.y + NODE_H) / VIEW_H) * 100}%`,
            }}
          >
            <p className="px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted">
              {menu.label}
            </p>
            {[
              { label: "Configure step", act: () => setEditing(menu.id) },
              { label: "Duplicate", act: () => duplicateNode(menu.id) },
              { label: "Run once", act: () => setEditing(menu.id) },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuNode(null);
                  item.act();
                }}
                className="block w-full rounded px-2 py-1.5 text-left text-[12px] text-foreground hover:bg-white/5"
              >
                {item.label}
              </button>
            ))}
            <button
              type="button"
              role="menuitem"
              onClick={() => deleteNode(menu.id)}
              disabled={nodes.length <= 1}
              className="block w-full rounded px-2 py-1.5 text-left text-[12px] text-error-500 hover:bg-error-500/10 disabled:opacity-40"
            >
              Delete step
            </button>
          </div>
        )}
      </div>

      {editNode && (
        <Modal
          open
          onClose={() => setEditing(null)}
          aria-label={`Configure ${editNode.label}`}
        >
          <div className="flex flex-col gap-3">
            <p className="font-display text-lg font-bold text-foreground">
              Configure step
            </p>
            <label className="block text-[12px]">
              <span className="mb-1 block font-medium text-muted">Name</span>
              <input
                aria-label="Step name"
                value={editNode.label}
                onChange={(e) =>
                  setNodes((ns) =>
                    ns.map((n) =>
                      n.id === editNode.id ? { ...n, label: e.target.value } : n,
                    ),
                  )
                }
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-[13px] font-medium text-foreground"
              />
            </label>
            <label className="block text-[12px]">
              <span className="mb-1 block font-medium text-muted">Config</span>
              <textarea
                aria-label="Step config"
                value={editNode.code}
                onChange={(e) =>
                  setNodes((ns) =>
                    ns.map((n) =>
                      n.id === editNode.id ? { ...n, code: e.target.value } : n,
                    ),
                  )
                }
                rows={3}
                className="w-full resize-none rounded-md border border-border bg-background p-2 font-mono text-[12px] text-foreground"
              />
            </label>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-md px-4 py-1.5 text-[12px] font-semibold text-white"
                style={{ backgroundColor: ACCENT }}
              >
                Done
              </button>
            </div>
          </div>
        </Modal>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <input
            aria-label="Node label"
            value={node.label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-2 py-1 text-[12px] font-medium text-foreground"
          />
          <textarea
            aria-label="Node config"
            value={node.code}
            onChange={(e) => setCode(e.target.value)}
            rows={2}
            className="w-full resize-none rounded-md border border-border bg-background p-2 font-mono text-[11px] text-foreground"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <select
              aria-label="Edge from"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="min-w-0 flex-1 rounded-md border border-border bg-background px-1.5 py-1 text-[11px] text-foreground"
            >
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.label}
                </option>
              ))}
            </select>
            <span className="text-muted">→</span>
            <select
              aria-label="Edge to"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="min-w-0 flex-1 rounded-md border border-border bg-background px-1.5 py-1 text-[11px] text-foreground"
            >
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setEdges((es) => addEdge(es, from, to))}
              className="shrink-0 rounded-md px-2 py-1 text-[11px] font-medium text-white"
              style={{ backgroundColor: ACCENT }}
            >
              Add edge
            </button>
          </div>
          <ul className="max-h-20 space-y-0.5 overflow-y-auto">
            {edges.map(([f, t]) => (
              <li
                key={`${f}-${t}`}
                data-testid="edge-row"
                className="flex items-center justify-between rounded border border-border px-1.5 py-0.5 text-[10px] text-muted"
              >
                <span>
                  {byId(f).label} → {byId(t).label}
                </span>
                <button
                  type="button"
                  aria-label={`Remove edge ${f} to ${t}`}
                  onClick={() => setEdges((es) => removeEdge(es, f, t))}
                  className="px-1 hover:text-foreground"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
