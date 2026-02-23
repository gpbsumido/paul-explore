"use client";

import { type ComponentPropsWithRef, useId } from "react";

interface InputProps extends Omit<ComponentPropsWithRef<"input">, "id" | "size"> {
  /** Visible label text */
  label: string;
  /** Visually hide the label while keeping it accessible */
  hideLabel?: boolean;
  /** sm = h-8 (compact/inline), md = h-10 (default form field) */
  size?: "sm" | "md";
  /** Error message (renders in error state when provided) */
  error?: string;
  /** Helper text shown below the input */
  helperText?: string;
}

export default function Input({
  label,
  hideLabel = false,
  size = "md",
  error,
  helperText,
  required,
  className,
  ...rest
}: InputProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const helperId = `${id}-helper`;

  const describedBy =
    [error ? errorId : null, helperText ? helperId : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className={
          hideLabel
            ? "sr-only"
            : "block text-sm font-medium text-foreground mb-1.5"
        }
      >
        {label}
        {required && (
          <span className="text-error-500 ml-0.5" aria-hidden="true">
            *
          </span>
        )}
      </label>

      <input
        {...rest}
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={[
          "block w-full rounded-lg border px-3 text-sm",
          size === "sm" ? "py-1" : "py-2",
          "bg-surface text-foreground placeholder:text-muted",
          "transition-colors",
          "focus:outline-2 focus:outline-offset-0 focus:outline-primary-500 focus:border-primary-500",
          error
            ? "border-error-500 focus:outline-error-500 focus:border-error-500"
            : "border-border",
          "disabled:opacity-50 disabled:cursor-not-allowed",
        ]
          .filter(Boolean)
          .join(" ")}
      />

      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-error-600" role="alert">
          {error}
        </p>
      )}

      {helperText && !error && (
        <p id={helperId} className="mt-1.5 text-sm text-muted">
          {helperText}
        </p>
      )}
    </div>
  );
}
