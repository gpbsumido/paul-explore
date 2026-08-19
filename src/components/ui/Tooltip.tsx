"use client";

import { useId, type ReactNode, type CSSProperties } from "react";
import { useHoverPopover } from "@/hooks/useHoverPopover";

interface TooltipProps {
  /** Text shown in the floating label. */
  content: string;
  children: ReactNode;
  /**
   * How long to wait before showing, in ms. Keeps it from flashing
   * on accidental mouse-overs. Defaults to 500.
   */
  delay?: number;
  /**
   * Let the label wrap to multiple lines instead of staying on one. Use for
   * explanatory sentences; the default single-line style suits short labels.
   */
  multiline?: boolean;
}

/**
 * A styled tooltip that renders at a fixed screen position.
 *
 * Uses position:fixed + getBoundingClientRect so it punches through
 * overflow:hidden containers (the calendar grid, event chips, etc.)
 * without needing a portal. Shows after `delay` ms — short enough to
 * feel snappy, long enough not to fire on every mouse pass.
 */
export default function Tooltip({
  content,
  children,
  delay = 500,
  multiline = false,
}: TooltipProps) {
  const tooltipId = useId();
  const { visible, pos, triggerHandlers } = useHoverPopover({ delay });

  const style: CSSProperties = {
    position: "fixed",
    left: pos?.x ?? 0,
    top: (pos?.y ?? 0) - 8,
    transform: "translate(-50%, -100%)",
    zIndex: 9999,
    pointerEvents: "none",
  };

  return (
    <span
      className="inline-flex w-full h-full"
      {...triggerHandlers}
      aria-describedby={visible ? tooltipId : undefined}
    >
      {children}
      {visible && pos && (
        <div
          id={tooltipId}
          role="tooltip"
          style={style}
          className={`rounded-md bg-neutral-900 dark:bg-neutral-100 px-2.5 py-1.5 text-xs font-medium text-white dark:text-neutral-900 shadow-lg ${
            multiline
              ? "max-w-xs whitespace-normal text-left leading-snug"
              : "whitespace-nowrap"
          }`}
        >
          {content}
          {/* little arrow pointing down toward the chip */}
          <span
            className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-neutral-900 dark:border-t-neutral-100"
            aria-hidden="true"
          />
        </div>
      )}
    </span>
  );
}
