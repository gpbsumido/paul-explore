"use client";

import {
  useState,
  useRef,
  useCallback,
  useId,
  type ReactNode,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
} from "react";

interface InfoTipProps {
  children: ReactNode;
  /** Max width of the popover. Defaults to 220px. */
  maxWidth?: number;
  /** Which side to show the popover. Defaults to "top". */
  side?: "top" | "bottom";
  /** Hover/focus delay in ms before showing. Defaults to 200. */
  delay?: number;
}

/**
 * A small ⓘ badge that shows a rich multi-line popover on hover/focus.
 * Uses position:fixed + getBoundingClientRect so it punches through
 * overflow:hidden containers the same way Tooltip does.
 */
export default function InfoTip({
  children,
  maxWidth = 220,
  side = "top",
  delay = 200,
}: InfoTipProps) {
  const tooltipId = useId();
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (rect: DOMRect) => {
      setPos({
        x: rect.left + rect.width / 2,
        y: side === "top" ? rect.top : rect.bottom,
      });
      timer.current = setTimeout(() => setVisible(true), delay);
    },
    [side, delay],
  );

  const hide = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setVisible(false);
  }, []);

  const handleEnter = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      show(e.currentTarget.getBoundingClientRect());
    },
    [show],
  );

  const handleFocus = useCallback(
    (e: FocusEvent<HTMLButtonElement>) => {
      show(e.currentTarget.getBoundingClientRect());
    },
    [show],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === "Escape" && visible) {
        e.preventDefault();
        hide();
      }
    },
    [hide, visible],
  );

  const style: CSSProperties =
    side === "top"
      ? {
          position: "fixed",
          left: pos?.x ?? 0,
          top: (pos?.y ?? 0) - 8,
          transform: "translate(-50%, -100%)",
          zIndex: 9999,
          pointerEvents: "none",
          maxWidth,
          width: "max-content",
        }
      : {
          position: "fixed",
          left: pos?.x ?? 0,
          top: (pos?.y ?? 0) + 8,
          transform: "translate(-50%, 0)",
          zIndex: 9999,
          pointerEvents: "none",
          maxWidth,
          width: "max-content",
        };

  return (
    <button
      type="button"
      className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-border text-muted text-[9px] font-semibold cursor-help select-none shrink-0 hover:border-foreground hover:text-foreground transition-colors bg-transparent p-0"
      onMouseEnter={handleEnter}
      onMouseLeave={hide}
      onFocus={handleFocus}
      onBlur={hide}
      onKeyDown={handleKeyDown}
      aria-label="More information"
      aria-describedby={visible ? tooltipId : undefined}
    >
      i
      {visible && pos && (
        <span
          id={tooltipId}
          role="tooltip"
          style={style}
          className="rounded-lg bg-neutral-900 dark:bg-neutral-800 text-white text-[11px] leading-relaxed px-3 py-2 shadow-lg"
        >
          {side === "bottom" && (
            <span
              className="absolute left-1/2 bottom-full -translate-x-1/2 border-[5px] border-transparent border-b-neutral-900 dark:border-b-neutral-800"
              aria-hidden="true"
            />
          )}
          {children}
          {side === "top" && (
            <span
              className="absolute left-1/2 top-full -translate-x-1/2 border-[5px] border-transparent border-t-neutral-900 dark:border-t-neutral-800"
              aria-hidden="true"
            />
          )}
        </span>
      )}
    </button>
  );
}
