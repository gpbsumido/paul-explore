"use client";

import Input from "@/components/ui/Input";
import type { StoreStatus } from "@/types/operator";

interface StoreFiltersProps {
  status: StoreStatus | "all";
  onStatusChange: (status: StoreStatus | "all") => void;
  search: string;
  onSearchChange: (search: string) => void;
}

const STATUS_OPTIONS: { value: StoreStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
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
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 ${
              status === opt.value
                ? "bg-primary-500 text-white"
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
