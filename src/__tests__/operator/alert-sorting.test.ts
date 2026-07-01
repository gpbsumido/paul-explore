import { describe, it, expect } from "vitest";
import {
  sortAlertsBySeverity,
  filterAlertsBySeverity,
  countActiveAlerts,
} from "@/lib/operator-detail";
import { buildAlert } from "@/test/factories/operator";

// ---------------------------------------------------------------------------
// sortAlertsBySeverity — critical first, then warning, then info
// ---------------------------------------------------------------------------

describe("sortAlertsBySeverity", () => {
  it("ranks critical before warning before info", () => {
    const info = buildAlert({ id: "a-info", severity: "info" });
    const warning = buildAlert({ id: "a-warn", severity: "warning" });
    const critical = buildAlert({ id: "a-crit", severity: "critical" });

    const sorted = sortAlertsBySeverity([info, warning, critical]);
    expect(sorted.map((a) => a.id)).toEqual(["a-crit", "a-warn", "a-info"]);
  });

  it("preserves relative order for alerts with the same severity", () => {
    const a = buildAlert({ id: "a-1", severity: "warning" });
    const b = buildAlert({ id: "a-2", severity: "warning" });
    const c = buildAlert({ id: "a-3", severity: "warning" });

    const sorted = sortAlertsBySeverity([a, b, c]);
    expect(sorted.map((a) => a.id)).toEqual(["a-1", "a-2", "a-3"]);
  });

  it("does not mutate the original array", () => {
    const alerts = [
      buildAlert({ id: "a-1", severity: "info" }),
      buildAlert({ id: "a-2", severity: "critical" }),
    ];
    const original = [...alerts];

    sortAlertsBySeverity(alerts);
    expect(alerts.map((a) => a.id)).toEqual(original.map((a) => a.id));
  });

  it("handles an empty array", () => {
    expect(sortAlertsBySeverity([])).toEqual([]);
  });

  it("places critical alerts with different categories in priority order", () => {
    const tempCritical = buildAlert({
      id: "a-temp",
      severity: "critical",
      category: "temperature-warning",
    });
    const sensorCritical = buildAlert({
      id: "a-sensor",
      severity: "critical",
      category: "sensor-offline",
    });
    const infoAlert = buildAlert({ id: "a-info", severity: "info" });

    const sorted = sortAlertsBySeverity([
      infoAlert,
      tempCritical,
      sensorCritical,
    ]);
    // both criticals before info, relative order preserved
    expect(sorted[0].severity).toBe("critical");
    expect(sorted[1].severity).toBe("critical");
    expect(sorted[2].severity).toBe("info");
  });
});

// ---------------------------------------------------------------------------
// filterAlertsBySeverity — filters by severity level or returns all
// ---------------------------------------------------------------------------

describe("filterAlertsBySeverity", () => {
  const alerts = [
    buildAlert({ id: "a-1", severity: "critical", acknowledged: false }),
    buildAlert({ id: "a-2", severity: "warning", acknowledged: false }),
    buildAlert({ id: "a-3", severity: "info", acknowledged: false }),
    buildAlert({ id: "a-4", severity: "critical", acknowledged: true }),
  ];

  it("returns only unacknowledged alerts when filter is 'all'", () => {
    const result = filterAlertsBySeverity(alerts, "all");
    expect(result).toHaveLength(3);
    expect(result.every((a) => !a.acknowledged)).toBe(true);
  });

  it("filters by severity and excludes acknowledged alerts", () => {
    const result = filterAlertsBySeverity(alerts, "critical");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("a-1");
  });

  it("returns only warning alerts when filtered to warning", () => {
    const result = filterAlertsBySeverity(alerts, "warning");
    expect(result).toHaveLength(1);
    expect(result[0].severity).toBe("warning");
  });

  it("returns only info alerts when filtered to info", () => {
    const result = filterAlertsBySeverity(alerts, "info");
    expect(result).toHaveLength(1);
    expect(result[0].severity).toBe("info");
  });

  it("returns empty array when no alerts match filter", () => {
    const onlyInfo = [buildAlert({ severity: "info", acknowledged: false })];
    expect(filterAlertsBySeverity(onlyInfo, "critical")).toEqual([]);
  });

  it("returns empty array when all alerts are acknowledged", () => {
    const allAcked = [
      buildAlert({ severity: "critical", acknowledged: true }),
      buildAlert({ severity: "warning", acknowledged: true }),
    ];
    expect(filterAlertsBySeverity(allAcked, "all")).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// countActiveAlerts — counts unacknowledged alerts
// ---------------------------------------------------------------------------

describe("countActiveAlerts", () => {
  it("counts only unacknowledged alerts", () => {
    const alerts = [
      buildAlert({ acknowledged: false }),
      buildAlert({ acknowledged: false }),
      buildAlert({ acknowledged: true }),
    ];
    expect(countActiveAlerts(alerts)).toBe(2);
  });

  it("returns 0 when all alerts are acknowledged", () => {
    const alerts = [
      buildAlert({ acknowledged: true }),
      buildAlert({ acknowledged: true }),
    ];
    expect(countActiveAlerts(alerts)).toBe(0);
  });

  it("returns 0 for an empty array", () => {
    expect(countActiveAlerts([])).toBe(0);
  });

  it("counts all when none are acknowledged", () => {
    const alerts = [
      buildAlert({ acknowledged: false }),
      buildAlert({ acknowledged: false }),
      buildAlert({ acknowledged: false }),
    ];
    expect(countActiveAlerts(alerts)).toBe(3);
  });
});
