"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { buildGraphData, type GraphNode } from "./graphData";
import {
  createSimState,
  stepSimulation,
  radialLayout,
  reheat,
  DEFAULT_PARAMS,
  type SimState,
} from "./simulation";

/** Movement (px) past which a pointer gesture counts as a drag, not a click. */
const DRAG_THRESHOLD = 5;

type Props = { reducedMotion: boolean };

/**
 * The v3 landing centrepiece: a draggable, force-directed graph of every
 * feature and write-up, wired by category and by each feature's own notes.
 * Physics runs in a rAF loop and is written straight to the DOM (transforms +
 * SVG line coords) to avoid re-rendering React every frame.
 */
export default function NodeGraph({ reducedMotion }: Props) {
  const data = useMemo(() => buildGraphData(), []);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const nodeEls = useRef<(HTMLElement | null)[]>([]);
  const innerEls = useRef<(HTMLElement | null)[]>([]);
  const edgeEls = useRef<(SVGLineElement | null)[]>([]);
  const simRef = useRef<SimState | null>(null);
  const frameRef = useRef<number | null>(null);
  const runningRef = useRef(false);
  // Smoothed viewport fit: maps origin-centred sim space onto the screen so the
  // graph always fills the room available. cx/cy is the sim-space centre.
  const fitRef = useRef({ scale: 1, cx: 0, cy: 0, init: false });

  // Drag bookkeeping (sx/sy are the pointer-down position in container px).
  const dragRef = useRef<{ i: number; moved: boolean; sx: number; sy: number } | null>(
    null,
  );
  // Delay before a hover starts pushing neighbours, so the highlight locks first.
  const focusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);

  // Adjacency: which edges touch a node, and the two endpoints of each edge.
  const { edgeEnds, nodeEdges } = useMemo(() => {
    const idx = new Map(data.nodes.map((n, i) => [n.id, i]));
    const ends = data.edges.map((e) => ({
      a: idx.get(e.source)!,
      b: idx.get(e.target)!,
      bridge: e.bridge ?? false,
      color: data.nodes[idx.get(e.source)!].color,
    }));
    const byNode: number[][] = data.nodes.map(() => []);
    ends.forEach((e, ei) => {
      byNode[e.a].push(ei);
      byNode[e.b].push(ei);
    });
    return { edgeEnds: ends, nodeEdges: byNode };
  }, [data]);

  /**
   * Ease the fit (scale + sim-space centre) toward one that frames the whole
   * layout inside the container with padding. Cheap and DOM-free, so warmup can
   * call it every iteration to keep collision's screen-scale accurate.
   */
  const recomputeFit = () => {
    const sim = simRef.current;
    const container = containerRef.current;
    if (!sim || !container) return;
    // Freeze the fit while dragging so the coordinate mapping stays stable and
    // the dragged node tracks the cursor exactly instead of the whole graph
    // rescaling out from under it.
    if (dragRef.current) return;
    const W = container.clientWidth;
    const H = container.clientHeight;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const nd of sim.nodes) {
      if (nd.x < minX) minX = nd.x;
      if (nd.y < minY) minY = nd.y;
      if (nd.x > maxX) maxX = nd.x;
      if (nd.y > maxY) maxY = nd.y;
    }
    const bboxW = Math.max(maxX - minX, 1);
    const bboxH = Math.max(maxY - minY, 1);
    const pad = W < 640 ? 60 : 110;
    const target = Math.min(
      (W - pad * 2) / bboxW,
      (H - pad * 2) / bboxH,
      1.5, // don't zoom past 1.5x when the graph is small
    );
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    const fit = fitRef.current;
    if (!fit.init) {
      fit.scale = target;
      fit.cx = cx;
      fit.cy = cy;
      fit.init = true;
    } else {
      const k = 0.12;
      fit.scale += (target - fit.scale) * k;
      fit.cx += (cx - fit.cx) * k;
      fit.cy += (cy - fit.cy) * k;
    }
  };

  /** Recompute the fit, then push positions to the DOM (transforms + edge coords). */
  const paint = () => {
    const sim = simRef.current;
    const container = containerRef.current;
    if (!sim || !container) return;
    recomputeFit();
    const W = container.clientWidth;
    const H = container.clientHeight;
    const fit = fitRef.current;
    const sx = (x: number) => W / 2 + (x - fit.cx) * fit.scale;
    const sy = (y: number) => H / 2 + (y - fit.cy) * fit.scale;

    for (let i = 0; i < sim.nodes.length; i++) {
      const el = nodeEls.current[i];
      if (el) {
        const nd = sim.nodes[i];
        el.style.transform = `translate(${sx(nd.x)}px, ${sy(nd.y)}px) translate(-50%, -50%)`;
      }
    }
    for (let ei = 0; ei < edgeEnds.length; ei++) {
      const line = edgeEls.current[ei];
      if (line) {
        const a = sim.nodes[edgeEnds[ei].a];
        const b = sim.nodes[edgeEnds[ei].b];
        line.setAttribute("x1", String(sx(a.x)));
        line.setAttribute("y1", String(sy(a.y)));
        line.setAttribute("x2", String(sx(b.x)));
        line.setAttribute("y2", String(sy(b.y)));
      }
    }
  };

  const tick = () => {
    const sim = simRef.current;
    if (!sim) return;
    stepSimulation(sim, DEFAULT_PARAMS, fitRef.current.scale);
    paint();
    const keepGoing = sim.alpha > DEFAULT_PARAMS.minAlpha * 1.05 || dragRef.current;
    if (keepGoing) {
      frameRef.current = requestAnimationFrame(tick);
    } else {
      runningRef.current = false;
    }
  };

  const ensureRunning = () => {
    if (runningRef.current) return;
    runningRef.current = true;
    frameRef.current = requestAnimationFrame(tick);
  };

  // Build the simulation once the container has a measured size, and keep it
  // sized to the viewport. Reduced-motion visitors get a static radial layout.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const sim = createSimState(data);
    simRef.current = sim;

    const inners = innerEls.current.filter(Boolean) as HTMLElement[];
    if (reducedMotion) {
      radialLayout(sim, data);
      paint();
      gsap.set(inners, { opacity: 1 });
      gsap.set(edgeEls.current.filter(Boolean), { opacity: 1 });
    } else {
      // Warm up so the graph opens already spread out, then animate. Recompute
      // the fit (DOM-free) each step so collision's screen-scale stays accurate.
      recomputeFit();
      for (let i = 0; i < 160; i++) {
        stepSimulation(sim, DEFAULT_PARAMS, fitRef.current.scale);
        recomputeFit();
      }
      sim.alpha = 0.32;
      paint();
      const lines = edgeEls.current.filter(Boolean) as SVGLineElement[];
      gsap.fromTo(
        inners,
        { opacity: 0, scale: 0.2 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.7,
          ease: "back.out(1.7)",
          stagger: { each: 0.012, from: "center" },
          // Drop the inline transform so CSS hover-scale can take over afterward.
          clearProps: "transform",
        },
      );
      gsap.fromTo(
        lines,
        { opacity: 0 },
        { opacity: 1, duration: 0.9, delay: 0.2, stagger: 0.004 },
      );
      ensureRunning();
    }

    const ro = new ResizeObserver(() => {
      const s = simRef.current;
      if (!s) return;
      // Re-fit to the new size. For reduced motion just repaint; otherwise let
      // the loop run a few frames so the fit eases to the new viewport.
      if (reducedMotion) {
        paint();
      } else {
        reheat(s, 0.15);
        ensureRunning();
      }
    });
    ro.observe(container);

    return () => {
      ro.disconnect();
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (focusTimer.current) clearTimeout(focusTimer.current);
      runningRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, reducedMotion]);

  // ---- Dragging -----------------------------------------------------------

  const pointFromEvent = (e: PointerEvent | React.PointerEvent) => {
    const rect = containerRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onNodePointerDown = (i: number) => (e: React.PointerEvent) => {
    if (reducedMotion) return;
    const sim = simRef.current;
    if (!sim) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const p = pointFromEvent(e);
    dragRef.current = { i, moved: false, sx: p.x, sy: p.y };
    sim.nodes[i].pinned = true;
    reheat(sim, 0.5);
    ensureRunning();
  };

  const onNodePointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    const sim = simRef.current;
    const container = containerRef.current;
    if (!drag || !sim || !container) return;
    const p = pointFromEvent(e);
    if (Math.hypot(p.x - drag.sx, p.y - drag.sy) > DRAG_THRESHOLD) {
      drag.moved = true;
    }
    // Convert the container-space pointer back into sim space via the fit.
    const fit = fitRef.current;
    const nd = sim.nodes[drag.i];
    nd.x = (p.x - container.clientWidth / 2) / fit.scale + fit.cx;
    nd.y = (p.y - container.clientHeight / 2) / fit.scale + fit.cy;
    nd.vx = 0;
    nd.vy = 0;
    reheat(sim, 0.5);
    ensureRunning();
  };

  const onNodePointerUp = (i: number) => (e: React.PointerEvent) => {
    const drag = dragRef.current;
    const sim = simRef.current;
    if (!drag || !sim) return;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    // Root stays pinned at centre; everything else rejoins the physics.
    if (i !== 0) sim.nodes[i].pinned = false;
    dragRef.current = null;
    reheat(sim, 0.3);
    ensureRunning();
  };

  /** Suppress navigation when the gesture was a drag rather than a tap. */
  const onNodeClick = (e: React.MouseEvent) => {
    if (dragRef.current?.moved) {
      e.preventDefault();
      return;
    }
    spark(e.clientX, e.clientY);
  };

  /** React Bits-style burst of sparks at a click point. */
  const spark = (clientX: number, clientY: number) => {
    const container = containerRef.current;
    if (!container || reducedMotion) return;
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const layer = container.querySelector<HTMLElement>("[data-spark-layer]");
    if (!layer) return;
    for (let k = 0; k < 8; k++) {
      const dot = document.createElement("span");
      dot.className = "absolute h-1 w-1 rounded-full bg-foreground";
      dot.style.left = `${x}px`;
      dot.style.top = `${y}px`;
      layer.appendChild(dot);
      const angle = (k / 8) * Math.PI * 2;
      gsap.to(dot, {
        x: Math.cos(angle) * 34,
        y: Math.sin(angle) * 34,
        opacity: 0,
        scale: 0.3,
        duration: 0.5,
        ease: "power2.out",
        onComplete: () => dot.remove(),
      });
    }
  };

  const highlightedEdges = useMemo(
    () => (hovered == null ? null : new Set(nodeEdges[hovered])),
    [hovered, nodeEdges],
  );

  return (
    <div ref={containerRef} className="relative h-full w-full touch-none">
      <svg className="absolute inset-0 h-full w-full" aria-hidden>
        {edgeEnds.map((edge, ei) => {
          const active = highlightedEdges?.has(ei) ?? false;
          const dim = highlightedEdges != null && !active;
          return (
            <line
              key={ei}
              ref={(el) => {
                edgeEls.current[ei] = el;
              }}
              stroke={active || edge.bridge ? edge.color : "currentColor"}
              className={
                active
                  ? "text-foreground"
                  : edge.bridge
                    ? ""
                    : "text-foreground/15"
              }
              strokeWidth={active ? 2 : edge.bridge ? 1.5 : 1}
              strokeOpacity={dim ? 0.25 : edge.bridge && !active ? 0.5 : 1}
              strokeDasharray={edge.bridge ? "4 4" : undefined}
              style={{ transition: "stroke-opacity 0.2s, stroke-width 0.2s" }}
            />
          );
        })}
      </svg>

      {data.nodes.map((node, i) => {
        const anyHover = hovered != null;
        const isSelf = hovered === i;
        const neighbor = anyHover && isNeighbor(hovered, i, edgeEnds);
        return (
          <NodeEl
            key={node.id}
            node={node}
            register={(el) => {
              nodeEls.current[i] = el;
            }}
            registerInner={(el) => {
              innerEls.current[i] = el;
            }}
            dimmed={anyHover && !isSelf && !neighbor}
            // undefined => use the node's default label policy; a boolean when
            // a hover is active forces the label on (self/neighbour) or off.
            showLabel={anyHover ? isSelf || neighbor : undefined}
            onPointerDown={onNodePointerDown(i)}
            onPointerMove={onNodePointerMove}
            onPointerUp={onNodePointerUp(i)}
            onClick={onNodeClick}
            onHoverStart={() => {
              setHovered(i);
              // Highlight immediately, but wait ~half a second before pushing
              // neighbours away so the selection locks in first.
              if (reducedMotion) return;
              if (focusTimer.current) clearTimeout(focusTimer.current);
              focusTimer.current = setTimeout(() => {
                const sim = simRef.current;
                if (sim) {
                  sim.focus = i;
                  // Pin the focused node so it holds under the cursor while its
                  // neighbours get pushed away (collision reacts on both nodes).
                  sim.nodes[i].pinned = true;
                  reheat(sim, 0.25);
                  ensureRunning();
                }
              }, 500);
            }}
            onHoverEnd={() => {
              setHovered((h) => (h === i ? null : h));
              if (focusTimer.current) clearTimeout(focusTimer.current);
              const sim = simRef.current;
              if (sim && sim.focus === i) {
                sim.focus = null;
                // Release the pin unless it's the root (root stays centred).
                if (i !== 0 && !dragRef.current) sim.nodes[i].pinned = false;
                reheat(sim, 0.2);
                ensureRunning();
              }
            }}
          />
        );
      })}

      <div
        data-spark-layer
        className="pointer-events-none absolute inset-0 z-40"
      />

      {/* Fixed detail panel for the hovered node — kept out of the graph so it
          never covers the highlighted cluster or runs off the screen edge. */}
      {hovered != null && data.nodes[hovered]?.blurb ? (
        <div className="pointer-events-none absolute left-1/2 top-24 z-30 w-[min(22rem,82vw)] -translate-x-1/2 rounded-xl border border-border bg-surface/95 px-4 py-3 text-center shadow-xl ring-1 ring-black/5 backdrop-blur">
          <p
            className="text-sm font-semibold"
            style={{ color: data.nodes[hovered].color }}
          >
            {data.nodes[hovered].label}
          </p>
          <p className="mt-1 text-xs leading-snug text-muted">
            {data.nodes[hovered].blurb}
          </p>
        </div>
      ) : null}
    </div>
  );
}

/** True when nodes a and b share an edge. */
function isNeighbor(
  a: number,
  b: number,
  edges: { a: number; b: number }[],
): boolean {
  return edges.some(
    (e) => (e.a === a && e.b === b) || (e.a === b && e.b === a),
  );
}

// ---------------------------------------------------------------------------

type NodeElProps = {
  node: GraphNode;
  register: (el: HTMLElement | null) => void;
  registerInner: (el: HTMLElement | null) => void;
  dimmed: boolean;
  /** undefined = default policy; boolean forces the label on/off during a hover. */
  showLabel: boolean | undefined;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onClick: (e: React.MouseEvent) => void;
  onHoverStart: () => void;
  onHoverEnd: () => void;
};

/** Sizing and label policy per node kind: bigger, always-labelled hubs; small thoughts labelled on hover. */
function styleFor(node: GraphNode) {
  const size = node.radius * 2;
  // Only the root and its direct neighbours (the Features hub + categories)
  // stay labelled at rest; features and write-ups reveal their label on hover.
  const alwaysLabel =
    node.kind === "root" || node.kind === "hub" || node.kind === "category";
  const labelClass =
    node.kind === "root"
      ? "text-base font-bold text-foreground"
      : node.kind === "hub" || node.kind === "category"
        ? "text-[13px] font-semibold text-foreground/90"
        : "text-[11px] font-medium text-foreground/80";
  return { size, alwaysLabel, labelClass };
}

function NodeEl({
  node,
  register,
  registerInner,
  dimmed,
  showLabel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onClick,
  onHoverStart,
  onHoverEnd,
}: NodeElProps) {
  const { size, alwaysLabel, labelClass } = styleFor(node);
  const glow = node.kind === "root" || node.kind === "hub" ? 30 : 18;
  const labelVisible = showLabel === undefined ? alwaysLabel : showLabel;

  // Inner element: GSAP owns its opacity/scale (intro), CSS owns hover scale.
  // The dot glow scales up on hover; the outer element owns the physics transform.
  const inner = (
    <span
      ref={registerInner as React.Ref<HTMLSpanElement>}
      className="relative flex items-center justify-center opacity-0 transition-transform duration-200 group-hover:scale-125"
      style={{ transformOrigin: "center" }}
    >
      {node.kind === "root" ? (
        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full motion-reduce:hidden"
          style={{
            width: size,
            height: size,
            background: `color-mix(in srgb, ${node.color} 40%, transparent)`,
          }}
        />
      ) : null}
      <span
        className="relative z-10 block rounded-full"
        style={{
          width: size,
          height: size,
          background: node.color,
          boxShadow: `0 0 0 1px color-mix(in srgb, ${node.color} 60%, transparent), 0 0 ${glow}px color-mix(in srgb, ${node.color} 55%, transparent)`,
        }}
      />
      <span
        className={[
          "pointer-events-none absolute left-1/2 top-full mt-1.5 -translate-x-1/2 whitespace-nowrap transition-opacity duration-150",
          labelClass,
          labelVisible ? "opacity-95" : "opacity-0",
        ].join(" ")}
      >
        {node.label}
      </span>
    </span>
  );

  const common = {
    className: [
      "group absolute left-0 top-0 z-20 flex cursor-grab touch-none select-none items-center justify-center p-2 transition-opacity hover:z-50 active:cursor-grabbing",
      dimmed ? "opacity-30" : "opacity-100",
    ].join(" "),
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerEnter: onHoverStart,
    onPointerLeave: onHoverEnd,
    onClick,
  };

  if (node.href && node.external) {
    return (
      <a
        {...common}
        ref={register}
        href={node.href}
        target="_blank"
        rel="noopener noreferrer"
      >
        {inner}
      </a>
    );
  }
  if (node.href) {
    return (
      <Link {...common} ref={register} href={node.href}>
        {inner}
      </Link>
    );
  }
  return (
    <div {...common} ref={register}>
      {inner}
    </div>
  );
}
