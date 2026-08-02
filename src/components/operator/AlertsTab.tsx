"use client";

import { useState, useMemo, useCallback } from "react";
import { useOperatorAlerts } from "@/hooks/useOperatorAlerts";
import { useDismissAlert } from "@/hooks/useOperatorMutations";
import {
  sortAlertsBySeverity,
  summarizeAlerts,
  alertsByDay,
  type AlertSeverityFilter,
} from "@/lib/operator-detail";
import { useOperatorStore } from "@/hooks/useOperatorStore";
import { storeTimeZone } from "@/lib/operator-timezone";
import type { AlertCategory } from "@/types/operator";
import AlertRow from "./AlertRow";
import TimeZoneNote from "./TimeZoneNote";
import { CheckCircleIcon } from "./icons";

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

const CATEGORY_LABELS: Record<AlertCategory, string> = {
  "sensor-offline": "Sensor offline",
  "low-stock": "Low stock",
  "temperature-warning": "Temperature",
  "door-ajar": "Door ajar",
  "power-issue": "Power",
};

type AlertView = "active" | "resolved";

/**
 * Alerts tab for the store detail page. Shows an at-a-glance overview (active
 * vs resolved, severity split, top categories, a 7-day trend), then the alert
 * list. The Active/Resolved toggle turns the same data into a history view so
 * operators can look back at what was dismissed.
 */
export default function AlertsTab({ storeId }: AlertsTabProps) {
  const { alerts, loading, error } = useOperatorAlerts(storeId);
  const { dismissAlert } = useDismissAlert();
  const [severityFilter, setSeverityFilter] =
    useState<AlertSeverityFilter>("all");
  const [view, setView] = useState<AlertView>("active");
  const [dismissingIds, setDismissingIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  const { store } = useOperatorStore(storeId);
  const timeZone = useMemo(() => storeTimeZone(store), [store]);

  const summary = useMemo(() => summarizeAlerts(alerts), [alerts]);
  const trend = useMemo(
    () => alertsByDay(alerts, new Date(), 7, timeZone),
    [alerts, timeZone],
  );
  const maxTrend = Math.max(1, ...trend.map((t) => t.count));

  const visibleAlerts = useMemo(() => {
    const inView = alerts.filter((a) =>
      view === "active" ? !a.acknowledged : a.acknowledged,
    );
    const bySeverity =
      severityFilter === "all"
        ? inView
        : inView.filter((a) => a.severity === severityFilter);
    return sortAlertsBySeverity(bySeverity);
  }, [alerts, severityFilter, view]);

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

  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface py-16 gap-3">
        <CheckCircleIcon className="text-success-500" />
        <p className="text-sm font-medium text-foreground">All clear</p>
        <p className="text-xs text-muted">No active alerts for this store.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overview / analytics */}
      <section className="rounded-lg border border-border bg-surface p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <Stat label="Active" value={summary.active} />
          <Stat label="Resolved" value={summary.resolved} />
          <div className="flex items-center gap-3 text-xs">
            <SeverityCount
              label="Critical"
              value={summary.bySeverity.critical}
              className="text-error-600 dark:text-error-400"
            />
            <SeverityCount
              label="Warning"
              value={summary.bySeverity.warning}
              className="text-warning-700 dark:text-warning-400"
            />
            <SeverityCount
              label="Info"
              value={summary.bySeverity.info}
              className="text-muted"
            />
          </div>
        </div>

        {/* 7-day trend */}
        <div>
          <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted">
            Alerts raised, last 7 days
          </p>
          <div className="flex items-end gap-1.5" aria-hidden="true">
            {trend.map((bucket, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-primary-500/60"
                  style={{
                    height: `${Math.round((bucket.count / maxTrend) * 40)}px`,
                    minHeight: bucket.count > 0 ? 2 : 0,
                  }}
                />
                <span className="text-[10px] text-muted">{bucket.day}</span>
              </div>
            ))}
          </div>
          <ul className="sr-only">
            {trend.map((bucket, i) => (
              <li key={i}>
                {bucket.day}: {bucket.count} alerts
              </li>
            ))}
          </ul>
          <div className="mt-1.5">
            <TimeZoneNote timeZone={timeZone} />
          </div>
        </div>

        {/* Top categories */}
        {summary.topCategories.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] uppercase tracking-wide text-muted">
              Most common
            </span>
            {summary.topCategories.slice(0, 3).map((c) => (
              <span
                key={c.category}
                className="rounded-full bg-surface-raised px-2.5 py-0.5 text-xs text-foreground"
              >
                {CATEGORY_LABELS[c.category]} · {c.count}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Active / Resolved view toggle */}
      <div
        role="group"
        aria-label="Alert view"
        className="inline-flex rounded-lg border border-border bg-surface p-0.5"
      >
        {(
          [
            ["active", `Active (${summary.active})`],
            ["resolved", `Resolved (${summary.resolved})`],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={view === value}
            onClick={() => setView(value)}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary-500 ${
              view === value
                ? "bg-primary-600 text-white"
                : "text-muted hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Severity filter pills */}
      <div className="flex gap-1.5">
        {SEVERITY_FILTERS.map((f) => {
          const isActive = f.value === severityFilter;
          return (
            <button
              type="button"
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
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface py-12 gap-2">
          {view === "active" ? (
            <>
              <CheckCircleIcon className="text-success-500" />
              <p className="text-sm font-medium text-foreground">All clear</p>
              <p className="text-xs text-muted">No active alerts for this store.</p>
            </>
          ) : (
            <p className="text-xs text-muted">
              No resolved alerts yet. Dismissed alerts show up here.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {visibleAlerts.map((alert) => (
            <AlertRow
              key={alert.id}
              alert={alert}
              resolved={view === "resolved"}
              onDismiss={handleDismiss}
              isDismissing={dismissingIds.has(alert.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-lg font-semibold tabular-nums text-foreground">
        {value}
      </p>
      <p className="text-[11px] uppercase tracking-wide text-muted">{label}</p>
    </div>
  );
}

function SeverityCount({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className: string;
}) {
  return (
    <span className={`tabular-nums ${className}`}>
      {value} {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

import Bone from "./Bone";

function AlertsTabSkeleton() {
  return (
    <div className="space-y-4">
      <Bone style={{ height: 120, width: "100%", borderRadius: 8 }} />
      <div className="flex gap-1.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Bone key={i} style={{ height: 30, width: 64, borderRadius: 8 }} />
        ))}
      </div>
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
