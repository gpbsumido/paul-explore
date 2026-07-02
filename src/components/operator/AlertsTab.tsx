"use client";

import { useState, useMemo, useCallback } from "react";
import { useOperatorAlerts } from "@/hooks/useOperatorAlerts";
import { useDismissAlert } from "@/hooks/useOperatorMutations";
import {
  sortAlertsBySeverity,
  filterAlertsBySeverity,
  type AlertSeverityFilter,
} from "@/lib/operator-detail";
import AlertRow from "./AlertRow";

interface AlertsTabProps {
  storeId: string;
}

const SEVERITY_FILTERS: readonly {
  value: AlertSeverityFilter;
  label: string;
}[] = [
  { value: "all", label: "All" },
  { value: "critical", label: "Critical" },
  { value: "warning", label: "Warning" },
  { value: "info", label: "Info" },
] as const;

/**
 * Alerts tab content for the store detail page. Fetches alerts via the 15s
 * polling hook, sorts by severity, and supports filtering. Dismiss uses
 * the optimistic mutation so the alert vanishes immediately.
 */
export default function AlertsTab({ storeId }: AlertsTabProps) {
  const { alerts, loading, error } = useOperatorAlerts(storeId);
  const { dismissAlert } = useDismissAlert();
  const [severityFilter, setSeverityFilter] =
    useState<AlertSeverityFilter>("all");
  const [dismissingIds, setDismissingIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  const visibleAlerts = useMemo(() => {
    const filtered = filterAlertsBySeverity(alerts, severityFilter);
    return sortAlertsBySeverity(filtered);
  }, [alerts, severityFilter]);

  const handleDismiss = useCallback(
    (alertId: string) => {
      setDismissingIds((prev) => new Set([...prev, alertId]));
      dismissAlert({ alertId, storeId }).finally(() => {
        setDismissingIds((prev) => {
          const next = new Set(prev);
          next.delete(alertId);
          return next;
        });
      });
    },
    [dismissAlert, storeId],
  );

  if (error) {
    return <p className="text-sm text-error-500 py-4">{error}</p>;
  }

  if (loading && alerts.length === 0) {
    return <AlertsTabSkeleton />;
  }

  return (
    <div className="space-y-4">
      {/* Severity filter pills */}
      <div className="flex gap-1.5">
        {SEVERITY_FILTERS.map((f) => {
          const isActive = f.value === severityFilter;
          return (
            <button
              key={f.value}
              onClick={() => setSeverityFilter(f.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 ${
                isActive
                  ? "bg-foreground text-background"
                  : "bg-surface-raised text-muted hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Alert list or empty state */}
      {visibleAlerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface py-16 gap-3">
          <svg
            width="32"
            height="32"
            viewBox="0 0 16 16"
            fill="none"
            className="text-success-500"
          >
            <circle
              cx="8"
              cy="8"
              r="7"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M5 8l2 2 4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="text-sm font-medium text-foreground">All clear</p>
          <p className="text-xs text-muted">No active alerts for this store.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {visibleAlerts.map((alert) => (
            <AlertRow
              key={alert.id}
              alert={alert}
              onDismiss={handleDismiss}
              isDismissing={dismissingIds.has(alert.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

import Bone from "./Bone";

function AlertsTabSkeleton() {
  return (
    <div className="space-y-4">
      {/* Filter pills skeleton */}
      <div className="flex gap-1.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Bone key={i} style={{ height: 30, width: 64, borderRadius: 8 }} />
        ))}
      </div>

      {/* Row skeletons */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3"
        >
          <Bone style={{ height: 16, width: 16 }} />
          <Bone style={{ height: 20, width: 56, borderRadius: 999 }} />
          <Bone style={{ height: 14, width: 200, flex: 1 }} />
          <Bone style={{ height: 12, width: 72 }} />
          <Bone style={{ height: 28, width: 64, borderRadius: 6 }} />
        </div>
      ))}
    </div>
  );
}
