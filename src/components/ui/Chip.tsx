"use client";

import { type MouseEvent } from "react";
import { Chip as PaulChip } from "@paul-portfolio/react";

interface ChipProps {
  label: string;
  /** Hex/CSS background color. The DS measures a readable label colour for it. */
  color?: string;
  /** sm = compact (calendar cells), md = display (type badges) */
  size?: "sm" | "md";
  /** Renders full-width as a block — useful inside calendar cells */
  fullWidth?: boolean;
  /** When provided the chip renders as a <button>. */
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  /** When provided, renders a remove button with an accessible name. */
  onRemove?: () => void;
  /** When provided, the chip renders as a link. External URLs open in a new tab. */
  href?: string;
  className?: string;
  title?: string;
}

/**
 * App-level Chip backed by @paul-portfolio/react. Preserves the existing API so
 * every call site keeps working. The contrast-aware label colour the local Chip
 * used to compute now lives in the DS Chip itself, so no accessibility is lost.
 *
 * The DS Chip renders a span/button, not a link, so the one `href` use (a chip
 * that links to a PR) is rendered here as an anchor carrying the DS `.chip`
 * class — DS styling, link semantics. Everything else delegates to the DS Chip.
 */
export default function Chip({ href, size, className, title, label, ...rest }: ChipProps) {
  if (href) {
    const external = /^https?:\/\//.test(href);
    const classes = ["chip", size === "sm" && "chip--sm", "underline underline-offset-2", className]
      .filter(Boolean)
      .join(" ");
    return (
      <a
        href={href}
        title={title ?? label}
        className={classes}
        {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
      >
        {label}
      </a>
    );
  }
  return <PaulChip label={label} size={size} className={className} title={title} {...rest} />;
}
