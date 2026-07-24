"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useReducedMotion } from "framer-motion";
import GraphBackground from "./graph/GraphBackground";
import NodeGraph from "./graph/NodeGraph";

// The flat view is only shown when the visitor toggles to it, so keep its code
// out of the initial bundle and load it on demand.
const FlatGraph = dynamic(() => import("./graph/FlatGraph"), { ssr: false });

type LayoutMode = "force" | "flat";

/** localStorage key for remembering the force/flat choice across visits. */
const MODE_STORAGE_KEY = "v3-graph-mode";

/** Segmented switch that flips between the force graph and the flat layered view. */
function LayoutSwitch({
  mode,
  onChange,
}: {
  mode: LayoutMode;
  onChange: (m: LayoutMode) => void;
}) {
  const seg = (active: boolean) =>
    [
      "rounded-full px-3 py-1 text-xs font-medium transition-colors",
      active
        ? "bg-foreground text-background"
        : "text-muted hover:text-foreground",
    ].join(" ");
  return (
    <div className="inline-flex items-center rounded-full border border-border bg-surface/70 p-0.5 backdrop-blur">
      <button
        type="button"
        aria-pressed={mode === "force"}
        onClick={() => onChange("force")}
        className={seg(mode === "force")}
      >
        Graph
      </button>
      <button
        type="button"
        aria-pressed={mode === "flat"}
        onClick={() => onChange("flat")}
        className={seg(mode === "flat")}
      >
        Flat
      </button>
    </div>
  );
}

type LegendItem = { color: string; label: string };

const LEGEND: LegendItem[] = [
  { color: "#38bdf8", label: "Feature" },
  { color: "#a78bfa", label: "Category" },
  { color: "#f472b6", label: "Write-up" },
];

/** A pill for the node-type legend, OriginUI-style. */
function LegendPill({ color, label }: LegendItem) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/70 px-2.5 py-1 text-[11px] text-muted backdrop-blur">
      <span
        className="h-2 w-2 rounded-full"
        style={{ background: color, boxShadow: `0 0 8px ${color}` }}
      />
      {label}
    </span>
  );
}

/**
 * Full-screen frame for the v3 node-graph landing. Renders the animated
 * backdrop and the interactive graph, with a floating header, a legend, and
 * navigation overlaid on top. Callers supply the greeting line and the
 * top-right action (log in, or the signed-in controls).
 */
export default function GraphShell({
  greeting,
  action,
}: {
  greeting: ReactNode;
  action: ReactNode;
}) {
  const reduced = useReducedMotion() ?? false;
  const [mode, setModeState] = useState<LayoutMode>("force");
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Remember the last-used view across visits. Read in an effect (not lazy
  // init) so the server-rendered markup and first client render agree, then
  // switch if a preference was stored.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(MODE_STORAGE_KEY);
      // One-time read of a persisted UI preference on mount; a lazy initializer
      // would mismatch the server-rendered default and warn on hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved === "flat" || saved === "force") setModeState(saved);
    } catch {
      // localStorage can throw (private mode, disabled) — just use the default.
    }
  }, []);

  const setMode = (next: LayoutMode) => {
    setModeState(next);
    try {
      localStorage.setItem(MODE_STORAGE_KEY, next);
    } catch {
      // ignore write failures; the choice just won't persist
    }
  };
  const headerRef = useRef<HTMLElement | null>(null);

  // Publish the header's live height as a CSS var so the graph overlays (the
  // hover popover, the zoom hint, the flat list's top padding) can sit clear of
  // it. The header wraps to two rows when zoomed in or on a narrow window, so a
  // fixed offset would either waste space or slide under the controls.
  useEffect(() => {
    const header = headerRef.current;
    const root = rootRef.current;
    if (!header || !root) return;
    const sync = () =>
      root.style.setProperty("--v3-header-h", `${header.offsetHeight}px`);
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(header);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={rootRef}
      className="relative h-dvh w-full overflow-hidden bg-background text-foreground"
    >
      <GraphBackground />

      <main
        aria-label="Graph of features and write-ups, and how they connect"
        className="absolute inset-0"
      >
        {mode === "force" ? (
          <NodeGraph reducedMotion={reduced} />
        ) : (
          <FlatGraph reducedMotion={reduced} />
        )}
      </main>

      {/* Header — glassy in flat view so scrolling cards don't show through it */}
      <header
        ref={headerRef}
        className={[
          "pointer-events-none absolute inset-x-0 top-0 z-40 flex flex-wrap items-start justify-between gap-x-3 gap-y-2 p-4 sm:p-6",
          mode === "flat"
            ? "border-b border-border bg-background/80 backdrop-blur-md"
            : // Force view: a soft top-down fade so nodes drifting up behind the
              // pills read as tucked under the chrome, not colliding with it.
              "bg-gradient-to-b from-background via-background/85 to-transparent pb-8",
        ].join(" ")}
      >
        <div className="pointer-events-auto min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold tracking-tight text-foreground sm:text-lg">
              paul-explore
            </h1>
            <span className="rounded-full border border-border bg-surface/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted backdrop-blur">
              v3
            </span>
          </div>
          {/* Subtitle is noise on a phone where space is tight. */}
          <p className="mt-1 hidden max-w-xs text-sm text-muted sm:block">
            {greeting}
          </p>
        </div>
        <div className="pointer-events-auto flex shrink-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
          <LayoutSwitch mode={mode} onChange={setMode} />
          {action}
        </div>
      </header>

      {/* Glassy footer bar in flat view, behind the legend / hint / nav */}
      {mode === "flat" ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-14 border-t border-border bg-background/80 backdrop-blur-md"
        />
      ) : null}

      {/* Legend — a visual key; nodes carry their own text labels, so it's
          supplementary and hidden from assistive tech. */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-5 left-5 z-40 hidden flex-wrap gap-2 sm:flex"
      >
        {LEGEND.map((item) => (
          <LegendPill key={item.label} {...item} />
        ))}
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/70 px-2.5 py-1 text-[11px] text-muted backdrop-blur">
          <svg width="16" height="6" aria-hidden>
            <line
              x1="0"
              y1="3"
              x2="16"
              y2="3"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
          </svg>
          feature ↔ its notes
        </span>
      </div>

      {/* Interaction hint — hidden on phones where it would crowd the nav.
          On wide screens it sits on the same bottom row as the legend/nav; on
          narrower screens it lifts onto its own row so it can't overlap them. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-16 z-30 hidden justify-center sm:flex min-[1400px]:bottom-5"
      >
        <span className="rounded-full border border-border bg-surface/70 px-3 py-1 text-xs text-muted backdrop-blur">
          {mode === "force"
            ? "Drag the nodes · click one to open it"
            : "Scroll to explore · click a card to open it"}
        </span>
      </div>

      {/* Corner nav */}
      <nav
        aria-label="Site"
        className="pointer-events-auto absolute bottom-5 right-5 z-40 flex items-center gap-3 text-xs text-muted"
      >
        <Link href="/thoughts" className="transition-colors hover:text-foreground">
          Thoughts
        </Link>
        <a
          href="https://github.com/gpbsumido"
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-foreground"
        >
          GitHub
        </a>
        <Link
          href="/?version=v2"
          className="transition-colors hover:text-foreground"
        >
          v2 ↗
        </Link>
      </nav>
    </div>
  );
}
