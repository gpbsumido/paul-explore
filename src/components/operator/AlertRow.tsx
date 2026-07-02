"use client";

import { formatDistanceToNow } from "date-fns";
import type { Alert } from "@/types/operator";
import SeverityBadge from "./SeverityBadge";
import AlertCategoryIcon from "./AlertCategoryIcon";

interface AlertRowProps {
  alert: Alert;
  onDismiss: (alertId: string) => void;
  isDismissing: boolean;
}

/**
 * Single alert row showing category icon, severity badge, message,
 * timestamp, and a dismiss button.
 */
export default function AlertRow({
  alert,
  onDismiss,
  isDismissing,
}: AlertRowProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-border bg-surface px-4 py-3">
      <AlertCategoryIcon category={alert.category} />
      <SeverityBadge severity={alert.severity} />

      <p className="min-w-0 flex-1 text-sm text-foreground">{alert.message}</p>

      <span className="shrink-0 text-xs text-muted">
        {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
      </span>

      <button
        onClick={() => onDismiss(alert.id)}
        disabled={isDismissing}
        className="shrink-0 rounded-md border border-border bg-surface-raised px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:text-foreground hover:border-foreground/20 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
      >
        {isDismissing ? "Dismissing..." : "Dismiss"}
      </button>
    </div>
  );
}
