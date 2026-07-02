import { describe, it, expect } from "vitest";
import {
  sortAlertsBySeverity,
  filterAlertsBySeverity,
  countActiveAlerts,
} from "@/lib/operator-detail";
import { buildAlert } from "@/test/factories/operator";
import type { Alert } from "@/types/operator";

// ---------------------------------------------------------------------------
// These tests verify the integration-level behavior that the AlertsTab
// component relies on: how sorting, filtering, and counting compose when
// given a realistic alert mix, and that dismiss (acknowledged) correctly
// removes alerts from the visible pipeline.
// ---------------------------------------------------------------------------

function buildRealisticAlerts(): readonly Alert[] {
  return [
    buildAlert({
      id: "a-1",
      severity: "info",
      category: "low-stock",
      acknowledged: false,
    }),
    buildAlert({
      id: "a-2",
      severity: "critical",
      category: "temperature-warning",
      acknowledged: false,
    }),
    buildAlert({
      id: "a-3",
      severity: "warning",
      category: "door-ajar",
      acknowledged: false,
    }),
    buildAlert({
      id: "a-4",
      severity: "critical",
      category: "power-issue",
      acknowledged: true,
    }),
    buildAlert({
      id: "a-5",
      severity: "warning",
      category: "sensor-offline",
      acknowledged: false,
    }),
    buildAlert({
      id: "a-6",
      severity: "info",
      category: "low-stock",
      acknowledged: true,
    }),
  ];
}

// ---------------------------------------------------------------------------
// Filter + sort pipeline (mimics the AlertsTab useMemo chain)
// ---------------------------------------------------------------------------

describe("alerts tab pipeline: filter then sort", () => {
  const alerts = buildRealisticAlerts();

  it("shows only active alerts sorted by severity when filter is 'all'", () => {
    const filtered = filterAlertsBySeverity(alerts, "all");
    const sorted = sortAlertsBySeverity(filtered);

    expect(sorted).toHaveLength(4);
    expect(sorted[0].severity).toBe("critical");
    expect(sorted[1].severity).toBe("warning");
    expect(sorted[2].severity).toBe("warning");
    expect(sorted[3].severity).toBe("info");
  });

  it("narrows to critical only when filter is 'critical'", () => {
    const filtered = filterAlertsBySeverity(alerts, "critical");
    const sorted = sortAlertsBySeverity(filtered);

    // a-2 is active critical, a-4 is acknowledged critical (excluded)
    expect(sorted).toHaveLength(1);
    expect(sorted[0].id).toBe("a-2");
  });

  it("narrows to warnings when filter is 'warning'", () => {
    const filtered = filterAlertsBySeverity(alerts, "warning");
    const sorted = sortAlertsBySeverity(filtered);

    expect(sorted).toHaveLength(2);
    expect(sorted.every((a) => a.severity === "warning")).toBe(true);
  });

  it("narrows to info when filter is 'info'", () => {
    const filtered = filterAlertsBySeverity(alerts, "info");
    const sorted = sortAlertsBySeverity(filtered);

    // a-1 is active info, a-6 is acknowledged info (excluded)
    expect(sorted).toHaveLength(1);
    expect(sorted[0].id).toBe("a-1");
  });
});

// ---------------------------------------------------------------------------
// Dismiss simulation (optimistic acknowledge removes from visible list)
// ---------------------------------------------------------------------------

describe("dismiss removes alert from visible pipeline", () => {
  it("dismissing an alert reduces the active count by one", () => {
    const alerts = buildRealisticAlerts();
    const before = countActiveAlerts(alerts);

    // simulate optimistic dismiss of a-2 (critical)
    const afterDismiss = alerts.map((a) =>
      a.id === "a-2" ? { ...a, acknowledged: true } : a,
    );
    const after = countActiveAlerts(afterDismiss);

    expect(after).toBe(before - 1);
  });

  it("dismissed alert no longer appears in filtered results", () => {
    const alerts = buildRealisticAlerts();

    const afterDismiss = alerts.map((a) =>
      a.id === "a-2" ? { ...a, acknowledged: true } : a,
    );

    const filtered = filterAlertsBySeverity(afterDismiss, "all");
    expect(filtered.find((a) => a.id === "a-2")).toBeUndefined();
  });

  it("dismissing all alerts results in empty list and zero count", () => {
    const alerts = buildRealisticAlerts();

    const allDismissed = alerts.map((a) => ({ ...a, acknowledged: true }));
    const filtered = filterAlertsBySeverity(allDismissed, "all");

    expect(filtered).toHaveLength(0);
    expect(countActiveAlerts(allDismissed)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Alert count badge (used on the tab label)
// ---------------------------------------------------------------------------

describe("alert count badge reflects active state", () => {
  it("counts only unacknowledged alerts from the full list", () => {
    const alerts = buildRealisticAlerts();
    // 4 active out of 6 total (a-4 and a-6 are acknowledged)
    expect(countActiveAlerts(alerts)).toBe(4);
  });

  it("updates count after an optimistic dismiss", () => {
    const alerts = buildRealisticAlerts();

    const afterDismiss = alerts.map((a) =>
      a.id === "a-3" ? { ...a, acknowledged: true } : a,
    );

    expect(countActiveAlerts(afterDismiss)).toBe(3);
  });
});
