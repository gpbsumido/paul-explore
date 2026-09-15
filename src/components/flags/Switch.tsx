"use client";

import { Switch as PaulSwitch } from "@paul-portfolio/react";

interface SwitchProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  /** Accessible name for the control. */
  label: string;
  disabled?: boolean;
}

/**
 * App-level Switch backed by @paul-portfolio/react. Preserves the existing
 * `{ checked, onChange, label }` API so the flags console keeps working, mapping
 * onChange to the DS `onCheckedChange` and the label to an aria-label (the DS
 * switch has no text of its own, same as the local one it replaces).
 */
export default function Switch({
  checked,
  onChange,
  label,
  disabled = false,
}: SwitchProps) {
  return (
    <PaulSwitch
      checked={checked}
      onCheckedChange={onChange}
      disabled={disabled}
      aria-label={label}
    />
  );
}
