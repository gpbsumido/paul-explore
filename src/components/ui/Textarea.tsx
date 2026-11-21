"use client";

import { type ComponentPropsWithRef } from "react";
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
 * set — the behaviour the local version had automatically. The package owns
 * the hidden label and the required marker, so both pass straight through.
 */
export default function Textarea({
  label,
  hideLabel = false,
  error,
  helperText,
  maxLength,
  className,
  ref,
  ...rest
}: TextareaProps) {
  return (
    <div className={className}>
      <PaulTextarea
        ref={ref}
        label={label}
        hideLabel={hideLabel}
        error={error}
        helper={helperText}
        maxLength={maxLength}
        showCount={maxLength != null}
        {...rest}
      />
    </div>
  );
}
