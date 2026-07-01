import { describe, it, expect } from "vitest";
import { computeFleetStats } from "@/lib/operator-utils";
import {
  buildStore,
  buildAlert,
  buildInventoryItem,
} from "@/test/factories/operator";
import type { Alert, InventoryItem } from "@/types/operator";

describe("computeFleetStats", () => {
  it("counts total stores", () => {
    const stores = [
      buildStore({ id: "s-1" }),
      buildStore({ id: "s-2" }),
      buildStore({ id: "s-3" }),
    ];

    const stats = computeFleetStats(stores, new Map(), new Map());
    expect(stats.totalStores).toBe(3);
  });

  it("counts stores needing attention (degraded + offline)", () => {
    const stores = [
      buildStore({ id: "s-1", status: "online" }),
      buildStore({ id: "s-2", status: "degraded" }),
      buildStore({ id: "s-3", status: "offline" }),
      buildStore({ id: "s-4", status: "online" }),
    ];

    const stats = computeFleetStats(stores, new Map(), new Map());
    expect(stats.needsAttention).toBe(2);
  });

  it("counts critical and warning alerts across all stores", () => {
    const alerts = new Map<string, readonly Alert[]>([
      [
        "s-1",
        [
          buildAlert({ storeId: "s-1", severity: "critical" }),
          buildAlert({ storeId: "s-1", severity: "warning" }),
          buildAlert({ storeId: "s-1", severity: "info" }),
        ],
      ],
      [
        "s-2",
        [
          buildAlert({ storeId: "s-2", severity: "critical" }),
          buildAlert({ storeId: "s-2", severity: "critical" }),
        ],
      ],
    ]);

    const stats = computeFleetStats(
      [buildStore({ id: "s-1" }), buildStore({ id: "s-2" })],
      alerts,
      new Map(),
    );
    expect(stats.criticalAlerts).toBe(3);
    expect(stats.warningAlerts).toBe(1);
  });

  it("counts low stock items (below 20% capacity)", () => {
    const inventory = new Map<string, readonly InventoryItem[]>([
      [
        "s-1",
        [
          buildInventoryItem({
            id: "i-1",
            storeId: "s-1",
            currentStock: 1,
            capacity: 10,
          }),
          buildInventoryItem({
            id: "i-2",
            storeId: "s-1",
            currentStock: 8,
            capacity: 10,
          }),
          buildInventoryItem({
            id: "i-3",
            storeId: "s-1",
            currentStock: 0,
            capacity: 12,
          }),
        ],
      ],
    ]);

    const stats = computeFleetStats(
      [buildStore({ id: "s-1" })],
      new Map(),
      inventory,
    );
    // i-1 at 10% and i-3 at 0% are below 20% threshold
    expect(stats.lowStockItems).toBe(2);
  });

  it("computes average inventory health as percent of capacity filled", () => {
    const inventory = new Map<string, readonly InventoryItem[]>([
      [
        "s-1",
        [
          buildInventoryItem({
            id: "i-1",
            storeId: "s-1",
            currentStock: 5,
            capacity: 10,
          }),
          buildInventoryItem({
            id: "i-2",
            storeId: "s-1",
            currentStock: 10,
            capacity: 10,
          }),
        ],
      ],
    ]);

    const stats = computeFleetStats(
      [buildStore({ id: "s-1" })],
      new Map(),
      inventory,
    );
    // (50% + 100%) / 2 = 75%
    expect(stats.avgInventoryHealth).toBe(75);
  });

  it("returns 0% health when no inventory data is available", () => {
    const stats = computeFleetStats(
      [buildStore({ id: "s-1" })],
      new Map(),
      new Map(),
    );
    expect(stats.avgInventoryHealth).toBe(0);
  });

  it("handles an empty fleet", () => {
    const stats = computeFleetStats([], new Map(), new Map());
    expect(stats.totalStores).toBe(0);
    expect(stats.needsAttention).toBe(0);
    expect(stats.criticalAlerts).toBe(0);
    expect(stats.warningAlerts).toBe(0);
    expect(stats.lowStockItems).toBe(0);
    expect(stats.avgInventoryHealth).toBe(0);
  });

  it("excludes acknowledged alerts from counts", () => {
    const alerts = new Map<string, readonly Alert[]>([
      [
        "s-1",
        [
          buildAlert({
            storeId: "s-1",
            severity: "critical",
            acknowledged: true,
          }),
          buildAlert({
            storeId: "s-1",
            severity: "critical",
            acknowledged: false,
          }),
        ],
      ],
    ]);

    const stats = computeFleetStats(
      [buildStore({ id: "s-1" })],
      alerts,
      new Map(),
    );
    expect(stats.criticalAlerts).toBe(1);
  });
});
