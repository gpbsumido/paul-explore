"use client";

import type { ReactNode } from "react";
import { useHubReducedMotion } from "@/app/providers";

/**
 * OriginKit-style animated border: a conic gradient sweeps around the edge of
 * the card. Reimplemented on the tokens — the ring takes its colour from
 * `currentColor`, so set the wrapper's text colour (a team accent, a feature
 * token) to tint it. Under reduced motion the ring is a static gradient frame.
 */
export default function StarBorder({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduced = useHubReducedMotion();
  return (
    <div
      className={`motion-star-border ${reduced ? "motion-star-border--static" : ""} ${className}`.trim()}
    >
      <span aria-hidden="true" className="motion-star-border__ring" />
      <div className="motion-star-border__content">{children}</div>
    </div>
  );
}
