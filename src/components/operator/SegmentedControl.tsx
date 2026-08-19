"use client";

interface SegmentedControlOption<T extends string> {
  readonly id: T;
  readonly label: string;
}

interface SegmentedControlProps<T extends string> {
  /** The selectable options, rendered left to right. */
  options: readonly SegmentedControlOption<T>[];
  /** The currently selected option id. */
  value: T;
  /** Called with the option id when a button is clicked. */
  onChange: (id: T) => void;
  /** Group label announced to assistive tech. */
  ariaLabel: string;
}

/**
 * A row of pill buttons acting as a single-choice toggle. Each button carries
 * aria-pressed so it's announced as a toggle, and the group has an aria-label.
 */
export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="inline-flex rounded-lg border border-border bg-surface p-0.5"
    >
      {options.map((option) => {
        const isActive = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(option.id)}
            className={`paul-touch-min rounded-md px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary-500 ${
              isActive
                ? "bg-primary-600 text-white"
                : "text-muted hover:text-foreground"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
