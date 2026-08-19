import type {
  Store,
  Alert,
  InventoryItem,
  StoreStatus,
} from "@/types/operator";

// ---------------------------------------------------------------------------
// Shared numeric helpers
// ---------------------------------------------------------------------------

/** Rounds a currency value to whole cents. */
export function toCents(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Clamps a percentage into the 0-100 range. */
export function clampPercent(percent: number): number {
  return Math.max(0, Math.min(100, percent));
}

/** The fill ratio of an inventory item, or 0 when it has no capacity. */
export function fillRatio(
  item: Pick<InventoryItem, "capacity" | "currentStock">,
): number {
  return item.capacity > 0 ? item.currentStock / item.capacity : 0;
}

/**
 * Averages a summed fill ratio into a whole-number percentage across `count`
 * items, returning 0 when there are no items.
 */
export function averagePercent(totalRatio: number, count: number): number {
  return count > 0 ? Math.round((totalRatio / count) * 100) : 0;
}

// ---------------------------------------------------------------------------
// Sorting
// ---------------------------------------------------------------------------

const STATUS_PRIORITY: Record<StoreStatus, number> = {
  offline: 0,
  degraded: 1,
  online: 2,
};

/**
 * Assigns a numeric score to a store for sorting. Lower score = worse state =
 * listed first. Degraded stores with active alerts rank above degraded stores
 * with none so operators see the loudest problems at the top.
 */
function storeScore(store: Store, alertCount: number): number {
  if (store.status === "degraded" && alertCount > 0) return 0.5;
  return STATUS_PRIORITY[store.status];
}

/**
 * Sorts stores worst-first: offline > degraded with alerts > degraded > online.
 * Uses a stable sort so stores with the same priority keep their original order.
 */
export function sortStores(
  stores: readonly Store[],
  alertCounts: ReadonlyMap<string, number>,
): Store[] {
  return [...stores].sort((a, b) => {
    const scoreA = storeScore(a, alertCounts.get(a.id) ?? 0);
    const scoreB = storeScore(b, alertCounts.get(b.id) ?? 0);
    return scoreA - scoreB;
  });
}

// ---------------------------------------------------------------------------
// Filtering
// ---------------------------------------------------------------------------

interface StoreFilterCriteria {
  status: StoreFilterStatus;
  search: string;
}

/**
 * What the store list can be narrowed to: a single status, everything, or the
 * "needs attention" grouping the fleet KPI counts — degraded and offline
 * together, since that tile is one number over two statuses and clicking it
 * should narrow to exactly what it counted.
 */
export type StoreFilterStatus = StoreStatus | "all" | "needs-attention";

/**
 * Filters stores by status and name search. Both filters are AND-combined:
 * a store must match the selected status AND contain the search substring.
 */
export function filterStores(
  stores: readonly Store[],
  { status, search }: StoreFilterCriteria,
): Store[] {
  const needle = search.toLowerCase();
  return stores.filter((store) => {
    if (status === "needs-attention") {
      if (store.status !== "degraded" && store.status !== "offline")
        return false;
    } else if (status !== "all" && store.status !== status) {
      return false;
    }
    if (needle && !store.name.toLowerCase().includes(needle)) return false;
    return true;
  });
}

// ---------------------------------------------------------------------------
// Fleet stats
// ---------------------------------------------------------------------------

export interface FleetStats {
  totalStores: number;
  needsAttention: number;
  /**
   * Null while the fleet summary is missing. These come from a separate
   * aggregate call, so they can be absent while the store list is fine, and
   * zero is a claim about the fleet rather than an admission of not knowing.
   */
  lowStockItems: number | null;
  avgInventoryHealth: number | null;
  criticalAlerts: number | null;
  warningAlerts: number | null;
}

export const LOW_STOCK_THRESHOLD = 0.2;

/**
 * Computes aggregate fleet statistics from stores, alerts, and inventory data.
 * Only unacknowledged alerts are counted — dismissed alerts are operator-handled.
 */
export function computeFleetStats(
  stores: readonly Store[],
  alertsByStore: ReadonlyMap<string, readonly Alert[]>,
  inventoryByStore: ReadonlyMap<string, readonly InventoryItem[]>,
): FleetStats {
  let criticalAlerts = 0;
  let warningAlerts = 0;
  let lowStockItems = 0;
  let totalHealth = 0;
  let totalItems = 0;

  for (const alerts of alertsByStore.values()) {
    for (const alert of alerts) {
      if (alert.acknowledged) continue;
      if (alert.severity === "critical") criticalAlerts++;
      if (alert.severity === "warning") warningAlerts++;
    }
  }

  for (const items of inventoryByStore.values()) {
    for (const item of items) {
      totalItems++;
      const ratio = fillRatio(item);
      totalHealth += ratio;
      if (ratio < LOW_STOCK_THRESHOLD) lowStockItems++;
    }
  }

  return {
    totalStores: stores.length,
    needsAttention: stores.filter(
      (s) => s.status === "degraded" || s.status === "offline",
    ).length,
    lowStockItems,
    avgInventoryHealth: averagePercent(totalHealth, totalItems),
    criticalAlerts,
    warningAlerts,
  };
}
