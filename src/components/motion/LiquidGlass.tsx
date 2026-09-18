"use client";

import { createElement, type ElementType, type ReactNode } from "react";
import { useHubReducedMotion } from "@/app/providers";

/**
 * iOS "Liquid Glass": a frosted, translucent surface with a specular highlight
 * that drifts across it. Built on the same glass tokens as `.glass-card` (tint
 * it with `--glass-accent`), with the drift being the new, liquid part. Under
 * reduced motion the sheen holds still and the frosted surface remains.
 */
export default function LiquidGlass({
  children,
  as,
  className = "",
}: {
  children: ReactNode;
  /** The element to render. Defaults to a div. */
  as?: ElementType;
  className?: string;
}) {
  const Tag = (as ?? "div") as ElementType;
  const reduced = useHubReducedMotion();
  return createElement(
    Tag,
    {
      className:
        `motion-liquid-glass ${reduced ? "motion-liquid-glass--static" : ""} ${className}`.trim(),
    },
    <span key="sheen" aria-hidden="true" className="motion-liquid-glass__sheen" />,
    <div key="content" className="motion-liquid-glass__content">
      {children}
    </div>,
  );
}
