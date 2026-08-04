import { describe, it, expect } from "vitest";
import { summarizeAlerts, alertsByDay } from "@/lib/operator-detail";
import { buildAlert } from "@/test/factories/operator";

// ---------------------------------------------------------------------------
// summarizeAlerts — active vs resolved, severity + category breakdown
// ---------------------------------------------------------------------------

describe("summarizeAlerts", () => {
  it("counts active and resolved alerts", () => {
    const alerts = [
      buildAlert({ acknowledged: false }),
      buildAlert({ acknowledged: false }),
      buildAlert({ acknowledged: true }),
    ];
    const summary = summarizeAlerts(alerts);
    expect(summary.active).toBe(2);
    expect(summary.resolved).toBe(1);
  });

  it("breaks the active alerts down by severity", () => {
    const alerts = [
      buildAlert({ severity: "critical", acknowledged: false }),
      buildAlert({ severity: "warning", acknowledged: false }),
      buildAlert({ severity: "warning", acknowledged: false }),
      // resolved ones do not count toward the active severity tally
      buildAlert({ severity: "critical", acknowledged: true }),
    ];
    const summary = summarizeAlerts(alerts);
    expect(summary.bySeverity.critical).toBe(1);
    expect(summary.bySeverity.warning).toBe(2);
    expect(summary.bySeverity.info).toBe(0);
  });

  it("ranks categories across the whole history, most common first", () => {
    const alerts = [
      buildAlert({ category: "low-stock", acknowledged: true }),
      buildAlert({ category: "low-stock", acknowledged: false }),
      buildAlert({ category: "door-ajar", acknowledged: false }),
    ];
    const summary = summarizeAlerts(alerts);
    expect(summary.topCategories[0]).toEqual({
      category: "low-stock",
      count: 2,
    });
    expect(summary.topCategories[1]).toEqual({
      category: "door-ajar",
      count: 1,
    });
  });

  it("returns zeroes for an empty alert list", () => {
    const summary = summarizeAlerts([]);
    expect(summary.active).toBe(0);
    expect(summary.resolved).toBe(0);
    expect(summary.topCategories).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// alertsByDay — last-7-day trend of alerts raised
// ---------------------------------------------------------------------------

describe("alertsByDay", () => {
  const now = new Date("2026-08-01T12:00:00Z");

  it("returns 7 day buckets", () => {
    expect(alertsByDay([], now)).toHaveLength(7);
  });

  it("counts an alert in the day it was raised", () => {
    const alerts = [
      buildAlert({ timestamp: "2026-08-01T09:00:00Z" }),
      buildAlert({ timestamp: "2026-08-01T10:00:00Z" }),
    ];
    const buckets = alertsByDay(alerts, now);
    expect(buckets[6].count).toBe(2);
  });

  it("ignores alerts older than the window", () => {
    const alerts = [buildAlert({ timestamp: "2026-07-01T09:00:00Z" })];
    const total = alertsByDay(alerts, now).reduce((s, b) => s + b.count, 0);
    expect(total).toBe(0);
  });

  it("labels each bucket with a weekday", () => {
    for (const bucket of alertsByDay([], now)) {
      expect(typeof bucket.day).toBe("string");
      expect(bucket.day).toBeTruthy();
    }
  });
});
