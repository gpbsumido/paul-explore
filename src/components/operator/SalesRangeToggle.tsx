"use client";

import type { SalesGranularity } from "@/lib/operator-sales";
import SegmentedControl from "./SegmentedControl";

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
    <SegmentedControl
      options={OPTIONS}
      value={value}
      onChange={onChange}
      ariaLabel={label}
    />
  );
}
