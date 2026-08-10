"use client";

import type { SalesGranularity } from "@/lib/operator-sales";

interface SalesRangeToggleProps {
  value: SalesGranularity;
  onChange: (granularity: SalesGranularity) => void;
  label?: string;
}

const OPTIONS: readonly { id: SalesGranularity; label: string }[] = [
  { id: "day", label: "Day" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "year", label: "Year" },
] as const;

/**
 * Segmented control for choosing the sales granularity. Each option is a
 * button with aria-pressed so it's announced as a toggle to assistive tech.
 */
export default function SalesRangeToggle({
  value,
  onChange,
  label = "Sales range",
}: SalesRangeToggleProps) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex rounded-lg border border-border bg-surface p-0.5"
    >
      {OPTIONS.map((option) => {
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
