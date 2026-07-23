"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import {
  buildGraphData,
  buildLayeredLayout,
  FLAT_NODE_H,
  type GraphNode,
} from "./graphData";

type Props = { reducedMotion: boolean };

/** Uniform card width, kept under the column pitch so columns never touch. */
function widthFor(node: GraphNode): number {
  return node.kind === "root" ? 148 : 150;
}

/**
 * The flat view: a tidy top-down layered graph of the same nodes and edges,
 * drawn as rectangles. No physics — positions come from the layered layout and
 * the canvas scrolls if it is wider than the viewport, so nodes never overlap.
 * Write-ups are tagged "notes" so they read as distinct from the same-named
 * feature they document. Hovering dims everything not connected to the node.
 */
export default function FlatGraph({ reducedMotion }: Props) {
  const data = useMemo(() => buildGraphData(), []);
  const layout = useMemo(() => buildLayeredLayout(data), [data]);
  const [hovered, setHovered] = useState<string | null>(null);
  const [compact, setCompact] = useState(false);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  // On phones the column graph is unreadable, so fall back to a stacked list.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setCompact(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Root's children as groups (Apps + each category), each with its items.
  const groups = useMemo(() => {
    const childMap = new Map<string, string[]>();
    for (const e of data.edges) {
      if (e.bridge) continue;
      const list = childMap.get(e.source);
      if (list) list.push(e.target);
      else childMap.set(e.source, [e.target]);
    }
    const byId = new Map(data.nodes.map((n) => [n.id, n]));
    return (childMap.get("root") ?? []).map((gid) => ({
      node: byId.get(gid)!,
      items: (childMap.get(gid) ?? []).map((id) => byId.get(id)!),
    }));
  }, [data]);

  const center = (id: string) =>
    layout.positions.get(id) ?? { x: 0, y: 0 };

  // Neighbour lookup for hover dimming.
  const neighbors = useMemo(() => {
    const map = new Map<string, Set<string>>();
    data.nodes.forEach((n) => map.set(n.id, new Set([n.id])));
    data.edges.forEach((e) => {
      map.get(e.source)?.add(e.target);
      map.get(e.target)?.add(e.source);
    });
    return map;
  }, [data]);

  const colorOf = useMemo(
    () => new Map(data.nodes.map((n) => [n.id, n.color])),
    [data],
  );

  // Start scrolled so the root sits at the top-centre, since it anchors the tree.
  useEffect(() => {
    const scroller = scrollerRef.current;
    const root = layout.positions.get("root");
    if (scroller && root) {
      scroller.scrollLeft = Math.max(0, root.x - scroller.clientWidth / 2);
    }
  }, [layout]);

  // Top-down reveal on mount.
  useEffect(() => {
    if (reducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const boxes = canvas.querySelectorAll("[data-flat-node]");
    const paths = canvas.querySelectorAll("[data-flat-edge]");
    gsap.fromTo(
      boxes,
      { opacity: 0, y: -16 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: "power2.out",
        stagger: { each: 0.015, from: "start" },
        clearProps: "transform",
      },
    );
    gsap.fromTo(
      paths,
      { opacity: 0 },
      { opacity: 1, duration: 0.6, delay: 0.15, stagger: 0.006 },
    );
  }, [reducedMotion]);

  const halfH = FLAT_NODE_H / 2;

  // Mobile: a stacked, grouped list — the columns become sections. Padded clear
  // of the fixed header (top) and corner nav (bottom); the root is already the
  // header wordmark, so it isn't repeated here.
  if (compact) {
    return (
      <div className="h-full w-full overflow-auto px-4 pb-20 pt-20">
        <div className="mx-auto max-w-md space-y-7">
          {groups.map((g) => (
            <section key={g.node.id}>
              <div className="mb-2 flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{
                    background: g.node.color,
                    boxShadow: `0 0 10px ${g.node.color}`,
                  }}
                />
                <h3 className="text-sm font-semibold text-foreground">
                  {g.node.label}
                </h3>
                <span className="text-xs text-muted">{g.items.length}</span>
              </div>
              <div className="space-y-1.5">
                {g.items.map((item) => (
                  <FlatRow key={item.id} node={item} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div ref={scrollerRef} className="h-full w-full overflow-auto">
      <div
        ref={canvasRef}
        className="relative mx-auto"
        style={{
          width: Math.max(layout.width, 0),
          height: Math.max(layout.height, 0),
          minWidth: "100%",
          minHeight: "100%",
        }}
      >
        <svg
          className="absolute inset-0"
          width={layout.width}
          height={layout.height}
          aria-hidden
        >
          {data.edges.map((edge, i) => {
            const active =
              hovered != null &&
              (edge.source === hovered || edge.target === hovered);
            const dim = hovered != null && !active;
            const a = center(edge.source);
            const b = center(edge.target);
            const color = colorOf.get(edge.source);
            let d: string;
            if (edge.bridge) {
              // Cross-column link (feature to its write-up): gentle S between
              // the two columns.
              const my = (a.y + b.y) / 2;
              d = `M${a.x},${a.y} C${a.x},${my} ${b.x},${my} ${b.x},${b.y}`;
            } else if (edge.source === "root") {
              // Root fans out to each column header below it.
              const my = (a.y + b.y) / 2;
              d = `M${a.x},${a.y + halfH} C${a.x},${my} ${b.x},${my} ${b.x},${b.y - halfH}`;
            } else {
              // Header to a stacked child: a straight spine down the column.
              d = `M${a.x},${a.y + halfH} L${b.x},${b.y - halfH}`;
            }
            return (
              <path
                key={i}
                data-flat-edge
                d={d}
                fill="none"
                stroke={active || edge.bridge ? color : "currentColor"}
                className={active || edge.bridge ? "" : "text-foreground/15"}
                strokeWidth={active ? 2 : edge.bridge ? 1.5 : 1}
                strokeOpacity={dim ? 0.2 : edge.bridge && !active ? 0.55 : 1}
                strokeDasharray={edge.bridge ? "4 4" : undefined}
                style={{ transition: "stroke-opacity 0.2s, stroke-width 0.2s" }}
              />
            );
          })}
        </svg>

        {data.nodes.map((node) => {
          const pos = layout.positions.get(node.id);
          if (!pos) return null;
          const dim = hovered != null && !neighbors.get(hovered)?.has(node.id);
          return (
            <FlatNode
              key={node.id}
              node={node}
              x={pos.x}
              y={pos.y}
              width={widthFor(node)}
              dim={dim}
              onEnter={() => setHovered(node.id)}
              onLeave={() => setHovered((h) => (h === node.id ? null : h))}
            />
          );
        })}
      </div>
    </div>
  );
}

/** A full-width row card for the mobile stacked list. */
function FlatRow({ node }: { node: GraphNode }) {
  const common = {
    className:
      "flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 transition-colors hover:border-foreground/20",
    style: { borderLeftColor: node.color, borderLeftWidth: 3 } as React.CSSProperties,
  };
  const content = (
    <>
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ background: node.color, boxShadow: `0 0 8px ${node.color}` }}
      />
      <span className="truncate text-sm font-medium text-foreground">
        {node.label}
      </span>
      {node.kind === "thought" ? (
        <span className="ml-auto shrink-0 rounded-sm bg-foreground/10 px-1 text-[9px] font-semibold uppercase tracking-wide text-muted">
          notes
        </span>
      ) : null}
    </>
  );
  if (node.href && node.external) {
    return (
      <a {...common} href={node.href} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }
  if (node.href) {
    return (
      <Link {...common} href={node.href}>
        {content}
      </Link>
    );
  }
  return <div {...common}>{content}</div>;
}

type FlatNodeProps = {
  node: GraphNode;
  x: number;
  y: number;
  width: number;
  dim: boolean;
  onEnter: () => void;
  onLeave: () => void;
};

function FlatNode({ node, x, y, width, dim, onEnter, onLeave }: FlatNodeProps) {
  const emphasis =
    node.kind === "root"
      ? "text-sm font-bold"
      : node.kind === "hub" || node.kind === "category"
        ? "text-[13px] font-semibold"
        : "text-xs font-medium";

  const common = {
    "data-flat-node": true,
    title: node.blurb,
    onPointerEnter: onEnter,
    onPointerLeave: onLeave,
    className: [
      "absolute flex items-center gap-1.5 overflow-hidden rounded-lg border border-border bg-surface px-2.5 shadow-sm transition-[opacity,box-shadow,transform] hover:-translate-y-0.5 hover:shadow-md",
      dim ? "opacity-30" : "opacity-100",
    ].join(" "),
    style: {
      left: x,
      top: y,
      width,
      height: FLAT_NODE_H,
      transform: "translate(-50%, -50%)",
      borderTopColor: node.color,
      borderTopWidth: 3,
    } as React.CSSProperties,
  };

  const content = (
    <>
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ background: node.color, boxShadow: `0 0 8px ${node.color}` }}
      />
      <span className={`truncate text-foreground ${emphasis}`}>
        {node.label}
      </span>
      {node.kind === "thought" ? (
        <span className="ml-auto shrink-0 rounded-sm bg-foreground/10 px-1 text-[9px] font-semibold uppercase tracking-wide text-muted">
          notes
        </span>
      ) : null}
    </>
  );

  if (node.href && node.external) {
    return (
      <a {...common} href={node.href} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }
  if (node.href) {
    return (
      <Link {...common} href={node.href}>
        {content}
      </Link>
    );
  }
  return <div {...common}>{content}</div>;
}
