"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import {
  buildGraphData,
  buildLayeredLayout,
  type GraphNode,
} from "./graphData";

type Props = { reducedMotion: boolean };

/** Fixed node-box width per kind so edges can route cleanly edge-to-edge. */
function widthFor(node: GraphNode): number {
  if (node.kind === "root") return 150;
  if (node.kind === "hub" || node.kind === "category") return 178;
  return 200;
}
const NODE_H = 34;

/**
 * The flat view: a tidy left-to-right layered graph of the same nodes and
 * edges, drawn as rectangles. No physics — positions come from the layered
 * layout and the canvas scrolls if it is taller than the viewport, so nodes
 * never overlap. Hovering dims everything not connected to the node.
 */
export default function FlatGraph({ reducedMotion }: Props) {
  const data = useMemo(() => buildGraphData(), []);
  const layout = useMemo(() => buildLayeredLayout(data), [data]);
  const [hovered, setHovered] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);

  const { widthOf, centerY, leftX, rightX } = useMemo(() => {
    const w = new Map(data.nodes.map((n) => [n.id, widthFor(n)]));
    const pos = layout.positions;
    return {
      widthOf: w,
      centerY: (id: string) => pos.get(id)?.y ?? 0,
      leftX: (id: string) => pos.get(id)?.x ?? 0,
      rightX: (id: string) => (pos.get(id)?.x ?? 0) + (w.get(id) ?? 0),
    };
  }, [data, layout]);

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

  // Left-to-right reveal on mount.
  useEffect(() => {
    if (reducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const boxes = canvas.querySelectorAll("[data-flat-node]");
    const paths = canvas.querySelectorAll("[data-flat-edge]");
    gsap.fromTo(
      boxes,
      { opacity: 0, x: -18 },
      {
        opacity: 1,
        x: 0,
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

  return (
    <div className="h-full w-full overflow-auto">
      <div
        ref={canvasRef}
        className="relative"
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
            const x1 = edge.bridge ? leftX(edge.source) : rightX(edge.source);
            const y1 = centerY(edge.source);
            const x2 = leftX(edge.target);
            const y2 = centerY(edge.target);
            const cx = edge.bridge
              ? Math.min(x1, x2) - 46
              : (x1 + x2) / 2;
            const d = edge.bridge
              ? `M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}`
              : `M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}`;
            const color = data.nodes.find((n) => n.id === edge.source)?.color;
            return (
              <path
                key={i}
                data-flat-edge
                d={d}
                fill="none"
                stroke={active || edge.bridge ? color : "currentColor"}
                className={
                  active
                    ? ""
                    : edge.bridge
                      ? ""
                      : "text-foreground/15"
                }
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
          const w = widthOf.get(node.id) ?? 180;
          return (
            <FlatNode
              key={node.id}
              node={node}
              x={pos.x}
              y={pos.y}
              width={w}
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
      "absolute flex items-center gap-2 overflow-hidden rounded-lg border border-border bg-surface px-3 shadow-sm transition-[opacity,box-shadow,transform] hover:-translate-y-0.5 hover:shadow-md",
      dim ? "opacity-30" : "opacity-100",
    ].join(" "),
    style: {
      left: x,
      top: y,
      width,
      height: NODE_H,
      transform: "translateY(-50%)",
      borderLeftColor: node.color,
      borderLeftWidth: 3,
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
