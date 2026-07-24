"use client";

import { type ComponentPropsWithRef } from "react";
import { Select as PaulSelect } from "@paul-portfolio/react";

interface SelectProps extends Omit<ComponentPropsWithRef<"select">, "size"> {
  /** Visible label text and the select's accessible name */
  label: string;
}

/**
 * App-level filter Select backed by @paul-portfolio/react.
 * Defaults to the inline (horizontal) orientation the fantasy filter bars use,
 * so it drops straight into a FilterBar row. Replaces the old LabelledSelect.
 */
export default function Select({ label, className, ref, ...rest }: SelectProps) {
  return (
    <PaulSelect
      ref={ref}
      label={label}
      orientation="horizontal"
      className={className}
      {...rest}
    />
  );
}
