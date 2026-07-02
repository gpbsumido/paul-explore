import { describe, it, expect } from "vitest";
import {
  getActivityTypeConfig,
  ACTIVITY_TYPE_CONFIGS,
} from "@/lib/operator-detail";
import type { ActivityType } from "@/types/operator";

// ---------------------------------------------------------------------------
// getActivityTypeConfig — maps activity type to icon label and color
// ---------------------------------------------------------------------------

describe("getActivityTypeConfig", () => {
  it("returns a config for every known activity type", () => {
    const types: ActivityType[] = [
      "restock",
      "maintenance",
      "alert-acknowledged",
      "status-change",
      "price-update",
    ];

    for (const type of types) {
      const config = getActivityTypeConfig(type);
      expect(config.label).toBeTruthy();
      expect(typeof config.label).toBe("string");
      expect(config.color).toBeTruthy();
    }
  });

  it("returns 'Restock' label for restock type", () => {
    expect(getActivityTypeConfig("restock").label).toBe("Restock");
  });

  it("returns 'Maintenance' label for maintenance type", () => {
    expect(getActivityTypeConfig("maintenance").label).toBe("Maintenance");
  });

  it("returns 'Alert Dismissed' label for alert-acknowledged type", () => {
    expect(getActivityTypeConfig("alert-acknowledged").label).toBe(
      "Alert Dismissed",
    );
  });

  it("returns 'Status Change' label for status-change type", () => {
    expect(getActivityTypeConfig("status-change").label).toBe("Status Change");
  });

  it("returns 'Price Update' label for price-update type", () => {
    expect(getActivityTypeConfig("price-update").label).toBe("Price Update");
  });

  it("exposes configs for all 5 activity types", () => {
    const keys = Object.keys(ACTIVITY_TYPE_CONFIGS);
    expect(keys).toHaveLength(5);
  });

  it("each config has a distinct color class", () => {
    const colors = Object.values(ACTIVITY_TYPE_CONFIGS).map((c) => c.color);
    const unique = new Set(colors);
    expect(unique.size).toBe(5);
  });
});
