"use client";

import { memo, useState } from "react";
import type { CSSProperties, MouseEvent } from "react";
import type { CalendarEvent } from "@/types/calendar";
import { Tooltip } from "@/components/ui";

interface EventChipProps {
  event: CalendarEvent;
  onClick: () => void;
  /**
   * Fills the height of its absolutely-positioned container — used in the
   * time grid so the chip spans the event's full duration visually.
   */
  block?: boolean;
  /**
   * Non-start days of a multi-day event in the month grid. Drops the left
   * border stripe and uses a slightly more filled background so the event
   * reads as a continuation bar, not a new event starting on that day.
   */
  continuation?: boolean;
}

/**
 * Event chip with three visual variants:
 *
 * - default: stripe-style — 3px colored left border + faint translucent fill,
 *   used in month grid cells where chips sit on an opaque background
 * - `block`: same translucent stripe style at rest, goes solid (full event color,
 *   white text) on hover — keeps the grid readable without hiding which events
 *   are below, but lets you clearly identify any one on mouse-over
 * - `continuation`: flat bar for non-start days of multi-day events in month
 *   view — no border stripe, slightly more filled fill
 *
 * Tooltip uses the Tooltip primitive (fixed position) so it escapes
 * overflow:hidden containers without needing a portal.
 */
function EventChip({
  event,
  onClick,
  block = false,
  continuation = false,
}: EventChipProps) {
  const [hovered, setHovered] = useState(false);

  const style: CSSProperties = block
    ? {
        borderLeftColor: event.color,
        backgroundColor: hovered ? event.color : `${event.color}18`,
        // smoothly cross-fade text color so it stays readable at every point
        // in the hover transition
        color: hovered ? "white" : undefined,
        transition: "background-color 150ms ease, color 150ms ease",
      }
    : continuation
      ? { backgroundColor: `${event.color}28` }
      : { borderLeftColor: event.color, backgroundColor: `${event.color}18` };

  return (
    <Tooltip content={event.title} delay={500}>
      <button
        type="button"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={(e: MouseEvent<HTMLButtonElement>) => {
          e.stopPropagation();
          onClick();
        }}
        className={[
          "w-full text-left text-xs font-medium px-2 py-0.5 text-foreground border-l-[3px] rounded-r-sm rounded-l-none",
          block ? "h-full truncate overflow-hidden" : "block truncate mb-0.5 hover:opacity-75 transition-opacity",
          continuation && "rounded-sm opacity-80",
        ]
          .filter(Boolean)
          .join(" ")}
        style={style}
      >
        {event.title}
      </button>
    </Tooltip>
  );
}

// There can be a lot of these on screen at once (month grid with many events).
// Skipping re-renders when the event data and callbacks haven't changed is worth it.
export default memo(EventChip);
