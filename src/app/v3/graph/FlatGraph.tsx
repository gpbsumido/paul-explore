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
  // Progressive disclosure: which section header is expanded (its items shown).
  // null = collapsed (only the root and the section headers show). Hovering a
  // header opens it; it stays open until a different header is hovered.
  const [openGroup, setOpenGroup] = useState<string | null>(null);
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

  // Header (root's children) ids, and which header each item belongs to, for
  // progressive disclosure.
  const { headerIds, itemGroup } = useMemo(() => {
    const headers = new Set(groups.map((g) => g.node.id));
    const item = new Map<string, string>();
    for (const g of groups) for (const it of g.items) item.set(it.id, g.node.id);
    return { headerIds: headers, itemGroup: item };
  }, [groups]);

  const isVisible = (id: string) =>
    id === "root" || headerIds.has(id) || itemGroup.get(id) === openGroup;

  const isSectionNode = (id: string) => id === "root" || headerIds.has(id);
  // Hovering a section header just reveals its items — it shouldn't dim the
  // other headers, since those are the persistent navigation. Only hovering an
  // item fades the rest (and never the headers).
  const hoveredIsSection = hovered != null && isSectionNode(hovered);

  // Canvas only needs to be as tall as what's currently shown, so the collapsed
  // view is a compact root + header row and opening a section grows it.
  const visibleHeight = useMemo(() => {
    let maxY = 0;
    for (const n of data.nodes) {
      if (!isVisible(n.id)) continue;
      const p = layout.positions.get(n.id);
      if (p && p.y > maxY) maxY = p.y;
    }
    return maxY + FLAT_NODE_H / 2 + 40;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, layout, openGroup, headerIds, itemGroup]);

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
        // Clear opacity too, not just transform: otherwise the intro leaves an
        // inline opacity:1 that overrides the hover-dim class, so hovering never
        // fades the unconnected nodes.
        clearProps: "transform,opacity",
      },
    );
    gsap.fromTo(
      paths,
      { opacity: 0 },
      { opacity: 1, duration: 0.6, delay: 0.15, stagger: 0.006 },
    );
    return () => {
      gsap.killTweensOf(boxes);
      gsap.killTweensOf(paths);
    };
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
          height: Math.max(visibleHeight, 0),
          minWidth: "100%",
          minHeight: "100%",
        }}
      >
        <svg
          className="absolute inset-0"
          width={layout.width}
          height={visibleHeight}
          aria-hidden
        >
          {data.edges.map((edge, i) => {
            // Progressive disclosure: only draw an edge when both ends are shown.
            if (!isVisible(edge.source) || !isVisible(edge.target)) return null;
            const active =
              hovered != null &&
              (edge.source === hovered || edge.target === hovered);
            // Only an item hover dims; a header hover just highlights its own edges.
            const dim = hovered != null && !hoveredIsSection && !active;
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
          if (!pos || !isVisible(node.id)) return null;
          // Headers/root are navigation and never dim; only items fade, and
          // only when another item (not a header) is hovered.
          const dim =
            hovered != null &&
            !hoveredIsSection &&
            !isSectionNode(node.id) &&
            !neighbors.get(hovered)?.has(node.id);
          return (
            <FlatNode
              key={node.id}
              node={node}
              x={pos.x}
              y={pos.y}
              width={widthFor(node)}
              dim={dim}
              expanded={hovered === node.id}
              onEnter={() => {
                setHovered(node.id);
                // Hovering a section header opens it; it stays open (even after
                // you leave) until you hover a different header.
                if (headerIds.has(node.id)) setOpenGroup(node.id);
              }}
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
      "flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 outline-none transition-colors hover:border-foreground/20 focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-1 focus-visible:ring-offset-background",
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
  /** The hovered node grows to its full, untruncated label and floats above the rest. */
  expanded: boolean;
  onEnter: () => void;
  onLeave: () => void;
};

function FlatNode({ node, x, y, width, dim, expanded, onEnter, onLeave }: FlatNodeProps) {
  // Root, the Apps hub, and the category headers are the graph's main sections,
  // so they get a tinted fill, a full colour border, and a glow to stand out
  // from the leaf cards.
  const isSection =
    node.kind === "root" || node.kind === "hub" || node.kind === "category";

  const emphasis =
    node.kind === "root"
      ? "text-sm font-bold"
      : node.kind === "hub" || node.kind === "category"
        ? "text-[13px] font-bold"
        : "text-xs font-medium";

  const common = {
    "data-flat-node": true,
    title: node.blurb,
    onPointerEnter: onEnter,
    onPointerLeave: onLeave,
    className: [
      "absolute flex items-center gap-1.5 rounded-lg border px-2.5 outline-none transition-[opacity,box-shadow,transform] hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-1 focus-visible:ring-offset-background",
      // Expanded (hovered) node grows past its column and floats over the rest.
      expanded ? "z-30 overflow-visible shadow-lg" : "overflow-hidden",
      isSection ? "" : "border-border bg-surface shadow-sm",
      // Non-connected nodes fade well back on hover so the connected cluster reads.
      dim ? "opacity-20" : "opacity-100",
    ].join(" "),
    style: {
      left: x,
      top: y,
      width: expanded ? "auto" : width,
      // Never shrink below the resting width — only grow for long labels — so a
      // short-label node (e.g. the root) doesn't shrink out from under the
      // cursor on hover and flicker.
      minWidth: expanded ? width : undefined,
      maxWidth: expanded ? "min(20rem, 80vw)" : undefined,
      height: FLAT_NODE_H,
      transform: "translate(-50%, -50%)",
      borderTopColor: node.color,
      borderTopWidth: 3,
      ...(isSection
        ? {
            background: `color-mix(in srgb, ${node.color} 16%, var(--color-surface))`,
            borderColor: node.color,
            boxShadow: `0 0 0 1px ${node.color}40, 0 4px 16px ${node.color}30`,
          }
        : {}),
    } as React.CSSProperties,
  };

  const content = (
    <>
      <span
        className={`${isSection ? "h-2.5 w-2.5" : "h-2 w-2"} shrink-0 rounded-full`}
        style={{ background: node.color, boxShadow: `0 0 8px ${node.color}` }}
      />
      <span
        className={`${expanded ? "whitespace-nowrap" : "truncate"} text-foreground ${emphasis}`}
      >
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
