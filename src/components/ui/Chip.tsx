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
  /** When provided, renders a remove button with an accessible name. */
  onRemove?: () => void;
  className?: string;
  title?: string;
}

export default function Chip({
  label,
  color,
  size = "sm",
  fullWidth = false,
  onClick,
  onRemove,
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

  const style: CSSProperties | undefined = color
    ? { backgroundColor: color }
    : undefined;

  const removeButton = onRemove ? (
    <button
      type="button"
      onClick={onRemove}
      className="ml-1 inline-flex items-center opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
      aria-label={`Remove ${label}`}
    >
      <svg
        className="h-3 w-3"
        viewBox="0 0 12 12"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M3.17 3.17a.75.75 0 011.06 0L6 4.94l1.77-1.77a.75.75 0 111.06 1.06L7.06 6l1.77 1.77a.75.75 0 11-1.06 1.06L6 7.06 4.23 8.83a.75.75 0 01-1.06-1.06L4.94 6 3.17 4.23a.75.75 0 010-1.06z" />
      </svg>
    </button>
  ) : null;

  if (onClick) {
    return (
      <span
        className="inline-flex items-center"
        style={style}
        title={title ?? label}
      >
        <button
          type="button"
          onClick={onClick}
          className={classes}
          style={undefined}
        >
          {label}
        </button>
        {removeButton}
      </span>
    );
  }

  return (
    <span
      className={[classes, onRemove ? "inline-flex items-center" : ""]
        .filter(Boolean)
        .join(" ")}
      style={style}
      title={title ?? label}
    >
      {label}
      {removeButton}
    </span>
  );
}
