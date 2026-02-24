"use client";

import { type CSSProperties, type MouseEvent } from "react";

interface ChipProps {
  label: string;
  /** Hex/CSS background color. When set, text is automatically white. */
  color?: string;
  /** sm = compact (calendar cells), md = display (type badges) */
  size?: "sm" | "md";
  /** Renders full-width as a block — useful inside calendar cells */
  fullWidth?: boolean;
  /**
   * When provided the chip renders as a <button>.
   * Receives the MouseEvent so callers can stopPropagation if needed.
   */
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  title?: string;
}

export default function Chip({
  label,
  color,
  size = "sm",
  fullWidth = false,
  onClick,
  className,
  title,
}: ChipProps) {
  const classes = [
    "text-xs truncate",
    size === "sm" ? "px-1.5 py-0.5 rounded" : "px-3 py-1 rounded-md",
    color ? "text-white" : "",
    fullWidth ? "w-full text-left block" : "inline-block",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const style: CSSProperties | undefined = color ? { backgroundColor: color } : undefined;

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={classes}
        style={style}
        title={title ?? label}
      >
        {label}
      </button>
    );
  }

  return (
    <span className={classes} style={style} title={title ?? label}>
      {label}
    </span>
  );
}
