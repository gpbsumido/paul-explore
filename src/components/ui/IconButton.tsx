"use client";

import { type ComponentPropsWithRef } from "react";

interface IconButtonProps extends ComponentPropsWithRef<"button"> {
  /** Required: describes the action for screen readers */
  "aria-label": string;
  size?: "sm" | "md";
}

export default function IconButton({
  size = "md",
  className,
  children,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      className={[
        "inline-flex items-center justify-center rounded-md",
        "text-muted hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800",
        "transition-colors cursor-pointer",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500",
        "disabled:pointer-events-none disabled:opacity-50",
        size === "sm" ? "h-7 w-7" : "h-8 w-8",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </button>
  );
}
