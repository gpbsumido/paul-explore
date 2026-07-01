"use client";

import {
  getConnectionQuality,
  type ConnectionQuality as Quality,
} from "@/lib/operator-detail";

interface ConnectionQualityProps {
  lastPing: string;
}

const CONFIG: Record<
  Quality,
  { label: string; color: string; bars: number; offline: boolean }
> = {
  strong: {
    label: "Strong signal",
    color: "text-success-500",
    bars: 3,
    offline: false,
  },
  weak: {
    label: "Weak signal",
    color: "text-warning-500",
    bars: 2,
    offline: false,
  },
  poor: {
    label: "Poor signal",
    color: "text-warning-600",
    bars: 1,
    offline: false,
  },
  offline: {
    label: "Offline",
    color: "text-error-500",
    bars: 0,
    offline: true,
  },
};

/**
 * Signal strength indicator. 3 bars = strong, 2 = weak, 1 = poor, X = offline.
 * Thresholds: strong <2 min, weak 2-5 min, poor 5-10 min, offline >10 min.
 */
export default function ConnectionQuality({
  lastPing,
}: ConnectionQualityProps) {
  const quality = getConnectionQuality(lastPing);
  const { label, color, bars, offline } = CONFIG[quality];

  return (
    <span className={`inline-flex items-center gap-1.5 ${color}`} title={label}>
      {offline ? (
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden
        >
          <path d="M4 4l8 8M12 4l-8 8" />
        </svg>
      ) : (
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="currentColor"
          aria-hidden
        >
          <rect
            x="1"
            y="11"
            width="3"
            height="4"
            rx="0.5"
            opacity={bars >= 1 ? 1 : 0.2}
          />
          <rect
            x="6"
            y="7"
            width="3"
            height="8"
            rx="0.5"
            opacity={bars >= 2 ? 1 : 0.2}
          />
          <rect
            x="11"
            y="3"
            width="3"
            height="12"
            rx="0.5"
            opacity={bars >= 3 ? 1 : 0.2}
          />
        </svg>
      )}
      <span className="text-xs font-medium">{label}</span>
    </span>
  );
}
