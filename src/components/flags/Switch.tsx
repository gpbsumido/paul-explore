"use client";

interface SwitchProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  /** Accessible name for the control. */
  label: string;
  disabled?: boolean;
}

/**
 * An accessible on/off switch built on a native button with role="switch". The
 * button is fully keyboard operable, exposes aria-checked, and shows a visible
 * focus ring. The label is passed as aria-label so callers can place their own
 * visible text next to it.
 */
export default function Switch({
  checked,
  onChange,
  label,
  disabled = false,
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={[
        "touch-target relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500",
        "disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-success-500" : "bg-neutral-300 dark:bg-neutral-700",
      ].join(" ")}
    >
      <span
        aria-hidden
        className={[
          "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform motion-reduce:transition-none",
          checked ? "translate-x-6" : "translate-x-1",
        ].join(" ")}
      />
    </button>
  );
}
