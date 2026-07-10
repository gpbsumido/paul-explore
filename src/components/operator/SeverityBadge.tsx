"use client";

import type { AlertSeverity } from "@/types/operator";

interface SeverityBadgeProps {
  severity: AlertSeverity;
}

const CONFIG: Record<AlertSeverity, { label: string; className: string }> = {
  critical: {
    label: "Critical",
    className: "bg-error-500/10 text-error-600 dark:text-error-500",
  },
  warning: {
    label: "Warning",
    className: "bg-warning-500/10 text-warning-700 dark:text-warning-500",
  },
  info: {
    label: "Info",
    className: "bg-primary-500/10 text-primary-600",
  },
};

/**
 * Pill badge showing alert severity with color coding: red for critical,
 * amber for warning, blue for info.
 */
export default function SeverityBadge({ severity }: SeverityBadgeProps) {
  const { label, className } = CONFIG[severity];
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${className}`}
    >
      {label}
    </span>
  );
}
