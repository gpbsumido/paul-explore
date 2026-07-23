"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import GraphBackground from "./graph/GraphBackground";
import NodeGraph from "./graph/NodeGraph";
import FlatGraph from "./graph/FlatGraph";

type LayoutMode = "force" | "flat";

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
  const [mode, setMode] = useState<LayoutMode>("force");

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-background text-foreground">
      <GraphBackground />

      <div className="absolute inset-0">
        {mode === "force" ? (
          <NodeGraph reducedMotion={reduced} />
        ) : (
          <FlatGraph reducedMotion={reduced} />
        )}
      </div>

      {/* Header */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex items-start justify-between gap-4 p-5 sm:p-6">
        <div className="pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight text-foreground">
              paul-explore
            </span>
            <span className="rounded-full border border-border bg-surface/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted backdrop-blur">
              v3
            </span>
          </div>
          <p className="mt-1 max-w-[16rem] text-sm text-muted sm:max-w-xs">
            {greeting}
          </p>
        </div>
        <div className="pointer-events-auto flex items-center gap-3">
          <LayoutSwitch mode={mode} onChange={setMode} />
          {action}
        </div>
      </div>

      {/* Legend */}
      <div className="pointer-events-none absolute bottom-5 left-5 z-40 hidden flex-wrap gap-2 sm:flex">
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

      {/* Interaction hint */}
      <div className="pointer-events-none absolute inset-x-0 bottom-5 z-30 flex justify-center">
        <span className="rounded-full border border-border bg-surface/70 px-3 py-1 text-xs text-muted backdrop-blur">
          {mode === "force"
            ? "Drag the nodes · click one to open it"
            : "Scroll to explore · click a card to open it"}
        </span>
      </div>

      {/* Corner nav */}
      <div className="pointer-events-auto absolute bottom-5 right-5 z-40 flex items-center gap-3 text-xs text-muted">
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
      </div>
    </div>
  );
}
