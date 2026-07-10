"use client";

import {
  useState,
  useRef,
  useCallback,
  useId,
  type ReactNode,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type FocusEvent,
  type KeyboardEvent,
} from "react";

interface TooltipProps {
  /** Text shown in the floating label. */
  content: string;
  children: ReactNode;
  /**
   * How long to wait before showing, in ms. Keeps it from flashing
   * on accidental mouse-overs. Defaults to 500.
   */
  delay?: number;
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
}: TooltipProps) {
  const tooltipId = useId();
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLSpanElement>(null);

  const show = useCallback(
    (rect: DOMRect) => {
      setPos({ x: rect.left + rect.width / 2, y: rect.top });
      timer.current = setTimeout(() => setVisible(true), delay);
    },
    [delay],
  );

  const hide = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setVisible(false);
  }, []);

  const handleEnter = useCallback(
    (e: ReactMouseEvent<HTMLSpanElement>) => {
      show(e.currentTarget.getBoundingClientRect());
    },
    [show],
  );

  const handleFocus = useCallback(
    (e: FocusEvent<HTMLSpanElement>) => {
      show(e.currentTarget.getBoundingClientRect());
    },
    [show],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLSpanElement>) => {
      if (e.key === "Escape" && visible) {
        e.preventDefault();
        hide();
      }
    },
    [hide, visible],
  );

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
      ref={wrapperRef}
      className="inline-flex w-full h-full"
      onMouseEnter={handleEnter}
      onMouseLeave={hide}
      onFocus={handleFocus}
      onBlur={hide}
      onKeyDown={handleKeyDown}
      aria-describedby={visible ? tooltipId : undefined}
    >
      {children}
      {visible && pos && (
        <div
          id={tooltipId}
          role="tooltip"
          style={style}
          className="rounded-md bg-neutral-900 dark:bg-neutral-100 px-2.5 py-1.5 text-xs font-medium text-white dark:text-neutral-900 shadow-lg whitespace-nowrap"
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
