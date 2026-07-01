"use client";

import {
  getConnectionQuality,
  type ConnectionQuality as Quality,
} from "@/lib/operator-detail";

interface ConnectionQualityProps {
  lastPing: string;
}

const CONFIG: Record<Quality, { label: string; color: string; bars: number }> =
  {
    strong: { label: "Strong signal", color: "text-success-500", bars: 3 },
    weak: { label: "Weak signal", color: "text-warning-500", bars: 2 },
    offline: { label: "Offline", color: "text-error-500", bars: 1 },
  };

/**
 * Signal strength indicator showing 1-3 bars based on how recently the
 * store's sensors reported in. Uses the same thresholds as FreshnessLabel
 * (2 min = weak, 5 min = offline).
 */
export default function ConnectionQuality({
  lastPing,
}: ConnectionQualityProps) {
  const quality = getConnectionQuality(lastPing);
  const { label, color, bars } = CONFIG[quality];

  return (
    <span className={`inline-flex items-center gap-1.5 ${color}`} title={label}>
      <svg
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="currentColor"
        aria-hidden
      >
        {/* bar 1 (always filled) */}
        <rect
          x="1"
          y="11"
          width="3"
          height="4"
          rx="0.5"
          opacity={bars >= 1 ? 1 : 0.2}
        />
        {/* bar 2 */}
        <rect
          x="6"
          y="7"
          width="3"
          height="8"
          rx="0.5"
          opacity={bars >= 2 ? 1 : 0.2}
        />
        {/* bar 3 */}
        <rect
          x="11"
          y="3"
          width="3"
          height="12"
          rx="0.5"
          opacity={bars >= 3 ? 1 : 0.2}
        />
      </svg>
      <span className="text-xs font-medium">{label}</span>
    </span>
  );
}
