"use client";

import type { ReactNode } from "react";

interface ChartBarProps {
  /** What this bar is worth, shown on hover and focus. */
  label: string;
  children: ReactNode;
  className?: string;
}

/**
 * A bar you can hover to read.
 *
 * The charts drawn with divs had no way to get a number out of them. You could
 * see that one month was taller than another and never find out by how much,
 * which makes a chart decorative rather than useful: the shape is the summary
 * and the value is the answer. The Recharts ones already had tooltips, so the
 * hand-rolled ones were quietly the weaker half of the same dashboard.
 *
 * Deliberately not focusable. Making every bar a tab stop would add seven to
 * twelve of them per chart, which is a real cost to anyone navigating by
 * keyboard, and it buys nothing they do not already have: each chart carries a
 * screen-reader list of the same values right beside it. So the tooltip is a
 * mouse affordance layered on top of an accessible path that already existed,
 * rather than the only way to read the number.
 */
export default function ChartBar({
  label,
  children,
  className = "",
}: ChartBarProps) {
  return (
    <div
      className={`group relative flex flex-1 flex-col items-center gap-1 ${className}`}
      role="img"
      aria-label={label}
    >
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full z-10 mb-1 hidden whitespace-nowrap rounded-md border border-border bg-surface px-2 py-1 text-[11px] font-medium text-foreground shadow-sm group-hover:block"
      >
        {label}
      </span>
      {children}
    </div>
  );
}
