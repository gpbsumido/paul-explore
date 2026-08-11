"use client";

import { formatDistanceToNow } from "date-fns";
import { isSensorOffline } from "@/lib/operator-freshness";
import { useLocaleDateTime } from "@/hooks/useLocaleDateTime";
import { WarningTriangleIcon } from "./icons";

interface SensorOfflineCalloutProps {
  lastPing: string;
}

/**
 * Warning callout shown on the inventory tab when the store's sensors haven't
 * reported in 30+ minutes.
 *
 * It used to say the duration was here so someone could dispatch a technician,
 * which the UI has no way to do. It now names the remedy that actually exists:
 * when the sensors are not reporting, a physical count is the only thing that
 * makes the numbers true again — and the restock flow to do that is on this
 * same tab, right below.
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
          Inventory data may be inaccurate. Last reading at {exactTime}. A
          physical count is the only thing that makes these numbers true again.
        </p>
      </div>
    </div>
  );
}
