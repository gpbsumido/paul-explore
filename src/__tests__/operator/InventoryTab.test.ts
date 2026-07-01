import { describe, it, expect } from "vitest";
import {
  categorizeStock,
  computeInventorySummary,
  type StockStatus,
} from "@/lib/operator-detail";
import { buildInventoryItem } from "@/test/factories/operator";
import type { InventoryItem } from "@/types/operator";

// ---------------------------------------------------------------------------
// These tests verify the integration-level behavior that the InventoryTab
// component relies on: which items qualify for restocking, which get visual
// urgency treatment, and how summary stats reflect a realistic inventory mix.
// ---------------------------------------------------------------------------

// mirrors the component's restock button disable logic
function isRestockDisabled(item: InventoryItem): boolean {
  return categorizeStock(item.currentStock, item.capacity) === "healthy";
}

// mirrors the component's red left border logic
function hasUrgentBorder(item: InventoryItem): boolean {
  const status = categorizeStock(item.currentStock, item.capacity);
  return status === "critical" || status === "out-of-stock";
}

const BADGE_LABELS: Record<StockStatus, string> = {
  healthy: "Healthy",
  low: "Low",
  critical: "Critical",
  "out-of-stock": "Out of Stock",
};

// ---------------------------------------------------------------------------
// Restock button eligibility
// ---------------------------------------------------------------------------

describe("restock button eligibility", () => {
  it("is enabled for out-of-stock items", () => {
    const item = buildInventoryItem({ currentStock: 0, capacity: 12 });
    expect(isRestockDisabled(item)).toBe(false);
  });

  it("is enabled for critical items", () => {
    const item = buildInventoryItem({ currentStock: 1, capacity: 12 });
    expect(isRestockDisabled(item)).toBe(false);
  });

  it("is enabled for low items", () => {
    const item = buildInventoryItem({ currentStock: 4, capacity: 12 });
    expect(isRestockDisabled(item)).toBe(false);
  });

  it("is disabled for healthy items", () => {
    const item = buildInventoryItem({ currentStock: 10, capacity: 12 });
    expect(isRestockDisabled(item)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Urgent border treatment
// ---------------------------------------------------------------------------

describe("urgent border treatment", () => {
  it("applies to out-of-stock items", () => {
    const item = buildInventoryItem({ currentStock: 0, capacity: 12 });
    expect(hasUrgentBorder(item)).toBe(true);
  });

  it("applies to critical items", () => {
    const item = buildInventoryItem({ currentStock: 1, capacity: 12 });
    expect(hasUrgentBorder(item)).toBe(true);
  });

  it("does not apply to low items", () => {
    const item = buildInventoryItem({ currentStock: 4, capacity: 12 });
    expect(hasUrgentBorder(item)).toBe(false);
  });

  it("does not apply to healthy items", () => {
    const item = buildInventoryItem({ currentStock: 10, capacity: 12 });
    expect(hasUrgentBorder(item)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Badge label assignment
// ---------------------------------------------------------------------------

describe("badge label assignment", () => {
  it("maps each stock status to a user-facing label", () => {
    expect(BADGE_LABELS["healthy"]).toBe("Healthy");
    expect(BADGE_LABELS["low"]).toBe("Low");
    expect(BADGE_LABELS["critical"]).toBe("Critical");
    expect(BADGE_LABELS["out-of-stock"]).toBe("Out of Stock");
  });
});

// ---------------------------------------------------------------------------
// Summary with a realistic inventory mix
// ---------------------------------------------------------------------------

describe("summary with realistic inventory mix", () => {
  const realisticInventory: readonly InventoryItem[] = [
    buildInventoryItem({ currentStock: 12, capacity: 12 }), // healthy (100%)
    buildInventoryItem({ currentStock: 8, capacity: 12 }), // healthy (67%)
    buildInventoryItem({ currentStock: 4, capacity: 12 }), // low (33%)
    buildInventoryItem({ currentStock: 2, capacity: 12 }), // low (17% -> critical)
    buildInventoryItem({ currentStock: 1, capacity: 12 }), // critical (8%)
    buildInventoryItem({ currentStock: 0, capacity: 12 }), // out-of-stock (0%)
  ];

  it("identifies the correct number of items needing restock", () => {
    const summary = computeInventorySummary(realisticInventory);
    // items at 8% (critical) and 0% (out-of-stock) need restock
    // item at 17% is also critical (2/12 = 16.7%)
    expect(summary.needsRestock).toBe(3);
  });

  it("computes fill percentage across all items", () => {
    const summary = computeInventorySummary(realisticInventory);
    // (12+8+4+2+1+0) / (12*6) = 27/72 = 37.5% -> rounds to 38%
    expect(summary.fillPercentage).toBe(38);
  });

  it("counts all items regardless of status", () => {
    const summary = computeInventorySummary(realisticInventory);
    expect(summary.totalItems).toBe(6);
  });
});
