"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useReducedMotion } from "framer-motion";
import GraphBackground from "@/app/v3/graph/GraphBackground";
import { buildSlots, wrapIndex, type SlotThought } from "./slotData";

/** Height of one reel row in px; the track math and the window band share it. */
const ROW_H = 52;
/** Visible rows per reel; odd so the selected row sits dead centre. */
const VISIBLE_ROWS = 5;
const WINDOW_H = ROW_H * VISIBLE_ROWS;

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

/** DOM ids need to be attribute-safe, so squash anything odd in the item id. */
const rowDomId = (reelKey: string, itemId: string): string =>
  `v4-${reelKey}-${itemId.replace(/[^a-zA-Z0-9_-]+/g, "-")}`;

/**
 * One slot-machine wheel: a fixed window with a translating track inside, so
 * the selected row always sits centred behind the window band. Acts as a
 * listbox: arrows move the selection, Home/End jump, Enter activates.
 */
function Reel({
  label,
  reelKey,
  items,
  selected,
  spinning,
  reduced,
  onSelect,
  onActivate,
  empty,
}: {
  label: string;
  reelKey: string;
  items: ReelItem[];
  selected: number;
  spinning: boolean;
  reduced: boolean;
  onSelect: (index: number) => void;
  /** Omitted for reels that only select (reel 1). */
  onActivate?: (index: number) => void;
  /** Shown inside the window when there are no items. */
  empty?: ReactNode;
}) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (spinning || items.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      onSelect(wrapIndex(selected + 1, items.length));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      onSelect(wrapIndex(selected - 1, items.length));
      return;
    }
    if (e.key === "Home") {
      e.preventDefault();
      onSelect(0);
      return;
    }
    if (e.key === "End") {
      e.preventDefault();
      onSelect(items.length - 1);
      return;
    }
    if (e.key === "Enter" && onActivate) {
      e.preventDefault();
      onActivate(selected);
    }
  };

  const activeItem = items[selected];

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
        {label}
      </p>
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
          "relative overflow-hidden rounded-2xl border border-border bg-surface/50 backdrop-blur",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/60",
          spinning ? "pointer-events-none opacity-70 blur-[1.5px]" : "",
        ].join(" ")}
        style={{ height: WINDOW_H }}
      >
        {/* The centre window band that sells the slot look. Decorative only. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-1 z-10 rounded-lg border-y-2 border-foreground/20 bg-foreground/5"
          style={{ top: WINDOW_H / 2 - ROW_H / 2, height: ROW_H }}
        />

        {items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-1 px-3 text-center">
            {empty}
          </div>
        ) : (
          <div
            className={
              reduced ? "" : "transition-transform duration-300 ease-out"
            }
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: WINDOW_H / 2 - ROW_H / 2,
              transform: `translateY(${-selected * ROW_H}px)`,
            }}
          >
            {items.map((item, i) => {
              const isSelected = i === selected;
              const distance = Math.abs(i - selected);
              const opacity =
                distance === 0
                  ? 1
                  : distance === 1
                    ? 0.55
                    : distance === 2
                      ? 0.3
                      : 0.12;
              const scale = distance === 0 ? 1 : distance === 1 ? 0.92 : 0.85;
              return (
                // Options follow the aria-activedescendant listbox pattern:
                // the listbox itself owns focus and keyboard handling, rows
                // are click-to-select only, so these two rules misfire here.
                // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus
                <div
                  key={item.id}
                  id={rowDomId(reelKey, item.id)}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => onSelect(i)}
                  className={[
                    "flex cursor-pointer items-center justify-center gap-1.5 px-3",
                    isSelected
                      ? "font-semibold text-foreground"
                      : "text-muted",
                  ].join(" ")}
                  style={{
                    height: ROW_H,
                    opacity,
                    transform: `scale(${scale})`,
                    backgroundColor: isSelected
                      ? `color-mix(in srgb, ${item.color} 14%, transparent)`
                      : undefined,
                  }}
                >
                  <span
                    aria-hidden
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{
                      backgroundColor: item.color,
                      boxShadow: isSelected ? `0 0 8px ${item.color}` : undefined,
                    }}
                  />
                  <span className="truncate text-[13px]">{item.label}</span>
                  {item.deprecated ? <DeprecatedPill /> : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Full-screen v4 landing and hub: three dependent slot-machine reels over the
 * ambient backdrop. Reel 1 picks a category, reel 2 an option inside it, reel
 * 3 the write-up behind that option. A result bar underneath is the plain,
 * fully accessible way to actually open whatever landed. Callers supply the
 * greeting line and the top-right action (log in, or the signed-in controls).
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

  const [catIndex, setCatIndex] = useState(0);
  const [optIndex, setOptIndex] = useState(0);
  const [thoughtIndex, setThoughtIndex] = useState(0);
  const [spinning, setSpinning] = useState(false);

  const timers = useRef<number[]>([]);
  useEffect(() => {
    const owned = timers;
    return () => owned.current.forEach((id) => window.clearTimeout(id));
  }, []);

  // Clamp everything on the way out so a stale index from a wider list can
  // never read past the end of a narrower one mid-transition.
  const category = categories[wrapIndex(catIndex, categories.length)];
  const options = category.options;
  const safeOptIndex = wrapIndex(Math.min(optIndex, options.length - 1), options.length);
  const option = options[safeOptIndex];
  const thoughts: SlotThought[] = option?.thoughts ?? [];
  const safeThoughtIndex = wrapIndex(
    Math.min(thoughtIndex, thoughts.length - 1),
    thoughts.length,
  );
  const thought = thoughts.length > 0 ? thoughts[safeThoughtIndex] : undefined;

  const selectCategory = (i: number) => {
    setCatIndex(i);
    setOptIndex(0);
    setThoughtIndex(0);
  };
  const selectOption = (i: number) => {
    setOptIndex(i);
    setThoughtIndex(0);
  };

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
      setCatIndex(catTarget);
      setOptIndex(optTarget);
      setThoughtIndex(noteTarget);
      return;
    }

    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    setSpinning(true);
    setOptIndex(0);
    setThoughtIndex(0);

    const schedule = (fn: () => void, at: number) => {
      timers.current.push(window.setTimeout(fn, at));
    };
    // Step a reel through a handful of intermediate rows with widening gaps,
    // so it reads as decelerating before it lands on the target.
    const runReel = (
      len: number,
      target: number,
      set: (i: number) => void,
      start: number,
    ): number => {
      const steps = Math.min(Math.max(len, 2), 8);
      let at = start;
      for (let j = 0; j < steps; j += 1) {
        at += 60 + j * 28;
        const value = wrapIndex(target - (steps - 1 - j), len);
        schedule(() => set(value), at);
      }
      return at;
    };

    let at = runReel(categories.length, catTarget, setCatIndex, 0);
    at = runReel(
      optList.length,
      optTarget,
      (i) => {
        setOptIndex(i);
        setThoughtIndex(0);
      },
      at + 140,
    );
    at = runReel(
      Math.max(noteList.length, 1),
      noteTarget,
      setThoughtIndex,
      at + 140,
    );
    schedule(() => setSpinning(false), at + 200);
  };

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
        className="absolute inset-0 flex flex-col items-center justify-center gap-4 overflow-y-auto px-4 pb-20 pt-24 sm:pt-28"
      >
        {/* The machine cabinet */}
        <div className="w-full max-w-3xl rounded-3xl border border-border bg-surface/40 p-3 shadow-2xl backdrop-blur-md sm:p-5">
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <Reel
              label="Category"
              reelKey="cat"
              items={categories}
              selected={wrapIndex(catIndex, categories.length)}
              spinning={spinning}
              reduced={reduced}
              onSelect={selectCategory}
            />
            <Reel
              label="Options"
              reelKey="opt"
              items={options}
              selected={safeOptIndex}
              spinning={spinning}
              reduced={reduced}
              onSelect={selectOption}
              onActivate={(i) => {
                const target = options[i];
                if (target) openHref(target.href, target.external);
              }}
            />
            <Reel
              label="Write-ups"
              reelKey="note"
              items={thoughts.map((t, i) => ({
                id: `${option?.id ?? "none"}-${i}`,
                label: t.title,
                color: t.color,
                ...(t.deprecated ? { deprecated: true } : {}),
              }))}
              selected={safeThoughtIndex}
              spinning={spinning}
              reduced={reduced}
              onSelect={setThoughtIndex}
              onActivate={(i) => {
                const target = thoughts[i];
                if (target) openHref(target.href);
              }}
              empty={
                <>
                  <p className="text-[13px] text-muted">No write-up yet</p>
                  <Link
                    href="/thoughts"
                    className="rounded text-[12px] text-muted underline underline-offset-2 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/60"
                  >
                    Browse all write-ups →
                  </Link>
                </>
              }
            />
          </div>

          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={spin}
              disabled={spinning}
              className="rounded-full border border-foreground/25 bg-foreground/10 px-10 py-3 text-sm font-bold uppercase tracking-[0.25em] text-foreground backdrop-blur-sm transition-[border-color,background-color] hover:border-foreground/40 hover:bg-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/60 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {spinning ? "Spinning…" : "Spin"}
            </button>
          </div>
        </div>

        {/* Result bar: the plain, keyboard-friendly way to open what landed. */}
        <div className="w-full max-w-3xl rounded-2xl border border-border bg-surface/70 px-4 py-3 backdrop-blur-md">
          <p className="text-sm">
            <span className="font-semibold" style={{ color: category.color }}>
              {category.label}
            </span>
            <span className="text-muted"> › </span>
            <span className="font-semibold" style={{ color: option?.color }}>
              {option?.label}
            </span>
          </p>
          {option?.blurb ? (
            <p className="mt-1 text-[13px] leading-relaxed text-muted">
              {option.blurb}
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] font-semibold">
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
        </div>

        {/* Announce the landed combo to screen readers without moving focus. */}
        <div aria-live="polite" className="sr-only">
          {status}
        </div>
      </main>

      {/* Interaction hint, purely visual */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-5 left-5 z-40 hidden sm:block"
      >
        <span className="rounded-full border border-border bg-surface/70 px-3 py-1 text-[11px] text-muted backdrop-blur">
          ↑ ↓ on a reel · Enter opens · Spin for luck
        </span>
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
