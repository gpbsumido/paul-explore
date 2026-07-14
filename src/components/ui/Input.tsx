"use client";

import { type ComponentPropsWithRef, useId } from "react";
import { Input as PaulInput } from "@paul-portfolio/react";

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

/**
 * App-level Input backed by @paul-portfolio/react.
 * Preserves the existing API (label, hideLabel, helperText, error, size).
 */
export default function Input({
  label,
  hideLabel = false,
  size = "md",
  error,
  helperText,
  required,
  className,
  ref,
  ...rest
}: InputProps) {
  const id = useId();

  if (hideLabel) {
    return (
      <div className={className}>
        <label htmlFor={id} className="sr-only">
          {label}
        </label>
        <PaulInput
          ref={ref}
          label={undefined}
          error={error}
          helper={helperText}
          size={size}
          aria-label={label}
          required={required}
          {...rest}
        />
      </div>
    );
  }

  return (
    <div className={className}>
      <PaulInput
        ref={ref}
        label={required ? `${label} *` : label}
        error={error}
        helper={helperText}
        size={size}
        required={required}
        {...rest}
      />
    </div>
  );
}
