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

/** Fixed node-box width per kind, kept under the leaf gap so cards never touch. */
function widthFor(node: GraphNode): number {
  if (node.kind === "root") return 150;
  if (node.kind === "hub" || node.kind === "category") return 166;
  return 170;
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
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

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
              // Same-level cross-link: arc downward beneath the row.
              const arc = 46;
              d = `M${a.x},${a.y + halfH} C${a.x},${a.y + halfH + arc} ${b.x},${b.y + halfH + arc} ${b.x},${b.y + halfH}`;
            } else {
              // Parent (above) to child (below): vertical S-curve.
              const my = (a.y + b.y) / 2;
              d = `M${a.x},${a.y + halfH} C${a.x},${my} ${b.x},${my} ${b.x},${b.y - halfH}`;
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
