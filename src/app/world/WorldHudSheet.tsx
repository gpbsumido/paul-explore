"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { GLASS_STYLE } from "./glass";

// On a wide screen the HUD rail lives down the right edge and everything fits.
// On a phone that rail is half the screen and lands right on top of the exhibit
// placard, so here it becomes a sheet: one toggle in the top-right corner, the
// whole rail slides in over the city, tap anywhere else to get back to walking.
//
// The split is done with `max-md:` classes rather than a media-query hook on
// purpose — the server has no viewport, so anything hook-driven would hydrate
// into a different layout than it rendered. CSS just gets it right.

const PANEL_ID = "world-hud-panel";

type WorldHudSheetProps = {
  /** The floating site menu, which shares the phone's top-right corner. */
  readonly menu: ReactNode;
  /** Short status line kept visible on the toggle, e.g. "🪙 3/25 · 12%". */
  readonly summary: string;
  /** Photo mode wants a bare screen, so the toggle steps aside. */
  readonly hidden?: boolean;
  /** The HUD rail itself. */
  readonly children: ReactNode;
};

/**
 * Wraps the world's HUD rail so phones can tuck it behind a single toggle while
 * wider screens keep showing it exactly as before.
 */
export default function WorldHudSheet({
  menu,
  summary,
  hidden = false,
  children,
}: WorldHudSheetProps) {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const expanded = open && !hidden;

  // Escape is the other way out, and it puts focus back where it came from.
  useEffect(() => {
    if (!expanded) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      toggleRef.current?.focus();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [expanded]);

  return (
    <>
      {/* `contents` means this wrapper only exists on phones — on wider screens
          the nav keeps positioning itself against <main> like it always has. */}
      <div className="contents max-md:absolute max-md:right-4 max-md:top-4 max-md:z-50 max-md:flex max-md:items-center max-md:gap-2">
        {menu}
        {!hidden && (
          <button
            ref={toggleRef}
            type="button"
            onClick={() => setOpen((wasOpen) => !wasOpen)}
            aria-expanded={expanded}
            aria-controls={PANEL_ID}
            aria-label={expanded ? "Close world settings" : "World settings"}
            className="hidden h-10 items-center gap-1.5 rounded-2xl px-3 text-[11px] font-semibold text-white/75 max-md:flex"
            style={GLASS_STYLE}
          >
            <span>{summary}</span>
            <span aria-hidden className="text-[13px] leading-none">
              {expanded ? "✕" : "⚙"}
            </span>
          </button>
        )}
      </div>

      {/* Tapping the city closes the sheet. No focus trap: the world is still
          right there behind it, and the toggle stays on top as the visible exit. */}
      {expanded && (
        <div
          data-testid="world-hud-backdrop"
          aria-hidden
          onClick={() => setOpen(false)}
          className="absolute inset-0 z-30 bg-black/40 md:hidden"
        />
      )}

      <div
        id={PANEL_ID}
        className={`contents max-md:absolute max-md:inset-y-0 max-md:right-0 max-md:z-40 max-md:block max-md:w-[17rem] max-md:max-w-[85vw] max-md:overflow-y-auto max-md:overscroll-contain max-md:rounded-l-2xl max-md:p-3 max-md:pt-16 max-md:transition-transform ${
          expanded ? "" : "max-md:invisible max-md:translate-x-full"
        }`}
        style={expanded ? GLASS_STYLE : undefined}
      >
        {children}
      </div>
    </>
  );
}
