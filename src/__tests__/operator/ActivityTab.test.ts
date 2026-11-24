import { describe, it, expect } from "vitest";
import {
  getActivityTypeConfig,
  ACTIVITY_TYPE_CONFIGS,
} from "@/lib/operator-detail";

// ---------------------------------------------------------------------------
// getActivityTypeConfig — maps activity type to icon label and color
// ---------------------------------------------------------------------------

describe("getActivityTypeConfig", () => {
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

  it("gives every activity type its own color class, so the feed can tell them apart", () => {
    const colors = Object.values(ACTIVITY_TYPE_CONFIGS).map((c) => c.color);
    expect(new Set(colors).size).toBe(colors.length);
  });
});
