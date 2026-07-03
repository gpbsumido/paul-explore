import { NextResponse } from "next/server";
import { getStores, getAlerts, getInventory } from "@/lib/operator-data";
import { toAlertTrendData } from "@/lib/operator-chart-transforms";
import { LOW_STOCK_THRESHOLD } from "@/lib/operator-utils";
import type { Alert, StoreSummary } from "@/types/operator";

/**
 * Returns aggregated alert counts, inventory health, fleet stats, and alert
 * trend data for every store in a single response. Replaces the per-store
 * fan-out queries that the dashboard previously used (1 request vs 2N).
 */
export async function GET() {
  const stores = getStores();
  const allAlerts: Alert[] = [];

  let criticalAlerts = 0;
  let warningAlerts = 0;
  let lowStockItems = 0;
  let totalHealth = 0;
  let totalItems = 0;

  const summaries: StoreSummary[] = stores.map((store) => {
    const alerts = getAlerts(store.id) ?? [];
    const inventory = getInventory(store.id) ?? [];

    allAlerts.push(...alerts);

    const unacknowledged = alerts.filter((a) => !a.acknowledged);

    for (const a of unacknowledged) {
      if (a.severity === "critical") criticalAlerts++;
      if (a.severity === "warning") warningAlerts++;
    }

    let storeHealth = 0;
    for (const item of inventory) {
      totalItems++;
      const ratio = item.capacity > 0 ? item.currentStock / item.capacity : 0;
      totalHealth += ratio;
      storeHealth += ratio;
      if (ratio < LOW_STOCK_THRESHOLD) lowStockItems++;
    }

    const inventoryHealth =
      inventory.length > 0
        ? Math.round((storeHealth / inventory.length) * 100)
        : 0;

    return {
      storeId: store.id,
      alertCount: unacknowledged.length,
      inventoryHealth,
      hasCritical: unacknowledged.some((a) => a.severity === "critical"),
      hasWarning: unacknowledged.some((a) => a.severity === "warning"),
    };
  });

  const fleetStats = {
    criticalAlerts,
    warningAlerts,
    lowStockItems,
    avgInventoryHealth:
      totalItems > 0 ? Math.round((totalHealth / totalItems) * 100) : 0,
  };

  const alertTrend = toAlertTrendData(allAlerts);

  return NextResponse.json({ summaries, fleetStats, alertTrend });
}
