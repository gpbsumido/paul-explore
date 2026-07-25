"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import {
  buildGraphData,
  buildLayeredLayout,
  FLAT_NODE_H,
  type GraphNode,
} from "./graphData";

type Props = { reducedMotion: boolean };

/**
 * How long a hover lingers after the pointer leaves a node, so you can travel to
 * the connected nodes it just revealed (in another column) before they hide.
 * Cancelled the moment you hover another node.
 */
const HOVER_GRACE_MS = 1500;

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
  const rootRef = useRef<HTMLDivElement | null>(null);
  // Grace timer that delays releasing the hover after the pointer leaves, so the
  // revealed connected nodes don't vanish before you can reach them.
  const hoverEndTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (hoverEndTimer.current) clearTimeout(hoverEndTimer.current);
    },
    [],
  );

  // Fall back to the stacked vertical list whenever the column canvas is wider
  // than the space available, i.e. showing every column would need horizontal
  // scrolling. That covers phones and any window (or zoom level) too narrow to
  // fit the full width, instead of switching on a fixed breakpoint alone.
  // useLayoutEffect so the decision lands before the first paint — otherwise a
  // too-narrow load flashes the column canvas for a frame before snapping to
  // the vertical list.
  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const sync = () => {
      const w = el.clientWidth;
      setCompact(w > 0 && layout.width > w);
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, [layout.width]);

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

  // Neighbour lookup: each node mapped to itself plus everything it connects to.
  // Used both to reveal a hovered node's connections and to dim the rest.
  const neighbors = useMemo(() => {
    const map = new Map<string, Set<string>>();
    data.nodes.forEach((n) => map.set(n.id, new Set([n.id])));
    data.edges.forEach((e) => {
      map.get(e.source)?.add(e.target);
      map.get(e.target)?.add(e.source);
    });
    return map;
  }, [data]);

  // Which category columns are shown: the open one, plus — while hovering — the
  // columns holding the hovered node and everything it connects to. Whole
  // columns open (so items stay lined up under their header); the dimming below
  // is what singles out the actually-connected nodes.
  const revealedGroups = useMemo(() => {
    const s = new Set<string>();
    if (openGroup) s.add(openGroup);
    if (hovered != null) {
      const own = itemGroup.get(hovered);
      if (own) s.add(own);
      for (const nb of neighbors.get(hovered) ?? []) {
        const g = itemGroup.get(nb);
        if (g) s.add(g);
      }
    }
    return s;
  }, [openGroup, hovered, itemGroup, neighbors]);

  const isVisible = (id: string) =>
    id === "root" ||
    headerIds.has(id) ||
    revealedGroups.has(itemGroup.get(id) ?? "");

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
  }, [data, layout, openGroup, headerIds, itemGroup, hovered, neighbors]);

  const center = (id: string) =>
    layout.positions.get(id) ?? { x: 0, y: 0 };

  const colorOf = useMemo(
    () => new Map(data.nodes.map((n) => [n.id, n.color])),
    [data],
  );

  // Top-down reveal on mount.
  useEffect(() => {
    if (reducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const boxes = canvas.querySelectorAll("[data-flat-node]");
    const paths = canvas.querySelectorAll("[data-flat-edge]");
    gsap.fromTo(
      boxes,
      { opacity: 0 },
      {
        opacity: 1,
        duration: 0.5,
        ease: "power2.out",
        stagger: { each: 0.015, from: "start" },
        // Clear only opacity, not transform: the intro leaves an inline
        // opacity:1 that would override the hover-dim class, so we drop it — but
        // clearing transform would also strip each card's translate(-50%,-50%)
        // centering and shove headers half a box off their column.
        clearProps: "opacity",
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

  // Vertical: a stacked, grouped accordion — the columns become sections.
  // Progressive disclosure, same as the desktop graph: only the section headers
  // show at rest and tapping one reveals its items (and collapses the rest).
  // Padded clear of the fixed header, whose height varies as it wraps on zoom.
  if (compact) {
    return (
      <div ref={rootRef} className="h-full w-full">
        <div
          className="h-full w-full overflow-auto px-4 pb-20"
          style={{ paddingTop: "calc(var(--v3-header-h, 5rem) + 1rem)" }}
        >
          <div className="mx-auto max-w-md space-y-2">
            {groups.map((g) => {
              const open = openGroup === g.node.id;
              return (
                <section
                  key={g.node.id}
                  className="overflow-hidden rounded-xl border border-border bg-surface/60"
                  style={{ borderLeftColor: g.node.color, borderLeftWidth: 3 }}
                >
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() =>
                      setOpenGroup((cur) => (cur === g.node.id ? null : g.node.id))
                    }
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left outline-none transition-colors hover:bg-surface focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-inset"
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{
                        background: g.node.color,
                        boxShadow: `0 0 10px ${g.node.color}`,
                      }}
                    />
                    <h3 className="text-sm font-semibold text-foreground">
                      {g.node.label}
                    </h3>
                    {g.items.length > 0 ? (
                      <span className="ml-auto text-xs text-muted">
                        {g.items.length}
                      </span>
                    ) : null}
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden
                      className={`shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
                    >
                      <path
                        d="M6 9l6 6 6-6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  {open ? (
                    <div className="space-y-1.5 px-3 pb-3 pt-0.5">
                      {g.items.map((item) => (
                        <FlatRow key={item.id} node={item} />
                      ))}
                    </div>
                  ) : null}
                </section>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="h-full w-full overflow-hidden">
      <div className="h-full w-full overflow-y-auto overflow-x-hidden">
        <div
          ref={canvasRef}
          className="relative mx-auto"
          style={{
            width: Math.max(layout.width, 0),
            height: Math.max(visibleHeight, 0),
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
                // Entering a node cancels any pending release from the one we
                // just left, so the hover moves cleanly between nodes.
                if (hoverEndTimer.current) {
                  clearTimeout(hoverEndTimer.current);
                  hoverEndTimer.current = null;
                }
                setHovered(node.id);
                // Hovering a section header opens it; it stays open (even after
                // you leave) until you hover a different header.
                if (headerIds.has(node.id)) setOpenGroup(node.id);
              }}
              onLeave={() => {
                // Don't drop the hover immediately — wait out the grace period so
                // you can travel to the revealed connected nodes. If you land on
                // another node first, its onEnter cancels this.
                if (hoverEndTimer.current) clearTimeout(hoverEndTimer.current);
                hoverEndTimer.current = setTimeout(() => {
                  hoverEndTimer.current = null;
                  setHovered((h) => (h === node.id ? null : h));
                }, HOVER_GRACE_MS);
              }}
            />
          );
        })}
        </div>
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
      "absolute flex items-center gap-1.5 rounded-lg border px-2.5 outline-none transition-[opacity,box-shadow] hover:shadow-md focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-1 focus-visible:ring-offset-background",
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
