"use client";

import {
  getConnectionQuality,
  type ConnectionQuality as Quality,
} from "@/lib/operator-detail";
import { OfflineXIcon, SignalBarsIcon } from "./icons";

interface ConnectionQualityProps {
  lastPing: string;
}

const CONFIG: Record<
  Quality,
  { label: string; color: string; bars: number; offline: boolean }
> = {
  strong: {
    label: "Strong signal",
    color: "text-success-700 dark:text-success-500",
    bars: 3,
    offline: false,
  },
  weak: {
    label: "Weak signal",
    color: "text-warning-700 dark:text-warning-500",
    bars: 2,
    offline: false,
  },
  poor: {
    label: "Poor signal",
    color: "text-warning-700 dark:text-warning-500",
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
      {offline ? <OfflineXIcon /> : <SignalBarsIcon bars={bars} />}
      <span className="text-xs font-medium">{label}</span>
    </span>
  );
}
