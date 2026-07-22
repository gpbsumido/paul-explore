"use client";

import { formatDistanceToNow } from "date-fns";
import { isSensorOffline } from "@/lib/operator-freshness";
import { useLocaleDateTime } from "@/hooks/useLocaleDateTime";
import { WarningTriangleIcon } from "./icons";

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
  // Called before the early return so the hook order stays stable.
  const exactTime = useLocaleDateTime(lastPing);
  if (!isSensorOffline(lastPing)) return null;

  const date = new Date(lastPing);

  return (
    <div className="flex items-start gap-3 rounded-lg border border-warning-400/40 bg-warning-500/10 px-4 py-3">
      <WarningTriangleIcon className="mt-0.5 shrink-0 text-warning-700 dark:text-warning-500" />
      <div className="text-sm">
        <p className="font-medium text-warning-700 dark:text-warning-400">
          Sensor offline since {formatDistanceToNow(date, { addSuffix: true })}
        </p>
        <p className="text-muted text-xs mt-0.5">
          Inventory data may be inaccurate. Last reading at{" "}
          {exactTime}.
        </p>
      </div>
    </div>
  );
}
