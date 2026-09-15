"use client";

import { type ComponentPropsWithRef, useId } from "react";
import { Textarea as PaulTextarea } from "@paul-portfolio/react";

interface TextareaProps extends Omit<
  ComponentPropsWithRef<"textarea">,
  "id"
> {
  /** Visible label text */
  label: string;
  /** Visually hide the label while keeping it accessible */
  hideLabel?: boolean;
  /** Error message (renders in error state when provided) */
  error?: string;
  /** Helper text shown below the field */
  helperText?: string;
}

/**
 * App-level Textarea backed by @paul-portfolio/react.
 * Preserves the existing API (label, hideLabel, helperText, error) and keeps the
 * live character counter by turning on the DS `showCount` whenever maxLength is
 * set — the behaviour the local version had automatically.
 */
export default function Textarea({
  label,
  hideLabel = false,
  error,
  helperText,
  required,
  maxLength,
  className,
  ref,
  ...rest
}: TextareaProps) {
  const id = useId();

  if (hideLabel) {
    return (
      <div className={className}>
        <label htmlFor={id} className="sr-only">
          {label}
        </label>
        <PaulTextarea
          ref={ref}
          label={undefined}
          error={error}
          helper={helperText}
          maxLength={maxLength}
          showCount={maxLength != null}
          aria-label={label}
          required={required}
          {...rest}
        />
      </div>
    );
  }

  return (
    <div className={className}>
      <PaulTextarea
        ref={ref}
        label={required ? `${label} *` : label}
        error={error}
        helper={helperText}
        maxLength={maxLength}
        showCount={maxLength != null}
        required={required}
        {...rest}
      />
    </div>
  );
}
