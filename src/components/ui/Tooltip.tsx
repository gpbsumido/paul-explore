"use client";

import {
  useState,
  useRef,
  useCallback,
  type ReactNode,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
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
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleEnter = useCallback(
    (e: ReactMouseEvent<HTMLSpanElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      setPos({ x: rect.left + rect.width / 2, y: rect.top });
      timer.current = setTimeout(() => setVisible(true), delay);
    },
    [delay],
  );

  const handleLeave = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setVisible(false);
    // keep pos so there's no jump if the timer fires slightly late
  }, []);

  const style: CSSProperties = {
    position: "fixed",
    left: pos?.x ?? 0,
    top: (pos?.y ?? 0) - 8,
    transform: "translate(-50%, -100%)",
    zIndex: 9999,
    pointerEvents: "none",
  };

  return (
    <span className="inline-flex w-full" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      {children}
      {visible && pos && (
        <div
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
