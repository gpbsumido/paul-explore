"use client";

import {
  useState,
  useRef,
  useCallback,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";

interface Point {
  x: number;
  y: number;
}

interface UseHoverPopoverOptions {
  /** How long to wait before showing, in ms. */
  delay: number;
  /**
   * Computes the popover anchor point from the trigger's bounding rect.
   * Defaults to the top-center of the trigger.
   */
  anchor?: (rect: DOMRect) => Point;
}

const topCenter = (rect: DOMRect): Point => ({
  x: rect.left + rect.width / 2,
  y: rect.top,
});

/**
 * The show/hide state machine shared by Tooltip and InfoTip. Shows after
 * `delay` ms on hover or focus, hides on leave, blur, or Escape, and tracks a
 * fixed-position anchor derived from the trigger's bounding rect. Callers own
 * their own JSX, classNames, and positioning style; this only drives when the
 * popover is visible and where it's anchored.
 */
export function useHoverPopover({
  delay,
  anchor = topCenter,
}: UseHoverPopoverOptions) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState<Point | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (rect: DOMRect) => {
      setPos(anchor(rect));
      timer.current = setTimeout(() => setVisible(true), delay);
    },
    [anchor, delay],
  );

  const hide = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setVisible(false);
  }, []);

  const triggerHandlers = {
    onMouseEnter: (e: ReactMouseEvent<HTMLElement>) =>
      show(e.currentTarget.getBoundingClientRect()),
    onMouseLeave: hide,
    onFocus: (e: FocusEvent<HTMLElement>) =>
      show(e.currentTarget.getBoundingClientRect()),
    onBlur: hide,
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
      if (e.key === "Escape" && visible) {
        e.preventDefault();
        hide();
      }
    },
  };

  return { visible, pos, show, hide, triggerHandlers };
}
