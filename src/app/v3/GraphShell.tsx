"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useReducedMotion } from "framer-motion";
import GraphBackground from "./graph/GraphBackground";
import NodeGraph from "./graph/NodeGraph";
import { openCommandPalette } from "@/lib/command-palette/open-event";
import { useShortcutKey } from "@/hooks/useShortcutKey";

// The flat view is only shown when the visitor toggles to it, so keep its code
// out of the initial bundle and load it on demand.
const FlatGraph = dynamic(() => import("./graph/FlatGraph"), { ssr: false });

type LayoutMode = "force" | "flat";

/** localStorage key for remembering the force/flat choice across visits. */
const MODE_STORAGE_KEY = "v3-graph-mode";

/** Full-bleed layer for one graph view; the inactive one is hidden but stays laid out. */
function layerClass(active: boolean): string {
  return active
    ? "absolute inset-0"
    : "absolute inset-0 invisible pointer-events-none";
}

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

/**
 * Header affordance that tells visitors the command palette exists and opens it.
 * The graph landing fills every corner with its own chrome, so the global
 * floating trigger is hidden here (see CommandPaletteRoot) and this stands in
 * its place. The shortcut hint is desktop-only, and platform-aware (⌘ on Apple,
 * Ctrl elsewhere); on touch the icon alone is the tap target. Opens the palette
 * through the shared window event.
 */
function SearchHint() {
  const shortcut = useShortcutKey();
  return (
    <button
      type="button"
      onClick={openCommandPalette}
      aria-label="Search pages, dev notes, and actions"
      aria-haspopup="dialog"
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/70 px-3 py-1.5 text-xs text-muted backdrop-blur transition-colors hover:text-foreground"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <span className="hidden sm:inline">Search</span>
      {shortcut ? (
        <kbd className="hidden font-sans text-[11px] tracking-wide text-foreground sm:inline">
          {shortcut}K
        </kbd>
      ) : null}
    </button>
  );
}

/** Warm accent shared with the résumé graph node so the two read as the same thing. */
const RESUME_ACCENT = "#fb923c";

/** Standout résumé call-to-action, shown in the header on both the landing and the hub. */
function ResumeLink() {
  return (
    <Link
      href="/resume"
      className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold backdrop-blur-sm transition-colors"
      style={{
        borderColor: `color-mix(in srgb, ${RESUME_ACCENT} 50%, transparent)`,
        backgroundColor: `color-mix(in srgb, ${RESUME_ACCENT} 15%, transparent)`,
        color: RESUME_ACCENT,
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M14 3v4a1 1 0 0 0 1 1h4M7 3h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm2 9h6m-6 4h6"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Résumé
    </Link>
  );
}

// Retired landing designs, newest first, for the footer picker. v3 is current
// (see CURRENT_VERSION in page.tsx) so it stays out of the list.
const OLDER_VERSIONS = ["v2", "v1"] as const;

type LegendItem = { swatch: string; label: string; glow?: string };

// Features (and the Apps hub) all share one blue. Categories and their write-ups
// are coloured by topic instead — each category gets its own hue and its
// write-ups inherit it — so the second pill is a multi-hue swatch built from the
// real category palette, not a single dot.
const LEGEND: LegendItem[] = [
  { swatch: "#38bdf8", label: "Feature", glow: "#38bdf8" },
  {
    swatch:
      "conic-gradient(from 130deg, #818cf8, #f472b6, #34d399, #a78bfa, #fbbf24, #fb7185, #22d3ee, #94a3b8, #818cf8)",
    label: "By topic",
  },
];

/** A pill for the graph legend, OriginUI-style. */
function LegendPill({ swatch, label, glow }: LegendItem) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/70 px-2.5 py-1 text-[11px] text-muted backdrop-blur">
      <span
        className="h-2 w-2 rounded-full"
        style={{ background: swatch, boxShadow: glow ? `0 0 8px ${glow}` : undefined }}
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
  // Once the flat view has been asked for we keep it mounted, so switching back
  // to it is instant and never re-loads its chunk or replays its intro.
  const [flatRequested, setFlatRequested] = useState(false);
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
      if (saved === "flat") setFlatRequested(true);
    } catch {
      // localStorage can throw (private mode, disabled) — just use the default.
    }
  }, []);

  const setMode = (next: LayoutMode) => {
    setModeState(next);
    if (next === "flat") setFlatRequested(true);
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
        {/* Both views stay mounted and we swap which one is visible. Toggling
            used to unmount one and mount the other, which replayed each view's
            intro animation on every switch (and, under dev Strict Mode's double
            mount, flashed it twice) — that was the flicker. Keeping them mounted
            with visibility means a switch is just a paint change. invisible
            (visibility:hidden), not hidden (display:none), so the backgrounded
            force graph keeps its measured size and its simulation stays valid. */}
        <div
          className={layerClass(mode === "force")}
          aria-hidden={mode !== "force"}
        >
          <NodeGraph reducedMotion={reduced} />
        </div>
        {flatRequested ? (
          <div
            className={layerClass(mode === "flat")}
            aria-hidden={mode !== "flat"}
          >
            <FlatGraph reducedMotion={reduced} />
          </div>
        ) : null}
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
          <SearchHint />
          <LayoutSwitch mode={mode} onChange={setMode} />
          <ResumeLink />
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

      {/* Flat-view interaction hint — hidden on phones where it would crowd the
          nav. On wide screens it sits on the same bottom row as the legend/nav;
          on narrower screens it lifts onto its own row so it can't overlap them.
          The force view's hint lives in NodeGraph instead, in the popover slot
          so it gives way the moment a node is hovered. */}
      {mode === "flat" ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-16 z-30 hidden justify-center sm:flex min-[1400px]:bottom-5"
        >
          <span className="rounded-full border border-border bg-surface/70 px-3 py-1 text-xs text-muted backdrop-blur">
            Scroll to explore · click a card to open it
          </span>
        </div>
      ) : null}

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
        {/* Peek at the older landing designs. A tiny <details> picker instead
            of a hard-coded v2 link, so it stays right as versions come and go. */}
        <details className="relative">
          <summary className="cursor-pointer list-none transition-colors hover:text-foreground [&::-webkit-details-marker]:hidden">
            Versions ↗
          </summary>
          <div className="absolute right-0 bottom-full mb-2 flex min-w-[7rem] flex-col rounded-lg border border-border bg-surface/90 p-1 text-right backdrop-blur">
            {OLDER_VERSIONS.map((v) => (
              <Link
                key={v}
                href={`/?version=${v}`}
                className="rounded px-2 py-1 whitespace-nowrap transition-colors hover:bg-foreground/5 hover:text-foreground"
              >
                {v} ↗
              </Link>
            ))}
          </div>
        </details>
      </nav>
    </div>
  );
}
