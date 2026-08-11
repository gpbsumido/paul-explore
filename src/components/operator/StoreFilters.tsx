"use client";

import Input from "@/components/ui/Input";
import type { StoreFilterStatus } from "@/lib/operator-utils";

interface StoreFiltersProps {
  status: StoreFilterStatus;
  onStatusChange: (status: StoreFilterStatus) => void;
  search: string;
  onSearchChange: (search: string) => void;
}

const STATUS_OPTIONS: { value: StoreFilterStatus; label: string }[] = [
  { value: "all", label: "All" },
  // Mirrors the "Needs Attention" fleet tile, so clicking that number lands on
  // a filter the user can also see and clear here.
  { value: "needs-attention", label: "Needs attention" },
  { value: "online", label: "Online" },
  { value: "degraded", label: "Degraded" },
  { value: "offline", label: "Offline" },
];

/**
 * Filter bar with status toggles and a store name search box.
 */
export default function StoreFilters({
  status,
  onStatusChange,
  search,
  onSearchChange,
}: StoreFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      {/* Status filter pills */}
      <div
        className="flex gap-1.5"
        role="radiogroup"
        aria-label="Filter by status"
      >
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={status === opt.value}
            onClick={() => onStatusChange(opt.value)}
            className={`paul-touch-min rounded-lg px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 ${
              status === opt.value
                ? "bg-primary-600 text-white"
                : "bg-surface-raised text-muted hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Search box */}
      <div className="sm:ml-auto sm:w-56">
        <Input
          label="Search stores"
          hideLabel
          size="sm"
          placeholder="Search stores..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  );
}
