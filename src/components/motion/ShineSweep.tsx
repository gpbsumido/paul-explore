"use client";

import { createElement, type ElementType, type ReactNode } from "react";
import { useHubReducedMotion } from "@/app/providers";

/**
 * OriginKit-style shine: a specular bar sweeps diagonally across the element,
 * the way a highlight travels over glossy hardware. Wrap a button or a badge in
 * it. Under reduced motion the sheen isn't rendered at all.
 */
export default function ShineSweep({
  children,
  as,
  className = "",
}: {
  children: ReactNode;
  /** The element to render. Defaults to a span. */
  as?: ElementType;
  className?: string;
}) {
  const Tag = (as ?? "span") as ElementType;
  const reduced = useHubReducedMotion();
  return createElement(
    Tag,
    { className: `relative inline-flex overflow-hidden ${className}`.trim() },
    children,
    reduced ? null : (
      <span key="sheen" aria-hidden="true" className="motion-shine" />
    ),
  );
}
