"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fraunces } from "next/font/google";
import { m, useReducedMotion, type Variants } from "framer-motion";
import GraphBackground from "@/app/v3/graph/GraphBackground";
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
/** Extra rows rendered past the travel range so the wheel never shows a gap. */
const OVERSCAN = 3;

/** Reels fade out toward their edges instead of sitting in a frame. */
const EDGE_FADE =
  "linear-gradient(to bottom, transparent 0%, black 32%, black 68%, transparent 100%)";

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
};

/**
 * A reel's position on its endless strip, in row units. `pos` only needs to be
 * congruent to the selected index (mod length), so it can grow without bound
 * during spins, which is what keeps the motion continuous and directional:
 * the track never jumps back across the strip when the index wraps. `from`
 * remembers where the last glide started so the rows along the travel path
 * stay rendered while the CSS transition covers them.
 */
type ReelPos = { pos: number; from: number };

const still = (index: number): ReelPos => ({ pos: index, from: index });
const glideTo =
  (next: number) =>
  (p: ReelPos): ReelPos => ({ pos: next, from: p.pos });

/** DOM ids need to be attribute-safe, so squash anything odd in the item id. */
const rowDomId = (reelKey: string, itemId: string): string =>
  `v4-${reelKey}-${itemId.replace(/[^a-zA-Z0-9_-]+/g, "-")}`;

/**
 * One wheel of the machine: an endless, edge-faded strip of type with the
 * landed row centred and set in the display serif. Semantically it is a plain
 * listbox with a visually hidden option per item for assistive tech; the
 * moving strip itself is decoration. Arrows step one visual row in the pressed
 * direction (wrapping continuously), Home/End take the shortest path, Enter
 * activates.
 */
function Reel({
  eyebrow,
  label,
  reelKey,
  items,
  posState,
  spinning,
  reduced,
  onPosChange,
  onActivate,
  empty,
}: {
  /** Small index marker shown before the column label, e.g. "01". */
  eyebrow: string;
  label: string;
  reelKey: string;
  items: ReelItem[];
  posState: ReelPos;
  spinning: boolean;
  reduced: boolean;
  onPosChange: (next: number) => void;
  /** Omitted for reels that only select (reel 1). */
  onActivate?: (index: number) => void;
  /** Shown inside the window when there are no items. */
  empty?: ReactNode;
}) {
  const { pos, from } = posState;
  const len = items.length;
  const selected = wrapIndex(Math.round(pos), len);
  const activeItem = items[selected];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (spinning || len === 0) return;
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

  // Render every virtual row between where the last glide started and where
  // this one ends, plus a little overscan, so the strip stays solid for the
  // whole animated travel. Each virtual slot k shows items[k mod len].
  const lo = Math.floor(Math.min(from, pos)) - OVERSCAN;
  const hi = Math.ceil(Math.max(from, pos)) + OVERSCAN;
  const slots = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <p className="flex items-baseline gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-muted">
        <span aria-hidden className="text-foreground/35">
          {eyebrow}
        </span>
        {label}
      </p>
      <div aria-hidden className="h-px w-full bg-border" />
      <div
        role="listbox"
        aria-label={label}
        tabIndex={0}
        aria-activedescendant={
          activeItem ? rowDomId(reelKey, activeItem.id) : undefined
        }
        aria-disabled={spinning || undefined}
        onKeyDown={handleKeyDown}
        className={[
          "relative -mx-1 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-foreground/60",
          spinning ? "pointer-events-none opacity-70 blur-[1px]" : "",
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

        {len === 0 ? (
          <div className="flex h-full flex-col justify-center gap-1.5 px-1">
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
                reduced ? "" : "transition-transform duration-300 ease-out"
              }
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: WINDOW_H / 2 - ROW_H / 2,
                transform: `translateY(${-pos * ROW_H}px)`,
                willChange: "transform",
              }}
            >
              {slots.map((k) => {
                const item = items[wrapIndex(k, len)];
                const isLanded = k === Math.round(pos);
                const distance = Math.abs(k - Math.round(pos));
                return (
                  <div
                    key={k}
                    aria-hidden
                    onClick={() => onPosChange(k)}
                    className={[
                      "absolute inset-x-0 flex cursor-pointer items-center px-1",
                      reduced ? "" : "transition-opacity duration-300",
                    ].join(" ")}
                    style={{
                      top: k * ROW_H,
                      height: ROW_H,
                      opacity: distance === 0 ? 1 : distance === 1 ? 0.4 : 0.18,
                    }}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{
                          backgroundColor: item.color,
                          boxShadow: isLanded
                            ? `0 0 10px ${item.color}`
                            : undefined,
                        }}
                      />
                      <span
                        className={
                          isLanded
                            ? `${fraunces.className} truncate pb-0.5 text-[17px] leading-tight text-foreground sm:text-xl`
                            : "truncate text-[13px] text-muted"
                        }
                        style={
                          isLanded
                            ? { borderBottom: `2px solid ${item.color}` }
                            : undefined
                        }
                      >
                        {item.label}
                      </span>
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
  show: { transition: { staggerChildren: 0.11, delayChildren: 0.15 } },
};

const revealItem: Variants = {
  hidden: { opacity: 0, y: 26 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  },
};

/**
 * Full-screen v4 landing and hub: a slot machine reimagined as three floating
 * columns of type over the ambient aurora. Reel 1 picks a category, reel 2 an
 * option inside it, reel 3 the write-up behind that option; positions move on
 * an endless strip so spins and wrap-around steps are always continuous and
 * directional. A caption underneath is the plain, fully accessible way to open
 * whatever landed. Callers supply the greeting line and the top-right action
 * (log in, or the signed-in controls).
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

  const [catPos, setCatPos] = useState<ReelPos>(still(0));
  const [optPos, setOptPos] = useState<ReelPos>(still(0));
  const [notePos, setNotePos] = useState<ReelPos>(still(0));
  const [spinning, setSpinning] = useState(false);

  const timers = useRef<number[]>([]);
  useEffect(() => {
    const owned = timers;
    return () => owned.current.forEach((id) => window.clearTimeout(id));
  }, []);

  const catIndex = wrapIndex(Math.round(catPos.pos), categories.length);
  const category = categories[catIndex];
  const options = category.options;
  const optIndex = wrapIndex(Math.round(optPos.pos), options.length);
  const option = options[optIndex];
  const thoughts: SlotThought[] = option?.thoughts ?? [];
  const noteIndex = wrapIndex(Math.round(notePos.pos), thoughts.length);
  const thought = thoughts.length > 0 ? thoughts[noteIndex] : undefined;

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
    if (external) {
      window.open(href, "_blank", "noopener,noreferrer");
      return;
    }
    router.push(href);
  };

  const spin = () => {
    if (spinning) return;
    const catTarget = Math.floor(Math.random() * categories.length);
    const optList = categories[catTarget].options;
    const optTarget =
      optList.length > 0 ? Math.floor(Math.random() * optList.length) : 0;
    const noteList = optList[optTarget]?.thoughts ?? [];
    const noteTarget =
      noteList.length > 0 ? Math.floor(Math.random() * noteList.length) : 0;

    if (reduced) {
      setCatPos(still(catTarget));
      setOptPos(still(optTarget));
      setNotePos(still(noteTarget));
      return;
    }

    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    setSpinning(true);
    setOptPos(still(0));
    setNotePos(still(0));

    const schedule = (fn: () => void, at: number) => {
      timers.current.push(window.setTimeout(fn, at));
    };
    // Step a reel forward along its endless strip: at least one full turn,
    // landing exactly on the target, through eased cumulative positions with
    // widening gaps so it reads as a wheel losing momentum. Positions only
    // ever increase, so there is never a jump back across the strip.
    const runReel = (
      len: number,
      targetIndex: number,
      fromPos: number,
      set: (value: number) => void,
      start: number,
    ): number => {
      if (len <= 1) {
        schedule(() => set(targetIndex), start);
        return start;
      }
      const fromIndex = wrapIndex(Math.round(fromPos), len);
      const travel = wrapIndex(targetIndex - fromIndex, len) + len;
      const steps = Math.min(8, travel);
      let at = start;
      let prev = 0;
      for (let j = 1; j <= steps; j += 1) {
        const eased = 1 - Math.pow(1 - j / steps, 3);
        const cum = Math.min(
          travel,
          Math.max(prev + 1, Math.round(travel * eased)),
        );
        at += 55 + j * 26;
        const value = fromPos + cum;
        schedule(() => set(value), at);
        prev = cum;
      }
      return at;
    };

    const t1 = runReel(
      categories.length,
      catTarget,
      catPos.pos,
      (v) => setCatPos(glideTo(v)),
      0,
    );
    const t2 = runReel(
      optList.length,
      optTarget,
      0,
      (v) => setOptPos(glideTo(v)),
      t1 + 140,
    );
    const t3 = runReel(
      Math.max(noteList.length, 1),
      noteTarget,
      0,
      (v) => setNotePos(glideTo(v)),
      t2 + 140,
    );
    schedule(() => setSpinning(false), t3 + 250);
  };

  const totalOptions = categories.reduce((n, c) => n + c.options.length, 0);

  const status = spinning
    ? "Spinning the reels"
    : `Category ${category.label}, option ${option?.label ?? "none"}, ${
        thought ? `write-up ${thought.title}` : "no write-up"
      }`;

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
          className="m-auto w-full max-w-4xl"
        >
          {/* A quiet data line instead of cabinet chrome. */}
          <m.p
            variants={revealItem}
            className="mb-8 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-muted"
          >
            {categories.length} categories · {totalOptions} destinations · one
            pull
          </m.p>

          <div className="grid grid-cols-3 gap-5 sm:gap-10">
            <m.div variants={revealItem} className="min-w-0">
              <Reel
                eyebrow="01"
                label="Category"
                reelKey="cat"
                items={categories}
                posState={catPos}
                spinning={spinning}
                reduced={reduced}
                onPosChange={moveCat}
              />
            </m.div>
            <m.div variants={revealItem} className="min-w-0">
              <Reel
                key={category.id}
                eyebrow="02"
                label="Options"
                reelKey="opt"
                items={options}
                posState={optPos}
                spinning={spinning}
                reduced={reduced}
                onPosChange={moveOpt}
                onActivate={(i) => {
                  const target = options[i];
                  if (target) openHref(target.href, target.external);
                }}
              />
            </m.div>
            <m.div variants={revealItem} className="min-w-0">
              <Reel
                key={option?.id ?? "none"}
                eyebrow="03"
                label="Write-ups"
                reelKey="note"
                items={thoughts.map((t, i) => ({
                  id: `${option?.id ?? "none"}-${i}`,
                  label: t.title,
                  color: t.color,
                  ...(t.deprecated ? { deprecated: true } : {}),
                }))}
                posState={notePos}
                spinning={spinning}
                reduced={reduced}
                onPosChange={moveNote}
                onActivate={(i) => {
                  const target = thoughts[i];
                  if (target) openHref(target.href);
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
                      className="w-fit rounded font-mono text-[11px] uppercase tracking-[0.15em] text-muted underline underline-offset-4 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/60"
                    >
                      Browse all →
                    </Link>
                  </>
                }
              />
            </m.div>
          </div>

          {/* The pull: a single circular key between two hairlines. */}
          <m.div
            variants={revealItem}
            className="mt-6 flex items-center justify-center gap-6 sm:mt-8"
          >
            <div aria-hidden className="h-px max-w-40 flex-1 bg-border" />
            <button
              type="button"
              onClick={spin}
              disabled={spinning}
              className="flex h-20 w-20 items-center justify-center rounded-full border border-foreground/30 bg-background/40 pl-[0.3em] font-mono text-[11px] font-semibold uppercase tracking-[0.3em] text-foreground backdrop-blur-sm transition-colors hover:border-foreground hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
            >
              {spinning ? "···" : "Spin"}
            </button>
            <div aria-hidden className="h-px max-w-40 flex-1 bg-border" />
          </m.div>

          {/* Result caption: the plain, keyboard-friendly way to open what landed. */}
          <m.div
            variants={revealItem}
            className="mx-auto mt-6 w-full max-w-2xl text-center sm:mt-8"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted">
              <span style={{ color: category.color }}>{category.label}</span>
              <span aria-hidden> › </span>
              <span style={{ color: option?.color }}>{option?.label}</span>
            </p>
            {option?.blurb ? (
              <p className="mx-auto mt-2 max-w-xl text-[13px] leading-relaxed text-muted">
                {option.blurb}
              </p>
            ) : null}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-1.5 text-[13px] font-semibold">
              {option ? (
                option.external ? (
                  <a
                    href={option.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded transition-opacity hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/60"
                    style={{ color: option.color }}
                  >
                    Open {option.label} →
                  </a>
                ) : (
                  <Link
                    href={option.href}
                    className="rounded transition-opacity hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/60"
                    style={{ color: option.color }}
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
                    style={{ color: thought.color }}
                  >
                    Read: {thought.title} →
                  </Link>
                  {thought.deprecated ? <DeprecatedPill /> : null}
                </span>
              ) : null}
            </div>
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
