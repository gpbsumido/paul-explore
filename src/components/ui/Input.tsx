"use client";

import { type ComponentPropsWithRef, useId } from "react";
import { LABEL_CLASS, fieldClass, buildDescribedBy } from "./styles";

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

  const describedBy = buildDescribedBy(error ? errorId : null, helperText ? helperId : null);

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className={hideLabel ? "sr-only" : LABEL_CLASS}
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
        className={fieldClass(error, size === "sm" ? "py-1" : "py-2")}
      />

      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-error-600 dark:text-error-500" role="alert">
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
