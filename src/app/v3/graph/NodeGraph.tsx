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
  type KeepOut,
  type Bounds,
} from "./simulation";

/** Movement (px) past which a pointer gesture counts as a drag, not a click. */
const DRAG_THRESHOLD = 5;

/**
 * How long the highlight/focus lingers after the pointer leaves a node, so you
 * can move onto one of its (now spread-out) children without the graph
 * rearranging out from under you. Cancelled the moment you hover another node.
 */
const HOVER_GRACE_MS = 2500;

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
  // The hover popover's DOM node, and whether it's currently up: while it is,
  // the sim keeps running and pushes nodes out from under it.
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const popoverActiveRef = useRef(false);
  // Smoothed viewport fit: maps origin-centred sim space onto the screen so the
  // graph always fills the room available. cx/cy is the sim-space centre.
  const fitRef = useRef({ scale: 1, cx: 0, cy: 0, init: false });
  // Chrome the graph must stay clear of: the header band at the top (its height
  // is live — it wraps to two rows when zoomed) and the legend/hint/nav band at
  // the bottom. The fit maps into the space between them so nodes never tuck
  // under the header or the bottom controls.
  const insetTopRef = useRef(80);
  const INSET_BOTTOM = 64;

  // Drag bookkeeping (sx/sy are the pointer-down position in container px).
  const dragRef = useRef<{ i: number; moved: boolean; sx: number; sy: number } | null>(
    null,
  );
  // Delay before a hover starts pushing neighbours, so the highlight locks first.
  const focusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Grace timer that delays releasing the focus after the pointer leaves, and a
  // ref mirror of the hovered index so that delayed release can tell whether
  // another node has since taken over.
  const hoverEndTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoveredRef = useRef<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  // True when the viewport is too small (e.g. zoomed in) for the graph to keep
  // the popover fully clear of nodes; we surface a "zoom out" hint instead.
  const [cramped, setCramped] = useState(false);

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

  // Neighbour node indices per node, and the indices always showing a label.
  const neighborIdx = useMemo(() => {
    const arr: number[][] = data.nodes.map(() => []);
    edgeEnds.forEach((e) => {
      arr[e.a].push(e.b);
      arr[e.b].push(e.a);
    });
    return arr;
  }, [data, edgeEnds]);

  const alwaysLabeledIdx = useMemo(
    () =>
      data.nodes
        .map((_, i) => i)
        .filter((i) =>
          ["root", "hub", "category"].includes(data.nodes[i].kind),
        ),
    [data],
  );

  /** Nodes whose labels are showing: the always-labelled set plus a focus + its neighbours. */
  const labeledSet = (focusIndex: number | null): Set<number> =>
    focusIndex == null
      ? new Set(alwaysLabeledIdx)
      : new Set([focusIndex, ...neighborIdx[focusIndex], ...alwaysLabeledIdx]);

  /**
   * Ease the fit (scale + sim-space centre) toward one that frames the whole
   * layout inside the container with padding. Cheap and DOM-free, so warmup can
   * call it every iteration to keep collision's screen-scale accurate.
   */
  const recomputeFit = () => {
    const sim = simRef.current;
    const container = containerRef.current;
    if (!sim || !container) return;
    // Freeze the fit while dragging, focusing, or showing the popover so the
    // coordinate mapping stays stable — otherwise neighbours spreading out (or
    // nodes moving out of the popover) grows the bbox, rescales the graph, and
    // slides the hovered/dragged node out from under the cursor.
    if (dragRef.current || sim.focus != null || popoverActiveRef.current) return;
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
    // Fit into the band between the header and the bottom chrome, not the whole
    // container, so the graph is never scaled to a size that tucks under them.
    const availH = Math.max(H - insetTopRef.current - INSET_BOTTOM, 1);
    const pad = W < 640 ? 60 : 110;
    const target = Math.min(
      (W - pad * 2) / bboxW,
      (availH - pad * 2) / bboxH,
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
    // Vertical centre of the header-to-bottom-chrome band (shifted down from the
    // container centre by the header, up by the bottom chrome).
    const vCenter = (H + insetTopRef.current - INSET_BOTTOM) / 2;
    const sx = (x: number) => W / 2 + (x - fit.cx) * fit.scale;
    const sy = (y: number) => vCenter + (y - fit.cy) * fit.scale;

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

  /**
   * The popover's rectangle in sim space (or null), so the sim can push nodes
   * out from under it. Read straight from the DOM each frame and inverse-mapped
   * through the current fit; the fit is frozen while the popover is up, so the
   * region stays put.
   */
  const computeKeepOut = (): KeepOut | null => {
    if (!popoverActiveRef.current) return null;
    const el = popoverRef.current;
    const container = containerRef.current;
    if (!el || !container) return null;
    const cr = container.getBoundingClientRect();
    const pr = el.getBoundingClientRect();
    const fit = fitRef.current;
    // Generous clearance so node bodies (not just centres) stay clear of the panel.
    const pad = 48;
    const vCenter = (cr.height + insetTopRef.current - INSET_BOTTOM) / 2;
    const invX = (px: number) => (px - cr.width / 2) / fit.scale + fit.cx;
    const invY = (py: number) => (py - vCenter) / fit.scale + fit.cy;
    return {
      xMin: invX(pr.left - cr.left - pad),
      xMax: invX(pr.right - cr.left + pad),
      yBottom: invY(pr.bottom - cr.top + pad),
      strength: 0.35,
    };
  };

  /**
   * The visible area in sim space, but only while the fit is frozen (a hover is
   * active) — otherwise the auto-fit already keeps everything on screen. Keeps a
   * focused node's spreading neighbours from sliding past the viewport edge.
   */
  const computeBounds = (): Bounds | null => {
    const sim = simRef.current;
    const container = containerRef.current;
    if (!sim || !container) return null;
    if (sim.focus == null && !popoverActiveRef.current) return null;
    const fit = fitRef.current;
    const W = container.clientWidth;
    const H = container.clientHeight;
    const margin = 76; // room for a node plus its label
    const insetTop = insetTopRef.current;
    const vCenter = (H + insetTop - INSET_BOTTOM) / 2;
    const invX = (px: number) => (px - W / 2) / fit.scale + fit.cx;
    const invY = (py: number) => (py - vCenter) / fit.scale + fit.cy;
    // Keep the focused cluster and its labels clear of the header band at the
    // top and the legend/hint/nav band at the bottom.
    return {
      xMin: invX(margin),
      xMax: invX(W - margin),
      yMin: invY(insetTop + 8),
      yMax: invY(H - INSET_BOTTOM - 8),
      strength: 0.12,
    };
  };

  const tick = () => {
    const sim = simRef.current;
    if (!sim) return;
    stepSimulation(
      sim,
      DEFAULT_PARAMS,
      fitRef.current.scale,
      computeKeepOut(),
      computeBounds(),
    );
    paint();
    const keepGoing =
      sim.alpha > DEFAULT_PARAMS.minAlpha * 1.05 ||
      dragRef.current ||
      popoverActiveRef.current;
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

    // Capture the ref arrays so cleanup uses a stable variable, not ref.current.
    const innerArr = innerEls.current;
    const edgeArr = edgeEls.current;

    const inners = innerArr.filter(Boolean) as HTMLElement[];
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

    // Absolute browser-zoom estimate that doesn't depend on the value at load:
    // page zoom shrinks the CSS viewport (innerWidth) while the window frame
    // (outerWidth) stays, so their ratio ~= the zoom factor. Zoomed in past
    // ~1.2x (or a genuinely tiny viewport) is too cramped to keep the popover
    // clear, so we surface the zoom-out hint.
    const syncCramped = () => {
      // Track the live header height (it wraps taller when zoomed) so the fit
      // keeps the graph clear of it. Falls back to a sensible default pre-paint.
      const headerPx = parseFloat(
        getComputedStyle(container).getPropertyValue("--v3-header-h"),
      );
      insetTopRef.current = (Number.isFinite(headerPx) ? headerPx : 64) + 16;
      const zoom =
        window.innerWidth > 0 ? window.outerWidth / window.innerWidth : 1;
      setCramped(
        zoom >= 1.2 ||
          container.clientWidth < 700 ||
          container.clientHeight < 520,
      );
    };
    syncCramped();
    // The header-height var is published by the parent's effect, which commits
    // after this child effect on first mount. Re-read it next frame so the fit
    // reserves the real header band even on a fresh narrow load (the vertical
    // centre is applied immediately on the next paint, so nodes shift clear).
    const resync = requestAnimationFrame(() => {
      syncCramped();
      if (reducedMotion) paint();
      else ensureRunning();
    });
    // Browser zoom fires a window resize; the ResizeObserver below only sees
    // container size changes, so listen here too to catch zoom on large windows.
    window.addEventListener("resize", syncCramped);

    const ro = new ResizeObserver(() => {
      const s = simRef.current;
      if (!s) return;
      syncCramped();
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
      window.removeEventListener("resize", syncCramped);
      cancelAnimationFrame(resync);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (focusTimer.current) clearTimeout(focusTimer.current);
      if (hoverEndTimer.current) clearTimeout(hoverEndTimer.current);
      gsap.killTweensOf(innerArr.filter(Boolean));
      gsap.killTweensOf(edgeArr.filter(Boolean));
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
    if (focusTimer.current) clearTimeout(focusTimer.current);
    if (hoverEndTimer.current) {
      clearTimeout(hoverEndTimer.current);
      hoverEndTimer.current = null;
    }
    hoveredRef.current = i;
    sim.nodes[i].pinned = true;
    // Give the dragged node extra clearance so it shoulders other nodes out of
    // the way as it moves through the graph.
    sim.focus = i;
    sim.labeled = labeledSet(i);
    reheat(sim, 0.6);
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
    const vCenter =
      (container.clientHeight + insetTopRef.current - INSET_BOTTOM) / 2;
    nd.x = (p.x - container.clientWidth / 2) / fit.scale + fit.cx;
    nd.y = (p.y - vCenter) / fit.scale + fit.cy;
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
    if (sim.focus === i) {
      sim.focus = null;
      sim.labeled = labeledSet(null);
    }
    dragRef.current = null;
    reheat(sim, 0.4);
    ensureRunning();
  };

  /** Suppress navigation when the gesture was a drag rather than a tap. */
  const onNodeClick = (e: React.MouseEvent) => {
    if (dragRef.current?.moved) {
      e.preventDefault();
      return;
    }
    // e.detail === 0 means the click came from the keyboard (Enter), where
    // clientX/Y are 0 — skip the spark so it doesn't fire in the corner.
    if (e.detail !== 0) spark(e.clientX, e.clientY);
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

  const hoveredNeighbors = useMemo(
    () => (hovered == null ? null : new Set(neighborIdx[hovered])),
    [hovered, neighborIdx],
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
        // O(1) neighbour test via the precomputed set, not an O(edges) scan per node.
        const neighbor = hoveredNeighbors?.has(i) ?? false;
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
              // Hovering a new node cancels any pending grace release from the
              // node we just left, so the highlight moves cleanly between nodes.
              if (hoverEndTimer.current) {
                clearTimeout(hoverEndTimer.current);
                hoverEndTimer.current = null;
              }
              hoveredRef.current = i;
              setHovered(i);
              // Highlight immediately, but wait ~half a second before pushing
              // neighbours away so the selection locks in first.
              if (reducedMotion) return;
              // The popover shows right away, so start clearing space under it
              // now (independent of the delayed neighbour-focus below).
              if (data.nodes[i].blurb) {
                popoverActiveRef.current = true;
                ensureRunning();
              }
              if (focusTimer.current) clearTimeout(focusTimer.current);
              focusTimer.current = setTimeout(() => {
                const sim = simRef.current;
                if (!sim) return;
                // Release the previously focused node (a grace period may have
                // left it pinned) before pinning the new one.
                const prev = sim.focus;
                if (prev != null && prev !== i && prev !== 0 && !dragRef.current) {
                  sim.nodes[prev].pinned = false;
                }
                sim.focus = i;
                // Pin the focused node so it holds under the cursor while its
                // neighbours get pushed away (collision reacts on both nodes).
                sim.nodes[i].pinned = true;
                sim.labeled = labeledSet(i);
                reheat(sim, 0.25);
                ensureRunning();
              }, 500);
            }}
            onHoverEnd={() => {
              if (reducedMotion) {
                hoveredRef.current = null;
                setHovered((h) => (h === i ? null : h));
                return;
              }
              // Don't release immediately. Wait out the grace period so you can
              // travel to a child; if you land on another node first, its
              // onHoverStart cancels this timer.
              if (hoverEndTimer.current) clearTimeout(hoverEndTimer.current);
              hoverEndTimer.current = setTimeout(() => {
                hoverEndTimer.current = null;
                // Bail if another node became the hover in the meantime.
                if (hoveredRef.current !== i) return;
                hoveredRef.current = null;
                setHovered((h) => (h === i ? null : h));
                if (focusTimer.current) clearTimeout(focusTimer.current);
                const sim = simRef.current;
                if (popoverActiveRef.current) {
                  popoverActiveRef.current = false;
                  if (sim) reheat(sim, 0.15);
                }
                if (sim && sim.focus === i) {
                  sim.focus = null;
                  sim.labeled = labeledSet(null);
                  // Release the pin unless it's the root (root stays centred).
                  if (i !== 0 && !dragRef.current) sim.nodes[i].pinned = false;
                  reheat(sim, 0.2);
                }
                ensureRunning();
              }, HOVER_GRACE_MS);
            }}
          />
        );
      })}

      <div
        data-spark-layer
        aria-hidden
        className="pointer-events-none absolute inset-0 z-40"
      />

      {/* Zoom-out hint: at small/zoomed viewports the graph is too cramped to
          keep the popover clear of nodes, so nudge the visitor to zoom out.
          Only when nothing is hovered — while hovering, the same warning is
          folded into the popover below so it never gets hidden behind it.
          Sits below the header (its height varies as it wraps when zoomed). */}
      {cramped && hovered == null ? (
        <div
          aria-hidden
          style={{ top: "calc(var(--v3-header-h, 4rem) + 0.5rem)" }}
          className="pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-500/90 backdrop-blur"
        >
          Zoom out for the full graph
        </div>
      ) : null}

      {/* Fixed detail panel for the hovered node — pinned just below the header
          so it sits above the node cluster instead of covering the categories
          that fan upward, and clears the header even when it wraps on zoom. */}
      {hovered != null && data.nodes[hovered]?.blurb ? (
        <div
          ref={popoverRef}
          aria-hidden
          style={{ top: "calc(var(--v3-header-h, 4rem) + 0.5rem)" }}
          className="pointer-events-none absolute left-1/2 z-50 w-[min(22rem,72vw)] -translate-x-1/2 rounded-xl border border-border bg-surface/95 px-4 py-2.5 text-center shadow-xl ring-1 ring-black/5 backdrop-blur"
        >
          <p
            className="text-sm font-semibold"
            style={{ color: data.nodes[hovered].color }}
          >
            {data.nodes[hovered].label}
          </p>
          <p className="mt-1 text-xs leading-snug text-muted">
            {data.nodes[hovered].blurb}
          </p>
          {/* When cramped, the standalone hint is suppressed (it would sit under
              this panel), so surface it here instead. */}
          {cramped ? (
            <p className="mt-2 border-t border-amber-500/20 pt-1.5 text-[11px] font-medium text-amber-500/90">
              Zoom out for the full graph
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
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
          "pointer-events-none absolute left-1/2 top-full mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-background/70 px-1.5 py-0.5 ring-1 ring-border/60 backdrop-blur-sm transition-opacity duration-150",
          labelClass,
          labelVisible ? "opacity-95" : "opacity-0",
        ].join(" ")}
      >
        {node.label}
      </span>
    </span>
  );

  const common = {
    // Disable native link drag-and-drop, which would otherwise hijack the
    // pointer gesture and stop the node from following the cursor.
    draggable: false,
    onDragStart: (e: React.DragEvent) => e.preventDefault(),
    className: [
      "group absolute left-0 top-0 z-20 flex cursor-grab touch-none select-none items-center justify-center rounded-full p-2 outline-none transition-opacity hover:z-50 focus-visible:z-50 focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background active:cursor-grabbing",
      dimmed ? "opacity-30" : "opacity-100",
    ].join(" "),
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel: onPointerUp,
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
