"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fraunces } from "next/font/google";
import { m, useReducedMotion, type Variants } from "framer-motion";
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

/** Standout résumé call-to-action, same treatment as the v3 header chrome. */
function ResumeLink() {
  return (
    <Link
      href="/resume"
      className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold backdrop-blur-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/60"
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
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/70 px-3 py-2 text-sm text-muted backdrop-blur-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/60"
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
const glideTo =
  (next: number) =>
  (): ReelPos => ({ pos: next });

/** DOM ids need to be attribute-safe, so squash anything odd in the item id. */
const rowDomId = (reelKey: string, itemId: string): string =>
  `v4-${reelKey}-${itemId.replace(/[^a-zA-Z0-9_-]+/g, "-")}`;

/**
 * Three hand-drawn arrow shapes, one per column, so the marks read as sketched
 * by hand rather than stamped from a template: a lazy S, a leftward hook, and a
 * double wiggle. Each pairs the curve with an arrowhead sitting at its foot.
 */
const ARROW_VARIANTS: { line: string; head: string }[] = [
  { line: "M23 4 C 31 17, 15 33, 23 52", head: "M16 44 L23 54 L30 44" },
  { line: "M31 4 C 33 20, 13 30, 21 52", head: "M14 44 L22 54 L28 43" },
  {
    line: "M20 4 C 31 13, 13 25, 26 36 C 33 42, 19 47, 23 53",
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
        className="mt-1 flex-1 overflow-visible"
        width="46"
        viewBox="0 0 46 60"
        fill="none"
        preserveAspectRatio="xMidYMax meet"
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
        role="listbox"
        aria-label={label}
        aria-disabled={inert || undefined}
        tabIndex={disabled ? -1 : 0}
        aria-activedescendant={
          activeItem ? rowDomId(reelKey, activeItem.id) : undefined
        }
        onKeyDown={handleKeyDown}
        className={[
          "relative -mx-1 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-foreground/50",
          spinning ? "pointer-events-none" : "",
          disabled ? "opacity-50" : "",
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

        {/* The magnifier: a rounded glass bar over the centre row, with a bright
            top edge and a soft accent glow, so the landed item reads as if held
            under a loupe. The glass itself is clear (the loupe sharpens the
            landed row, it doesn't fog it); the neighbours blur instead. Dimmed
            while the column is still spinning. */}
        {len > 0 ? (
          <div
            aria-hidden
            data-testid="reel-lens"
            className="pointer-events-none absolute inset-x-0 z-10 rounded-2xl border transition-[box-shadow,border-color] duration-500"
            style={{
              top: LENS_TOP,
              height: LENS_H,
              borderColor: `color-mix(in srgb, ${accent} ${
                blurring ? 22 : 42
              }%, transparent)`,
              background:
                "linear-gradient(to bottom, color-mix(in srgb, white 10%, transparent), transparent 60%)",
              boxShadow: blurring
                ? "inset 0 1px 0 rgba(255,255,255,0.18)"
                : `inset 0 1px 0 rgba(255,255,255,0.35), 0 8px 24px color-mix(in srgb, ${accent} 20%, transparent)`,
            }}
          />
        ) : null}

        {/* Drawn-in label that names whatever landed, once the column settles.
            Write-up-only reels are just a greyed placeholder, so they get no
            label. */}
        {len > 0 && !spinning && !disabled ? (
          <ReelAnnotation
            key={selected}
            label={label}
            accent={accent}
            reduced={reduced}
            variant={reelIndex}
          />
        ) : null}

        {len === 0 ? (
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
                const isLanded = k === rounded;
                const distance = Math.abs(k - rounded);
                const muted = item.disabled;
                return (
                  <div
                    key={item.id}
                    aria-hidden
                    onClick={inert ? undefined : () => onPosChange(k)}
                    className={[
                      "group absolute inset-x-0 flex items-center px-1",
                      inert ? "" : "cursor-pointer",
                      reduced ? "" : "transition-opacity duration-200",
                    ].join(" ")}
                    style={{
                      top: k * ROW_H,
                      height: ROW_H,
                      opacity: distance === 0 ? 1 : distance === 1 ? 0.32 : 0.14,
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
                          className={`${fraunces.className} whitespace-nowrap text-lg leading-none text-foreground sm:text-2xl`}
                        >
                          {item.label}
                        </span>
                      ) : (
                        <span
                          className={[
                            "truncate text-[13px]",
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

const revealContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.12 } },
};

const revealItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

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
      const weight = c.id === "apps" ? 1.5 : 1;
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

  const spin = () => {
    if (spinning) return;
    const combo = pickCombo();
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

    // Spin one column: step forward along the endless strip through at least a
    // full turn, landing exactly on the target. Distance eases out (a wheel
    // losing momentum) and the step times bunch up early then spread late, so
    // it decelerates. Positions only increase, so the strip never jumps back.
    // A single-item (or empty) reel has nothing to spin, so it just lands after
    // a short beat, keeping the left-to-right rhythm.
    const runReel = (
      len: number,
      targetIndex: number,
      fromPos: number,
      set: (value: number) => void,
      start: number,
      durMs: number,
    ): number => {
      if (len <= 1) {
        schedule(() => set(targetIndex), start);
        return start + 130;
      }
      const fromIndex = wrapIndex(Math.round(fromPos), len);
      const travel = wrapIndex(targetIndex - fromIndex, len) + len;
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

    const t1 = runReel(categories.length, catTarget, catPos.pos, (v) =>
      setCatPos(glideTo(v)), 0, 620);
    schedule(() => setSettledCount(1), t1);

    const optFrom = freeSpin(optList.length, setOpt, 0, t1);
    const t2 = runReel(optList.length, optTarget, optFrom, setOpt, t1, 460);
    schedule(() => setSettledCount(2), t2);

    const noteFrom = freeSpin(noteList.length, setNote, 0, t2);
    const t3 = runReel(noteList.length, noteTarget, noteFrom, setNote, t2, 460);

    schedule(() => {
      setSpinning(false);
      setSettledCount(3);
      setFrozen(null);
    }, Math.max(t1, t2, t3) + 200);
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
      <GraphBackground />

      {/* Header, same chrome pattern as v3: title + badge left, actions right. */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-40 flex flex-wrap items-start justify-between gap-x-3 gap-y-2 bg-gradient-to-b from-background via-background/85 to-transparent p-4 pb-8 sm:p-6">
        <div className="pointer-events-auto min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold tracking-tight text-foreground sm:text-lg">
              paul-explore
            </h1>
            <span className="rounded-full border border-border bg-surface/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted backdrop-blur">
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
        className="absolute inset-0 flex flex-col overflow-y-auto px-5 pb-20 pt-24 sm:px-8 sm:pt-28"
      >
        <m.div
          variants={revealContainer}
          initial={reduced ? false : "hidden"}
          animate="show"
          className="m-auto w-full max-w-6xl"
        >
          {/* A quiet data line instead of cabinet chrome. */}
          <m.p
            variants={revealItem}
            className="mb-8 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-muted"
          >
            {categories.length} categories · {totalWriteups} write-ups · one
            pull
          </m.p>

          <div className="grid grid-cols-3 gap-4 sm:gap-8">
            <m.div variants={revealItem} className="min-w-0">
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
              />
            </m.div>
            <m.div variants={revealItem} className="min-w-0">
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
              />
            </m.div>
            <m.div variants={revealItem} className="min-w-0">
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
                empty={
                  <>
                    <p
                      className={`${fraunces.className} text-[17px] text-muted sm:text-lg`}
                    >
                      No write-up yet
                    </p>
                    <Link
                      href="/thoughts"
                      className="rounded font-mono text-[11px] uppercase tracking-[0.15em] text-muted underline underline-offset-4 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/60"
                    >
                      Browse all →
                    </Link>
                  </>
                }
              />
            </m.div>
          </div>

          {/* The pull: a single circular key between two hairlines, tinted with
              whatever category is currently up. */}
          <m.div
            variants={revealItem}
            className="mt-7 flex items-center justify-center gap-6 sm:mt-9"
          >
            <div aria-hidden className="h-px max-w-40 flex-1 bg-border" />
            <button
              type="button"
              onClick={spin}
              disabled={spinning}
              aria-label="Spin the reels"
              className="flex h-20 w-20 items-center justify-center rounded-full border bg-background/40 font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-foreground backdrop-blur-sm transition-[transform,border-color,background-color] hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                borderColor: `color-mix(in srgb, ${catAccent} 55%, transparent)`,
                boxShadow: spinning
                  ? "none"
                  : `0 0 26px color-mix(in srgb, ${catAccent} 22%, transparent)`,
              }}
            >
              {spinning ? "···" : "Spin"}
            </button>
            <div aria-hidden className="h-px max-w-40 flex-1 bg-border" />
          </m.div>

          {/* Result caption: the plain, keyboard-friendly way to open what
              landed. Hidden mid-spin so the pull isn't spoiled. A fixed height
              keeps the whole centred block from reflowing as the blurb and
              links change between selections. */}
          <m.div
            variants={revealItem}
            className="mx-auto mt-7 flex h-32 w-full max-w-2xl flex-col items-center justify-start overflow-hidden text-center sm:mt-9"
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
                        className="rounded transition-opacity hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/60"
                        style={{ color: optAccent }}
                      >
                        Open {option.label} →
                      </a>
                    ) : (
                      <Link
                        href={option.href}
                        className="rounded transition-opacity hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/60"
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
                        className="rounded transition-opacity hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/60"
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
          </m.div>
        </m.div>

        {/* Announce the landed combo to screen readers without moving focus. */}
        <div aria-live="polite" className="sr-only">
          {status}
        </div>
      </main>

      {/* Interaction hint, purely visual */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-5 left-5 z-40 hidden font-mono text-[10px] uppercase tracking-[0.2em] text-muted sm:block"
      >
        ↑↓ select · enter opens
      </div>

      {/* Corner nav */}
      <nav
        aria-label="Site"
        className="pointer-events-auto absolute bottom-5 right-5 z-40 flex items-center gap-3 text-xs text-muted"
      >
        <Link
          href="/thoughts"
          className="rounded transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/60"
        >
          Thoughts
        </Link>
        <a
          href="https://github.com/gpbsumido"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/60"
        >
          GitHub
        </a>
        <Link
          href="/?version=v3"
          className="rounded transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/60"
        >
          v3 ↗
        </Link>
      </nav>
    </div>
  );
}
