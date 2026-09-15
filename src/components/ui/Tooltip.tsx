"use client";

import { type ReactNode } from "react";
import { Tooltip as PaulTooltip } from "@paul-portfolio/react";

interface TooltipProps {
  /** Text shown in the floating label. */
  content: string;
  children: ReactNode;
  /** How long to wait before showing, in ms. Defaults to 500. */
  delay?: number;
  /** Let the label wrap to multiple lines instead of staying on one. */
  multiline?: boolean;
}

/**
 * App-level Tooltip backed by @paul-portfolio/react. The DS tooltip renders at a
 * fixed position too, so it still punches through overflow:hidden ancestors (the
 * calendar grid). `fill` reproduces the local anchor's full-size behaviour so a
 * grid cell isn't collapsed to content width, and `multiline` maps to a bounded
 * width. The old CSS arrow is gone — decorative only, no accessibility lost.
 */
export default function Tooltip({
  content,
  children,
  delay = 500,
  multiline = false,
}: TooltipProps) {
  return (
    <PaulTooltip content={content} delay={delay} fill maxWidth={multiline ? 288 : undefined}>
      {children}
    </PaulTooltip>
  );
}
