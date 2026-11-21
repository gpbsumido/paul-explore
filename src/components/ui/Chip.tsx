"use client";

import { type MouseEvent } from "react";
import { Chip as PaulChip } from "@paul-portfolio/react";

type BaseChipProps = {
  label: string;
  /** sm = compact (calendar cells), md = display (type badges) */
  size?: "sm" | "md";
  className?: string;
  title?: string;
};

type SpanChipProps = BaseChipProps & {
  /** Hex/CSS background color. The DS measures a readable label colour for it. */
  color?: string;
  /** Renders full-width as a block — useful inside calendar cells */
  fullWidth?: boolean;
  /** When provided the chip renders as a <button>. */
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  /** When provided, renders a remove button with an accessible name. */
  onRemove?: () => void;
  href?: undefined;
};

/**
 * A chip that links somewhere. It takes no click or remove handler, because
 * both would be a control nested inside a link, and it used to accept them and
 * then drop them without a word.
 */
type LinkChipProps = BaseChipProps & {
  /** External URLs open in a new tab. */
  href: string;
};

type ChipProps = SpanChipProps | LinkChipProps;

/**
 * App-level Chip backed by @paul-portfolio/react. Preserves the existing API so
 * every call site keeps working. The contrast-aware label colour the local Chip
 * used to compute now lives in the DS Chip itself, so no accessibility is lost.
 *
 * The DS Chip renders a span/button, not a link, so the one `href` use (a chip
 * that links to a PR) is rendered here as an anchor carrying the DS `.chip`
 * class — DS styling, link semantics. Everything else delegates to the DS Chip.
 */
export default function Chip(props: ChipProps) {
  if (props.href !== undefined) {
    const { href, size, className, title, label } = props;
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
  const { href: _href, ...rest } = props;
  return <PaulChip {...rest} />;
}
