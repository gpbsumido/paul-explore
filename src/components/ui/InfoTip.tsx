"use client";

import { type ReactNode } from "react";
import { InfoTip as PaulInfoTip } from "@paul-portfolio/react";

interface InfoTipProps {
  children: ReactNode;
  /** Max width of the popover. Defaults to the DS default. */
  maxWidth?: number;
  /** Which side to show the popover. Defaults to "top". */
  side?: "top" | "bottom";
  /** Hover/focus delay in ms before showing. */
  delay?: number;
}

/**
 * App-level InfoTip backed by @paul-portfolio/react. Preserves the existing API
 * (children = the popover content). The DS InfoTip is built on the DS Tooltip,
 * so it still renders at a fixed position (never clipped), keeps the "More
 * information" accessible name, and is keyboard-focusable — no accessibility
 * lost. The trigger glyph moves from a <button> to a focusable role="img", which
 * is more honest: it reveals info, it doesn't perform an action.
 */
export default function InfoTip({
  children,
  maxWidth,
  side = "top",
  delay,
}: InfoTipProps) {
  return <PaulInfoTip content={children} side={side} maxWidth={maxWidth} delay={delay} />;
}
