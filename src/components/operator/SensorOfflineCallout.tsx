"use client";

import { formatDistanceToNow } from "date-fns";
import { isSensorOffline } from "@/lib/operator-freshness";

interface SensorOfflineCalloutProps {
  lastPing: string;
}

/**
 * Warning callout shown on the inventory tab when the store's sensors
 * haven't reported in 30+ minutes. Displays how long the sensor has
 * been offline so operators can dispatch a technician.
 */
export default function SensorOfflineCallout({
  lastPing,
}: SensorOfflineCalloutProps) {
  if (!isSensorOffline(lastPing)) return null;

  const date = new Date(lastPing);

  return (
    <div className="flex items-start gap-3 rounded-lg border border-warning-400/40 bg-warning-500/10 px-4 py-3">
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="currentColor"
        className="mt-0.5 shrink-0 text-warning-600"
        aria-hidden
      >
        <path d="M8 1a1 1 0 0 1 .867.5l6.062 10.5A1 1 0 0 1 14.062 13.5H1.938a1 1 0 0 1-.867-1.5L7.133 1.5A1 1 0 0 1 8 1Zm0 4.5a.75.75 0 0 0-.75.75v2.5a.75.75 0 0 0 1.5 0v-2.5A.75.75 0 0 0 8 5.5ZM8 11a.75.75 0 1 0 0-1.5A.75.75 0 0 0 8 11Z" />
      </svg>
      <div className="text-sm">
        <p className="font-medium text-warning-700 dark:text-warning-400">
          Sensor offline since {formatDistanceToNow(date, { addSuffix: true })}
        </p>
        <p className="text-muted text-xs mt-0.5">
          Inventory data may be inaccurate. Last reading at{" "}
          {date.toLocaleString()}.
        </p>
      </div>
    </div>
  );
}
