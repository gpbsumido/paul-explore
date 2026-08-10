"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fraunces } from "next/font/google";
import { m, useReducedMotion } from "framer-motion";
import GraphBackground from "@/app/v3/graph/GraphBackground";
import { openCommandPalette } from "@/lib/command-palette/open-event";
import { useShortcutKey } from "@/hooks/useShortcutKey";
import {
  buildSlots,
  shortestDelta,
  wrapIndex,
  type SlotThought,
} from "./slotData";

// A characterful serif for the landed rows and nothing else. The chrome and
// body stay in Geist so the serif reads as the machine's voice, not a theme.
import { isWinningPull } from "./win";
import WinCelebration, { WIN_MS, type FallStyle } from "./WinCelebration";
import ChalkBackdrop from "./ChalkBackdrop";
import {
  playWinSound,
  soundEnabled,
  setSoundEnabled,
  unlockWinAudio,
} from "./winSound";

const fraunces = Fraunces({ subsets: ["latin"], display: "swap" });

/** Height of one reel row in px; the track math and the edge fade share it. */
const ROW_H = 60;
/** Visible rows per reel; odd so the landed row sits dead centre. */
const VISIBLE_ROWS = 5;
const WINDOW_H = ROW_H * VISIBLE_ROWS;
/** The magnifier "glass bar" over the centre row, a touch taller than a row. */
const LENS_H = 66;
/** Top of the centred lens, shared by the lens itself and the arrow annotation. */
const LENS_TOP = WINDOW_H / 2 - LENS_H / 2;

/** Reels fade out toward their edges instead of sitting in a frame. */
const EDGE_FADE =
  "linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%)";

/** Warm accent shared with the résumé slot category so the two read as one thing. */
const RESUME_ACCENT = "#fb923c";

// Retired landing designs, newest first, for the footer picker. v4 is current
// (see CURRENT_VERSION in page.tsx) so it stays out of the list.
const OLDER_VERSIONS = ["v3", "v2", "v1"] as const;

/** Standout résumé call-to-action, same treatment as the v3 header chrome. */
function ResumeLink() {
  return (
    <Link
      href="/resume"
      className="inline-flex h-9 items-center gap-1.5 rounded-full border px-4 text-sm font-medium backdrop-blur-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/60"
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

/**
 * Header affordance for the command palette. The global floating trigger is
 * hidden at "/" (see CommandPaletteRoot) because the machine fills every corner,
 * so this stands in for it. Opens through the shared window event; the shortcut
 * hint is desktop-only and platform-aware.
 */
function SearchHint() {
  const shortcut = useShortcutKey();
  return (
    <button
      type="button"
      onClick={openCommandPalette}
      aria-label="Search pages, dev notes, and actions"
      aria-haspopup="dialog"
      className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-surface/70 px-3 text-sm text-muted backdrop-blur-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/60"
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

/** Amber tag for write-ups whose feature no longer exists in the app. */
function DeprecatedPill() {
  return (
    <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-1.5 py-px text-[9px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
      deprecated
    </span>
  );
}

type ReelItem = {
  id: string;
  label: string;
  color: string;
  deprecated?: boolean;
  /** A greyed-out placeholder (a category with write-ups but no app to open). */
  disabled?: boolean;
};

/**
 * A reel's position on its endless strip, in row units. It only needs to be
 * congruent to the selected index (mod length), so it can grow without bound
 * during a spin, which is what keeps the motion continuous and directional:
 * the strip never jumps back when the index wraps around.
 */
type ReelPos = { pos: number };

const still = (index: number): ReelPos => ({ pos: index });
const glideTo = (next: number) => (): ReelPos => ({ pos: next });

/** DOM ids need to be attribute-safe, so squash anything odd in the item id. */
const rowDomId = (reelKey: string, itemId: string): string =>
  `v4-${reelKey}-${itemId.replace(/[^a-zA-Z0-9_-]+/g, "-")}`;

/**
 * Three hand-drawn arrow shapes, one per column, so the marks read as sketched
 * by hand rather than stamped from a template: a lazy S, a leftward hook, and a
 * double wiggle. Each pairs the curve with an arrowhead sitting at its foot.
 */
const ARROW_VARIANTS: { line: string; head: string }[] = [
  { line: "M23 1 C 31 16, 15 33, 23 52", head: "M16 44 L23 54 L30 44" },
  { line: "M31 1 C 33 19, 13 30, 21 52", head: "M14 44 L22 54 L28 43" },
  {
    line: "M20 1 C 31 12, 13 25, 26 36 C 33 42, 19 47, 23 53",
    head: "M16 45 L23 55 L30 45",
  },
];

/**
 * The label that points at whatever a reel landed on. It sits in the reel's own
 * top space (the old header is gone) and, once the column settles, the arrow
 * draws itself down toward the magnifier while the label fades in beside it, so
 * the machine names each result the moment it lands rather than up front. Each
 * reel gets its own arrow shape so the three don't look stamped from one mould.
 * Keyed on the landed item by the caller so it redraws on every new selection.
 * Reduced-motion visitors get the finished mark with no drawing.
 */
function ReelAnnotation({
  label,
  accent,
  reduced,
  variant,
}: {
  label: string;
  accent: string;
  reduced: boolean;
  /** Picks one of the hand-drawn arrow shapes, so each column differs. */
  variant: number;
}) {
  const arrow = ARROW_VARIANTS[variant % ARROW_VARIANTS.length];
  const draw = reduced
    ? { initial: false as const, animate: { pathLength: 1, opacity: 1 } }
    : {
        initial: { pathLength: 0, opacity: 0 },
        animate: { pathLength: 1, opacity: 1 },
      };
  return (
    <div
      data-testid="reel-annotation"
      aria-hidden
      className="pointer-events-none absolute inset-x-0 z-20 flex flex-col items-center"
      style={{ top: 6, height: LENS_TOP - 6 }}
    >
      <m.span
        initial={reduced ? false : { opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reduced ? 0 : 0.3, duration: 0.35 }}
        className="rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] backdrop-blur-sm"
        style={{
          color: accent,
          borderColor: `color-mix(in srgb, ${accent} 35%, transparent)`,
          backgroundColor: `color-mix(in srgb, ${accent} 10%, transparent)`,
        }}
      >
        {label}
      </m.span>
      <svg
        className="-mt-px flex-1 overflow-visible"
        width="46"
        viewBox="0 0 46 60"
        fill="none"
        preserveAspectRatio="xMidYMin meet"
        aria-hidden
      >
        <m.path
          d={arrow.line}
          stroke={accent}
          strokeWidth={2}
          strokeLinecap="round"
          transition={{ duration: reduced ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }}
          {...draw}
        />
        <m.path
          d={arrow.head}
          stroke={accent}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={reduced ? false : { pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            duration: reduced ? 0 : 0.25,
            delay: reduced ? 0 : 0.45,
          }}
        />
      </svg>
    </div>
  );
}

/**
 * One wheel of the machine: an endless, edge-faded strip of type with the
 * landed row magnified under a glass "lens" (the selected item reads large and
 * sharp, the rest fade back), and, once it settles, a drawn-in arrow naming the
 * result. Semantically it is a plain listbox with a visually hidden option per
 * item for assistive tech; the moving strip itself is decoration. Up/Down step
 * one visual row (wrapping continuously), Left/Right jump focus to the adjacent
 * reel, Home/End take the shortest path, Enter activates. While a column is
 * mid-spin the strip smears with a motion blur, like a real reel picking up
 * speed. A disabled reel is inert and greyed, but its rows still stack so the
 * layout holds.
 */
function Reel({
  label,
  reelKey,
  reelIndex,
  items,
  posState,
  spinning,
  blurring,
  reduced,
  accent,
  disabled = false,
  onPosChange,
  onActivate,
  onFocusSibling,
  registerRef,
  empty,
  spinFiller,
}: {
  label: string;
  reelKey: string;
  /** This reel's slot in the row, so Left/Right can find its neighbours. */
  reelIndex: number;
  items: ReelItem[];
  posState: ReelPos;
  spinning: boolean;
  /** True only while this specific column is still turning, for the speed blur. */
  blurring: boolean;
  reduced: boolean;
  /** Landed accent, used for the dot glow, the lens tint, and the arrow. */
  accent: string;
  /** Greys the reel out and turns off interaction (write-up-only categories). */
  disabled?: boolean;
  /** Labels for the blurred filler strip a short reel scrolls while it spins,
      so a one-item or empty column still turns instead of sitting static. */
  spinFiller: string[];
  onPosChange: (next: number) => void;
  /** Omitted for reels that only select (reel 1). */
  onActivate?: (index: number) => void;
  /** Moves keyboard focus to the reel dir steps away, skipping inert ones. */
  onFocusSibling: (from: number, dir: 1 | -1) => void;
  /** Hands the listbox element back so the parent can focus it laterally. */
  registerRef: (el: HTMLDivElement | null) => void;
  /** Shown inside the window when there are no items. */
  empty?: ReactNode;
}) {
  const { pos } = posState;
  const len = items.length;
  const selected = wrapIndex(Math.round(pos), len);
  const activeItem = items[selected];
  const inert = disabled || spinning;

  // A reel with one item (a "Write-up only" placeholder) or none (an app with
  // no write-up yet) has nothing to cycle, so it would sit dead still while the
  // other columns spin. To keep the pull consistent, such a reel scrolls a
  // blurred filler strip of labels while it's turning, then snaps to its real
  // (single or empty) state the instant it lands.
  const fillerBase = spinFiller.slice(0, 12);
  const fillerLoopH = fillerBase.length * ROW_H;
  const showFiller = blurring && !reduced && len <= 1 && fillerBase.length > 0;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (spinning) return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      onFocusSibling(reelIndex, -1);
      return;
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      onFocusSibling(reelIndex, 1);
      return;
    }
    if (disabled || len === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      onPosChange(pos + 1);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      onPosChange(pos - 1);
      return;
    }
    if (e.key === "Home") {
      e.preventDefault();
      onPosChange(pos + shortestDelta(selected, 0, len));
      return;
    }
    if (e.key === "End") {
      e.preventDefault();
      onPosChange(pos + shortestDelta(selected, len - 1, len));
      return;
    }
    if (e.key === "Enter" && onActivate) {
      e.preventDefault();
      onActivate(selected);
    }
  };

  return (
    <div className="relative flex min-w-0 flex-col">
      <div
        ref={registerRef}
        // An empty reel has no options to select, so it isn't a listbox. Falling
        // back to a plain group keeps its "Browse all" link valid (a listbox may
        // only contain options), while it stays focusable for Left/Right nav.
        role={len > 0 ? "listbox" : "group"}
        aria-label={label}
        aria-disabled={inert || undefined}
        tabIndex={disabled ? -1 : 0}
        aria-activedescendant={
          len > 0 && activeItem ? rowDomId(reelKey, activeItem.id) : undefined
        }
        onKeyDown={handleKeyDown}
        className={[
          "relative -mx-1 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-foreground/50",
          spinning ? "pointer-events-none" : "",
          // Only grey a write-up-only reel once it has landed; while it's still
          // spinning its filler should read at full strength like any column.
          disabled && !blurring ? "opacity-50" : "",
        ].join(" ")}
        style={{ height: WINDOW_H }}
      >
        {/* The real options, one per item, for screen readers and
            aria-activedescendant. The moving strip below is a visual copy. */}
        <div className="sr-only">
          {items.map((item, i) => (
            <div
              key={item.id}
              id={rowDomId(reelKey, item.id)}
              role="option"
              aria-selected={i === selected}
            >
              {item.label}
              {item.deprecated ? " (deprecated)" : ""}
            </div>
          ))}
        </div>

        {/* Drawn-in label that names whatever landed, once this column settles.
            Gated on this reel's own blur, not the whole machine, so the labels
            reveal left to right as each column stops rather than all at once.
            Write-up-only reels are just a greyed placeholder, so they get no
            label. */}
        {len > 0 && !blurring && !disabled ? (
          <ReelAnnotation
            key={selected}
            label={label}
            accent={accent}
            reduced={reduced}
            variant={reelIndex}
          />
        ) : null}

        {showFiller ? (
          <div
            aria-hidden
            className="absolute inset-0 overflow-hidden"
            style={{ maskImage: EDGE_FADE, WebkitMaskImage: EDGE_FADE }}
          >
            <m.div
              className="absolute inset-x-0 top-0"
              style={{ filter: "blur(2.4px)", willChange: "transform" }}
              animate={{ y: [0, -fillerLoopH] }}
              transition={{ repeat: Infinity, duration: 0.5, ease: "linear" }}
            >
              {[...fillerBase, ...fillerBase].map((fillerLabel, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 px-1"
                  style={{ height: ROW_H }}
                >
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: accent, opacity: 0.5 }}
                  />
                  <span className="truncate text-[11px] text-muted/70 sm:text-[13px]">
                    {fillerLabel}
                  </span>
                </div>
              ))}
            </m.div>
          </div>
        ) : len === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-1 text-center">
            {empty}
          </div>
        ) : (
          <div
            aria-hidden
            className="absolute inset-0 overflow-hidden"
            style={{ maskImage: EDGE_FADE, WebkitMaskImage: EDGE_FADE }}
          >
            <div
              className={
                reduced ? "" : "transition-transform duration-200 ease-out"
              }
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: WINDOW_H / 2 - ROW_H / 2,
                transform: `translateY(${-pos * ROW_H}px)`,
                // Vertical smear while the column is actually turning, like a
                // spinning reel; snaps sharp the instant it lands. A one-item
                // reel has nothing to cycle, so it never smears.
                filter:
                  blurring && !reduced && len > 1 ? "blur(2.4px)" : undefined,
                willChange: "transform",
              }}
            >
              {items.map((item, i) => {
                // Render each real item exactly once, at the copy of its index
                // nearest the current position. A long list tiles the window
                // like an endless wheel; a short one just leaves gaps above and
                // below instead of repeating the same label to fill the rows.
                const rounded = Math.round(pos);
                const k = i + len * Math.round((pos - i) / len);
                const isCentre = k === rounded;
                // Only present a row as the "landed" pick once this column has
                // actually stopped. While it is still blurring the centre row
                // stays a plain smear, so a column never looks decided before
                // it lands (and reels to the right never spoil the pull).
                const isLanded = isCentre && !blurring;
                const distance = Math.abs(k - rounded);
                const muted = item.disabled;
                return (
                  <div
                    key={item.id}
                    aria-hidden
                    // Clicking a neighbour spins the reel to it; clicking the
                    // row you already landed on opens it. Before this the
                    // centre row's click just re-selected the same position, so
                    // the big label looked clickable and did nothing, leaving
                    // the small links underneath as the only way through.
                    onClick={
                      inert
                        ? undefined
                        : () => (isLanded ? onActivate?.(i) : onPosChange(k))
                    }
                    title={isLanded && !muted ? item.label : undefined}
                    className={[
                      "group absolute inset-x-0 flex items-center px-1",
                      inert ? "" : "cursor-pointer",
                      reduced ? "" : "transition-opacity duration-200",
                    ].join(" ")}
                    style={{
                      top: k * ROW_H,
                      height: ROW_H,
                      opacity:
                        distance === 0 ? 1 : distance === 1 ? 0.32 : 0.14,
                      // The loupe keeps the landed row crisp and softens its
                      // neighbours, so the eye lands on the middle. Skipped
                      // during the spin, where the whole strip already smears.
                      filter:
                        blurring || reduced || distance === 0
                          ? undefined
                          : `blur(${distance === 1 ? 0.7 : 1.3}px)`,
                    }}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        className="shrink-0 rounded-full transition-all"
                        style={{
                          height: isLanded ? 8 : 6,
                          width: isLanded ? 8 : 6,
                          backgroundColor: muted
                            ? "var(--color-muted, #94a3b8)"
                            : item.color,
                          boxShadow:
                            isLanded && !muted
                              ? `0 0 12px ${item.color}`
                              : undefined,
                        }}
                      />
                      {isLanded && !muted ? (
                        <span
                          className={`${fraunces.className} text-sm leading-tight text-foreground sm:text-2xl`}
                        >
                          {item.label}
                        </span>
                      ) : (
                        <span
                          className={[
                            "text-[11px] leading-snug sm:text-[13px]",
                            muted
                              ? "italic text-muted/80"
                              : "text-muted group-hover:text-foreground",
                          ].join(" ")}
                        >
                          {item.label}
                        </span>
                      )}
                      {item.deprecated ? <DeprecatedPill /> : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

type Frozen = { cat: number; opt: number; note: number };

/**
 * Full-screen v4 landing and hub: a slot machine reimagined as three floating
 * columns of type over the ambient aurora. Reel 1 picks a category, reel 2 an
 * option inside it (greyed out for write-up-only categories), reel 3 the
 * write-up behind that option. Positions move on an endless strip so spins and
 * wrap-around steps are always continuous, and a pull settles the columns one
 * at a time, left to right. A caption underneath is the plain, fully accessible
 * way to open whatever landed. Callers supply the greeting and the top-right
 * action (log in, or the signed-in controls).
 */
export default function SlotMachine({
  greeting,
  action,
}: {
  greeting: ReactNode;
  action: ReactNode;
}) {
  const router = useRouter();
  const reduced = useReducedMotion() ?? false;
  const categories = useMemo(() => buildSlots(), []);

  // Every reachable category → option → write-up leaf, flattened, so a spin can
  // pick uniformly across combinations rather than picking a category first
  // (which would over-favour small categories). Apps leaves carry a little extra
  // weight so the actual, usable stuff comes up a touch more often.
  const combos = useMemo(() => {
    const list: { cat: number; opt: number; note: number; weight: number }[] =
      [];
    categories.forEach((c, ci) => {
      // Apps carry the payoff (they are the only column that can win), so
      // they are weighted well above the rest -- a machine that rarely pays is
      // a machine nobody pulls twice.
      const weight = c.id === "apps" ? 4 : 1;
      c.options.forEach((o, oi) => {
        if (o.thoughts.length === 0) {
          list.push({ cat: ci, opt: oi, note: 0, weight });
          return;
        }
        o.thoughts.forEach((_, ni) =>
          list.push({ cat: ci, opt: oi, note: ni, weight }),
        );
      });
    });
    return list;
  }, [categories]);

  // A grab-bag of option and write-up labels the short reels scroll as blurred
  // filler while they spin, so a one-item or empty column still turns. It never
  // reads sharply (it's blurred and fast), so the exact contents don't matter.
  /** The apps, for the chalk backdrop. Only openable ones are worth writing. */
  const chalkTargets = useMemo(() => {
    const apps = categories.find((c) => c.id === "apps");
    return (apps?.options ?? [])
      .filter((o) => !o.disabled)
      .map((o) => ({ id: o.id, label: o.label, color: o.color }));
  }, [categories]);

  const spinPool = useMemo(() => {
    const labels: string[] = [];
    categories.forEach((c) =>
      c.options.forEach((o) => {
        labels.push(o.label);
        o.thoughts.forEach((t) => labels.push(t.title));
      }),
    );
    return Array.from(new Set(labels));
  }, [categories]);

  const [catPos, setCatPos] = useState<ReelPos>(still(0));
  const [optPos, setOptPos] = useState<ReelPos>(still(0));
  const [notePos, setNotePos] = useState<ReelPos>(still(0));
  const [spinning, setSpinning] = useState(false);
  // How many columns have locked in so far this spin. Every reel starts turning
  // at once; they settle left to right, so a reel is still blurring while its
  // index is at or past this count. 3 (all settled) when the machine is idle.
  const [settledCount, setSettledCount] = useState(3);
  // While a spin runs, reels 2 and 3 read their contents from the locked-in
  // target instead of the mid-flight reel-1 position, so they never thrash
  // through every category the first reel passes on its way down.
  const [frozen, setFrozen] = useState<Frozen | null>(null);
  // Set the moment all three columns lock in on a real app, cleared when the
  // flourish finishes. Landing on something you can actually open is the win;
  // a write-up-only or disabled pull is not.
  const [won, setWon] = useState(false);
  // Bumped on every win so the celebration remounts. CSS animations only run on
  // mount, so without a fresh key a second win would reuse the same elements
  // and sit there motionless.
  const [winKey, setWinKey] = useState(0);
  // Which fall style this win uses. Picked at win time (client-only, well after
  // hydration) so consecutive wins don't look identical.
  const [fallStyle, setFallStyle] = useState<FallStyle>(1);
  // Read after mount: localStorage is client-only, and reading it during render
  // would make the server and first client pass disagree on the icon.
  const [sound, setSound] = useState(true);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSound(soundEnabled());
  }, []);

  const timers = useRef<number[]>([]);
  useEffect(() => {
    const owned = timers;
    return () => owned.current.forEach((id) => window.clearTimeout(id));
  }, []);

  // The three listbox elements, so Left/Right can hop focus between columns.
  const reelEls = useRef<(HTMLDivElement | null)[]>([null, null, null]);
  const focusSibling = (from: number, dir: 1 | -1) => {
    const n = reelEls.current.length;
    for (let step = 1; step <= n; step += 1) {
      const j = from + dir * step;
      if (j < 0 || j >= n) return;
      const el = reelEls.current[j];
      // Skip greyed-out reels (they carry tabindex -1) so focus never parks
      // somewhere the user can't act.
      if (el && el.getAttribute("tabindex") !== "-1") {
        el.focus();
        return;
      }
    }
  };

  const catIndex = frozen
    ? frozen.cat
    : wrapIndex(Math.round(catPos.pos), categories.length);
  const category = categories[catIndex];
  const options = category.options;
  const optIndex = frozen
    ? frozen.opt
    : wrapIndex(Math.round(optPos.pos), options.length);
  const option = options[optIndex];
  const middleDisabled = Boolean(option?.disabled);
  const thoughts: SlotThought[] = option?.thoughts ?? [];
  const noteIndex = frozen
    ? frozen.note
    : wrapIndex(Math.round(notePos.pos), thoughts.length);
  const thought = thoughts.length > 0 ? thoughts[noteIndex] : undefined;

  const catAccent = category.color;
  const optAccent = option?.color ?? catAccent;
  const noteAccent = thought?.color ?? optAccent;

  // The loupe's edge only takes on a column's accent once that column has
  // actually landed; until then it stays a neutral hairline, so the colour
  // never resolves ahead of the pick. settledCount counts locked-in columns
  // (1 after the category, 2 after the option, 3 when the write-up lands), and
  // it sits at 3 whenever the machine is idle.
  const NEUTRAL_EDGE =
    "color-mix(in srgb, var(--color-foreground) 14%, transparent)";
  const lensEdge = (accent: string, settledAt: number): string =>
    !spinning || settledCount >= settledAt
      ? `color-mix(in srgb, ${accent} 55%, transparent)`
      : NEUTRAL_EDGE;
  const catEdge = lensEdge(catAccent, 1);
  const optEdge = lensEdge(optAccent, 2);
  const noteEdge = lensEdge(noteAccent, 3);
  const lensBorder = `linear-gradient(to right, ${catEdge} 0%, ${catEdge} 30%, ${optEdge} 45%, ${optEdge} 55%, ${noteEdge} 70%, ${noteEdge} 100%)`;

  // The middle reel names an app to open under Apps, and a plain option
  // elsewhere. Write-up-only categories grey it out and skip the label entirely.
  const optLabel = category.id === "apps" ? "App link" : "Options";

  // Downstream reels only reset when the upstream selection really changes,
  // so nudging a reel around its own strip never yanks its neighbours.
  const moveCat = (next: number) => {
    setCatPos(glideTo(next));
    if (wrapIndex(Math.round(next), categories.length) !== catIndex) {
      setOptPos(still(0));
      setNotePos(still(0));
    }
  };
  const moveOpt = (next: number) => {
    setOptPos(glideTo(next));
    if (wrapIndex(Math.round(next), options.length) !== optIndex) {
      setNotePos(still(0));
    }
  };
  const moveNote = (next: number) => setNotePos(glideTo(next));

  const openHref = (href: string, external?: boolean) => {
    if (!href) return;
    if (external) {
      window.open(href, "_blank", "noopener,noreferrer");
      return;
    }
    router.push(href);
  };

  // Enter on the category reel opens the primary landed destination: the option
  // itself when it's openable, otherwise its write-up, so the leftmost column is
  // never a keyboard dead end.
  const openLanded = () => {
    if (option && !option.disabled) {
      openHref(option.href, option.external);
      return;
    }
    if (thought) openHref(thought.href);
  };

  /** Where an app sits in the reels, so the backdrop can spin straight to it. */
  const comboForOption = (optionId: string) => {
    const cat = categories.findIndex((c) =>
      c.options.some((o) => o.id === optionId),
    );
    if (cat < 0) return undefined;
    const opt = categories[cat].options.findIndex((o) => o.id === optionId);
    return { cat, opt, note: 0 };
  };

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };

  // Weighted pick across all combos, so every category/app/write-up landing is
  // about equally likely (Apps a little more so).
  const pickCombo = () => {
    const total = combos.reduce((sum, c) => sum + c.weight, 0);
    let r = Math.random() * total;
    for (const c of combos) {
      r -= c.weight;
      if (r <= 0) return c;
    }
    return combos[combos.length - 1];
  };

  /**
   * Pull the machine. With no argument it picks at random; pass a combo to land
   * somewhere specific, which is how clicking a name in the backdrop works --
   * the reels actually spin to it rather than jumping.
   */
  const spin = (target?: { cat: number; opt: number; note: number }) => {
    if (spinning) return;
    // Arm the audio here, inside the click, so the win jingle a couple of
    // seconds later plays on a context the browser already trusts. On mobile a
    // context opened at jingle time is born suspended and stays silent.
    unlockWinAudio();
    const combo = target ?? pickCombo();
    const catTarget = combo.cat;
    const optList = categories[catTarget].options;
    const optTarget = combo.opt;
    const noteList = optList[optTarget]?.thoughts ?? [];
    const noteTarget = combo.note;

    if (reduced) {
      setFrozen(null);
      setCatPos(still(catTarget));
      setOptPos(still(optTarget));
      setNotePos(still(noteTarget));
      return;
    }

    clearTimers();
    // clearTimers kills the pending "stop celebrating" timer, so a spin started
    // mid-celebration would otherwise strand `won` at true forever and every
    // later win would render into already-mounted, already-finished elements.
    setWon(false);
    setFrozen({ cat: catTarget, opt: optTarget, note: noteTarget });
    setSpinning(true);
    setSettledCount(0);
    setOptPos(still(0));
    setNotePos(still(0));

    const schedule = (fn: () => void, at: number) => {
      timers.current.push(window.setTimeout(fn, at));
    };

    // Keep a column free-wheeling (steady, fast steps) from the start of the
    // spin until it's that column's turn to settle, so the reels to the right of
    // whatever is landing are always visibly turning rather than sitting still.
    // Returns the position it reaches, so the settle can carry on from there
    // without a jump. A single-item reel has nothing to cycle, so it holds.
    const freeSpin = (
      len: number,
      set: (value: number) => void,
      startAt: number,
      endAt: number,
      stepMs = 42,
    ): number => {
      if (len <= 1) return 0;
      let p = 0;
      for (let at = startAt; at < endAt; at += stepMs) {
        p += 1;
        const value = p;
        schedule(() => set(value), at);
      }
      return p;
    };

    // Settle one column onto its target: step forward along the endless strip,
    // easing out like a wheel losing momentum (step distances shrink and the
    // times spread late). Positions only increase, so the strip never jumps
    // back. `extraTurn` adds a whole rotation before landing, which reel 1 wants
    // (it settles from rest); the columns that have been free-wheeling pass 0 so
    // they simply decelerate the short remaining distance, with no second spin.
    // A single-item (or empty) reel has nothing to spin, so it just lands after
    // a short beat, keeping the left-to-right rhythm.
    const runReel = (
      len: number,
      targetIndex: number,
      fromPos: number,
      set: (value: number) => void,
      start: number,
      durMs: number,
      extraTurn: boolean,
    ): number => {
      if (len <= 1) {
        schedule(() => set(targetIndex), start);
        return start + 130;
      }
      const fromIndex = wrapIndex(Math.round(fromPos), len);
      let travel =
        wrapIndex(targetIndex - fromIndex, len) + (extraTurn ? len : 0);
      if (travel === 0) travel = len;
      const steps = Math.min(14, Math.max(6, travel));
      let prev = 0;
      for (let j = 1; j <= steps; j += 1) {
        const p = j / steps;
        const cum = Math.min(
          travel,
          Math.max(prev + 1, Math.round(travel * (1 - Math.pow(1 - p, 3)))),
        );
        const at = start + Math.round(durMs * (1 - Math.pow(1 - p, 2)));
        schedule(() => set(fromPos + cum), at);
        prev = cum;
      }
      return start + durMs;
    };

    // All three reels turn together from the off; they lock in left to right.
    // The category settles first, straight from where it sits. The other two
    // free-wheel until their turn comes, then decelerate onto their target.
    const setOpt = (v: number) => setOptPos(glideTo(v));
    const setNote = (v: number) => setNotePos(glideTo(v));

    const t1 = runReel(
      categories.length,
      catTarget,
      catPos.pos,
      (v) => setCatPos(glideTo(v)),
      0,
      620,
      true,
    );
    schedule(() => setSettledCount(1), t1);

    const optFrom = freeSpin(optList.length, setOpt, 0, t1);
    const t2 = runReel(
      optList.length,
      optTarget,
      optFrom,
      setOpt,
      t1,
      460,
      false,
    );
    schedule(() => setSettledCount(2), t2);

    const noteFrom = freeSpin(noteList.length, setNote, 0, t2);
    const t3 = runReel(
      noteList.length,
      noteTarget,
      noteFrom,
      setNote,
      t2,
      460,
      false,
    );

    schedule(
      () => {
        setSpinning(false);
        setSettledCount(3);
        setFrozen(null);

        // The payoff: three columns land on an openable app. Reduced-motion gets
        // the outcome without the flashing, so it just skips straight past.
        const landedCategory =
          categories[wrapIndex(catTarget, categories.length)];
        const landedOption =
          landedCategory?.options[wrapIndex(optTarget, optList.length)];
        if (
          isWinningPull({
            category: landedCategory,
            option: landedOption,
            reduced,
          })
        ) {
          setWinKey((k) => k + 1);
          setFallStyle((prev) => {
            // Never the same style twice in a row -- repetition is the thing that
            // makes a celebration feel canned.
            const options = ([1, 2, 3, 4] as FallStyle[]).filter(
              (v) => v !== prev,
            );
            return options[Math.floor(Math.random() * options.length)];
          });
          setWon(true);
          playWinSound();
          schedule(() => setWon(false), WIN_MS);
        }
      },
      Math.max(t1, t2, t3) + 200,
    );
  };

  const totalWriteups = categories.reduce(
    (n, c) => n + c.options.reduce((m, o) => m + o.thoughts.length, 0),
    0,
  );

  const status = spinning
    ? "Spinning the reels"
    : `Category ${category.label}, option ${option?.label ?? "none"}, ${
        thought ? `write-up ${thought.title}` : "no write-up"
      }`;

  const reelItems = (): ReelItem[] =>
    options.map((o) => ({
      id: o.id,
      label: o.label,
      color: o.color,
      ...(o.disabled ? { disabled: true } : {}),
    }));

  const noteItems = (): ReelItem[] =>
    thoughts.map((t, i) => ({
      id: `${option?.id ?? "none"}-${i}`,
      label: t.title,
      color: t.color,
      ...(t.deprecated ? { deprecated: true } : {}),
    }));

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-background text-foreground">
      {/* Confetti falls behind the machine: it should frame the win, not sit on
          top of the glass you are trying to read. Not rendered under reduced
          motion. */}
      {/* App names writing themselves across the background between pulls.
          Hidden while the reels turn so it never competes with them. */}
      {!reduced ? (
        <ChalkBackdrop
          targets={chalkTargets}
          hidden={spinning}
          onPick={(id) => {
            const target = comboForOption(id);
            if (target) spin(target);
          }}
        />
      ) : null}

      {won ? (
        <WinCelebration
          key={winKey}
          optionColor={optAccent}
          accent={catAccent}
          style={fallStyle}
        />
      ) : null}
      <GraphBackground />

      {/* Header, same chrome pattern as v3: title + badge left, actions right. */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-40 flex flex-wrap items-start justify-between gap-x-3 gap-y-2 bg-gradient-to-b from-background via-background/85 to-transparent p-4 pb-8 sm:p-6">
        <div className="pointer-events-auto min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold tracking-tight text-foreground sm:text-lg">
              paul-explore
            </h1>
            <span className="paul-touch-min rounded-full border border-border bg-surface/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted backdrop-blur">
              v4
            </span>
          </div>
          {/* Subtitle is noise on a phone where space is tight. */}
          <p className="mt-1 hidden max-w-xs text-sm text-muted sm:block">
            {greeting}
          </p>
        </div>
        <div className="pointer-events-auto flex shrink-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
          <SearchHint />
          <ResumeLink />
          {action}
        </div>
      </header>

      <main
        aria-label="Slot machine of features and write-ups"
        className="absolute inset-0 flex flex-col overflow-y-auto px-5 pb-12 pt-16 sm:px-8 sm:pb-20 sm:pt-28"
      >
        <div className="m-auto w-full max-w-6xl">
          {/* A quiet data line instead of cabinet chrome. */}
          <p
            data-chalk-avoid
            className="reveal-up mb-4 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-muted sm:mb-8"
            style={{ animationDelay: "0.02s" }}
          >
            {categories.length} categories · {totalWriteups} write-ups · one
            pull
          </p>

          <div className="relative grid grid-cols-3 gap-4 sm:gap-8">
            <div
              className="reveal-up min-w-0"
              style={{ animationDelay: "0.05s" }}
            >
              <Reel
                label="Category"
                reelKey="cat"
                reelIndex={0}
                items={categories}
                posState={catPos}
                spinning={spinning}
                blurring={spinning && settledCount <= 0}
                reduced={reduced}
                accent={catAccent}
                onPosChange={moveCat}
                onActivate={openLanded}
                onFocusSibling={focusSibling}
                registerRef={(el) => {
                  reelEls.current[0] = el;
                }}
                spinFiller={spinPool}
              />
            </div>
            <div
              className="reveal-up min-w-0"
              style={{ animationDelay: "0.08s" }}
            >
              <Reel
                key={category.id}
                label={optLabel}
                reelKey="opt"
                reelIndex={1}
                items={reelItems()}
                posState={optPos}
                spinning={spinning}
                blurring={spinning && settledCount <= 1}
                reduced={reduced}
                accent={optAccent}
                disabled={middleDisabled}
                onPosChange={moveOpt}
                onActivate={(i) => {
                  const target = options[i];
                  if (target && !target.disabled)
                    openHref(target.href, target.external);
                }}
                onFocusSibling={focusSibling}
                registerRef={(el) => {
                  reelEls.current[1] = el;
                }}
                spinFiller={spinPool}
              />
            </div>
            <div
              className="reveal-up min-w-0"
              style={{ animationDelay: "0.11s" }}
            >
              <Reel
                key={option?.id ?? "none"}
                label="Write-up"
                reelKey="note"
                reelIndex={2}
                items={noteItems()}
                posState={notePos}
                spinning={spinning}
                blurring={spinning && settledCount <= 2}
                reduced={reduced}
                accent={noteAccent}
                onPosChange={moveNote}
                onActivate={(i) => {
                  const target = thoughts[i];
                  if (target) openHref(target.href);
                }}
                onFocusSibling={focusSibling}
                registerRef={(el) => {
                  reelEls.current[2] = el;
                }}
                spinFiller={spinPool}
                empty={
                  <>
                    <p
                      className={`${fraunces.className} text-[13px] leading-snug text-muted sm:text-lg`}
                    >
                      No write-up yet
                    </p>
                    <Link
                      href="/thoughts"
                      className="inline-flex min-h-11 items-center justify-center rounded sm:min-h-0 font-mono text-[9px] uppercase tracking-[0.12em] text-muted underline underline-offset-4 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/60 sm:text-[11px] sm:tracking-[0.15em]"
                    >
                      Browse all →
                    </Link>
                  </>
                }
              />
            </div>

            {/* One continuous glass loupe across all three columns instead of a
                separate bar per reel. The centre row of every column reads as
                held under one loupe. The glass itself is clear; the accent lives
                only on the border ring (the inner layer paints the gradient and
                masks its own middle out, so nothing bleeds into the glass), and
                each third carries its own column's colour, but only once that
                column lands — until then that stretch of the edge is neutral. */}
            <div
              aria-hidden
              data-testid="reel-lens"
              className="pointer-events-none absolute -inset-x-4 z-10 rounded-2xl transition-[box-shadow] duration-500 sm:-inset-x-6"
              style={{
                top: LENS_TOP,
                height: LENS_H,
                boxShadow: won
                  ? `inset 0 1px 0 rgba(255,255,255,0.5), 0 0 30px 6px color-mix(in srgb, ${optAccent} 45%, transparent)`
                  : spinning
                    ? "inset 0 1px 0 rgba(255,255,255,0.18)"
                    : "inset 0 1px 0 rgba(255,255,255,0.35), 0 8px 24px rgba(0,0,0,0.12)",
              }}
            >
              {/* The win shine sweeps across the glass that is already here,
                  rather than a second box floating over it. */}
              {won ? (
                <div className="absolute inset-0 overflow-hidden rounded-2xl">
                  <div
                    className="absolute inset-y-0 w-1/3"
                    style={{
                      background: `linear-gradient(100deg, transparent, rgba(255,255,255,0.55), transparent)`,
                      animation: `v4-win-sweep 900ms ease-out forwards`,
                    }}
                  />
                </div>
              ) : null}
              <div
                className="absolute inset-0 rounded-2xl"
                style={{
                  padding: 1,
                  background: lensBorder,
                  WebkitMask:
                    "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                  WebkitMaskComposite: "xor",
                  mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                  maskComposite: "exclude",
                }}
              />
            </div>
          </div>

          {/* The pull: a single circular key between two hairlines, tinted with
              whatever category is currently up. */}
          <div
            data-chalk-avoid
            className="reveal-up relative mt-4 flex items-center justify-center gap-6 sm:mt-9"
            style={{ animationDelay: "0.08s" }}
          >
            <div aria-hidden className="h-px max-w-40 flex-1 bg-border" />
            <button
              type="button"
              onClick={() => spin()}
              disabled={spinning}
              aria-label="Spin the reels"
              className="flex h-16 w-16 items-center justify-center rounded-full border bg-background/40 font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-foreground backdrop-blur-sm transition-[transform,border-color,background-color] hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 sm:h-20 sm:w-20"
              style={{
                borderColor: `color-mix(in srgb, ${catAccent} 55%, transparent)`,
                boxShadow: spinning
                  ? "none"
                  : `0 0 26px color-mix(in srgb, ${catAccent} 22%, transparent)`,
              }}
            >
              {spinning ? "···" : "Spin"}
            </button>
            {/* A win makes noise, so there has to be a way to stop it. The
                preference persists; the control is quiet until you look for it. */}
            <button
              type="button"
              onClick={() => {
                const next = !sound;
                setSound(next);
                setSoundEnabled(next);
                // Unmuting is itself a gesture, so take it to arm the context
                // now rather than waiting on the next spin.
                if (next) unlockWinAudio();
              }}
              aria-pressed={sound}
              aria-label={sound ? "Mute win sound" : "Unmute win sound"}
              title={sound ? "Mute win sound" : "Unmute win sound"}
              className="absolute right-0 flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/60"
            >
              <span aria-hidden className="font-mono text-[13px]">
                {sound ? "♪" : "×"}
              </span>
            </button>
            <div aria-hidden className="h-px max-w-40 flex-1 bg-border" />
          </div>

          {/* Result caption: the plain, keyboard-friendly way to open what
              landed. Hidden mid-spin so the pull isn't spoiled. A fixed height
              keeps the whole centred block from reflowing as the blurb and
              links change between selections. */}
          <div
            data-chalk-result
            className="reveal-up mx-auto mt-4 flex h-24 w-full max-w-2xl flex-col items-center justify-start overflow-hidden text-center sm:mt-9 sm:h-32"
            style={{ animationDelay: "0.08s" }}
          >
            {spinning ? (
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
                spinning…
              </p>
            ) : (
              <>
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted">
                  <span style={{ color: catAccent }}>{category.label}</span>
                  <span aria-hidden> › </span>
                  <span style={{ color: optAccent }}>{option?.label}</span>
                </p>
                {option?.blurb ? (
                  <p className="mx-auto mt-2 max-w-xl text-[13px] leading-relaxed text-muted">
                    {option.blurb}
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-1.5 text-[13px] font-semibold">
                  {option && !option.disabled ? (
                    option.external ? (
                      <a
                        href={option.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-11 items-center justify-center rounded sm:min-h-0 transition-opacity hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/60"
                        style={{ color: optAccent }}
                      >
                        Open {option.label} →
                      </a>
                    ) : (
                      <Link
                        href={option.href}
                        className="inline-flex min-h-11 items-center justify-center rounded sm:min-h-0 transition-opacity hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/60"
                        style={{ color: optAccent }}
                      >
                        Open {option.label} →
                      </Link>
                    )
                  ) : null}
                  {thought ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Link
                        href={thought.href}
                        className="inline-flex min-h-11 items-center justify-center rounded sm:min-h-0 transition-opacity hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/60"
                        style={{ color: noteAccent }}
                      >
                        Read: {thought.title} →
                      </Link>
                      {thought.deprecated ? <DeprecatedPill /> : null}
                    </span>
                  ) : null}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Announce the landed combo to screen readers without moving focus. */}
        <div aria-live="polite" className="sr-only">
          {status}
        </div>
      </main>

      {/* Interaction hint, purely visual */}
      <div
        aria-hidden
        data-chalk-avoid
        className="pointer-events-none absolute bottom-5 left-5 z-40 hidden font-mono text-[10px] uppercase tracking-[0.2em] text-muted sm:block"
      >
        ↑↓ select · enter opens
      </div>

      {/* Corner nav */}
      <nav
        aria-label="Site"
        data-chalk-avoid
        className="pointer-events-auto absolute bottom-5 right-5 z-40 flex items-center gap-3 text-xs text-muted"
      >
        <Link
          href="/thoughts"
          className="inline-flex min-h-11 items-center justify-center rounded sm:min-h-0 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/60"
        >
          Thoughts
        </Link>
        <a
          href="https://github.com/gpbsumido"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center justify-center rounded sm:min-h-0 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/60"
        >
          GitHub
        </a>
        {/* Peek at the older landing designs. A tiny <details> picker instead
            of a hard-coded link, so it stays right as versions come and go. */}
        <details className="relative">
          <summary className="cursor-pointer list-none rounded transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/60 [&::-webkit-details-marker]:hidden">
            Versions ↗
          </summary>
          <div className="absolute bottom-full right-0 mb-2 flex min-w-[7rem] flex-col rounded-lg border border-border bg-surface/90 p-1 text-right backdrop-blur">
            {OLDER_VERSIONS.map((v) => (
              <Link
                key={v}
                href={`/?version=${v}`}
                className="inline-flex min-h-11 items-center justify-center rounded sm:min-h-0 px-2 py-1 whitespace-nowrap transition-colors hover:bg-foreground/5 hover:text-foreground"
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
