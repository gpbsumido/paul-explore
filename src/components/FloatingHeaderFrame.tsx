"use client";

import { useEffect, useState, type ReactNode } from "react";

/** How far the page scrolls before the bar lifts into the floating pill. */
const FLOAT_AFTER_PX = 24;

type Props = {
  as: "nav" | "header";
  className: string;
  ariaLabel?: string;
  children: ReactNode;
};

/**
 * The element PageHeader renders, plus the one bit of state it needs: whether
 * the page has scrolled. Everything visual hangs off `data-floating` in CSS, so
 * this stays the only client code in the header and PageHeader itself can keep
 * rendering in server pages.
 *
 * A passive scroll listener that only sets state when the threshold is crossed,
 * so scrolling through a long page re-renders this twice, not every frame.
 */
export default function FloatingHeaderFrame({
  as: Tag,
  className,
  ariaLabel,
  children,
}: Props) {
  const [isFloating, setIsFloating] = useState(false);

  useEffect(() => {
    // No call on mount: setState inside an effect body is lint-blocked here, and
    // a restored scroll position fires its own scroll event anyway.
    const update = () => setIsFloating(window.scrollY > FLOAT_AFTER_PX);
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <Tag
      aria-label={ariaLabel}
      data-floating={isFloating ? "true" : "false"}
      className={className}
    >
      {children}
    </Tag>
  );
}
