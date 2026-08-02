// The BFF layer for the operator dashboard. It prefers the live portfolio_api
// operator service and falls back to the in-memory seed store when the service
// is unreachable, so the demo keeps working (and looks identical) whether or
// not the backend is running. Same pattern as the flags console.

import * as api from "@/lib/operator-client";
import * as seed from "@/lib/operator-data";
import type { RestockLineBody } from "@/lib/operator-restock-types";
import { toAlertTrendData } from "@/lib/operator-chart-transforms";
import { LOW_STOCK_THRESHOLD } from "@/lib/operator-utils";
import {
  aggregateFleetSales,
  type SalesGranularity,
  type FleetSalesAnalytics,
} from "@/lib/operator-sales";
import type {
  Store,
  InventoryItem,
  Alert,
  ActivityEvent,
  Sale,
  PlanogramSlot,
  RestockSession,
  RestockLine,
  Promotion,
  StoreSummary,
  FleetSummaryResponse,
} from "@/types/operator";

type RestockResult = { items: InventoryItem[]; activity: ActivityEvent };
type PlanogramUpdate = { boxes: PlanogramSlot[] } | { resyncItemId: string };

// ---------------------------------------------------------------------------
// Reads — fall back to the seed on any failure (idempotent, so it is safe).
// ---------------------------------------------------------------------------

export async function loadStores(): Promise<readonly Store[]> {
  try {
    return await api.fetchStores();
  } catch {
    return seed.getStores();
  }
}

export async function loadStore(storeId: string): Promise<Store | undefined> {
  try {
    return await api.fetchStore(storeId);
  } catch {
    return seed.getStore(storeId);
  }
}

export async function loadInventory(
  storeId: string,
): Promise<InventoryItem[]> {
  try {
    return await api.fetchInventory(storeId);
  } catch {
    return seed.getInventory(storeId) ?? [];
  }
}

export async function loadAlerts(storeId: string): Promise<Alert[]> {
  try {
    return await api.fetchAlerts(storeId);
  } catch {
    return seed.getAlerts(storeId) ?? [];
  }
}

export async function loadActivity(
  storeId: string,
): Promise<ActivityEvent[]> {
  try {
    return await api.fetchActivity(storeId);
  } catch {
    return seed.getActivity(storeId) ?? [];
  }
}

export async function loadSales(storeId: string): Promise<Sale[]> {
  try {
    return await api.fetchSales(storeId);
  } catch {
    return seed.getSales(storeId) ?? [];
  }
}

export async function loadPlanogram(
  storeId: string,
): Promise<PlanogramSlot[]> {
  try {
    return await api.fetchPlanogram(storeId);
  } catch {
    return seed.getPlanogram(storeId) ?? [];
  }
}

export async function loadFleetSummary(): Promise<FleetSummaryResponse> {
  try {
    return await api.fetchFleetSummary();
  } catch {
    return computeFleetSummarySeed();
  }
}

export async function loadSalesAnalytics(
  granularity: SalesGranularity,
  timeZone: string,
): Promise<FleetSalesAnalytics> {
  try {
    return await api.fetchSalesAnalytics(granularity, timeZone);
  } catch {
    return aggregateFleetSales(
      seed.getStores().map((store) => ({
        storeId: store.id,
        storeName: store.name,
        sales: seed.getSales(store.id) ?? [],
      })),
      granularity,
      new Date(),
      timeZone,
    );
  }
}

// ---------------------------------------------------------------------------
// Writes — fall back to the seed on any failure, the same as the reads. The
// seed returns `undefined` for an id it doesn't know (e.g. a real backend
// UUID), so an unknown target still surfaces as a 404 at the route; but a
// seed-id write while the backend is up (or down) still applies, instead of
// reads working while writes 404.
// ---------------------------------------------------------------------------

export async function applyRestock(
  storeId: string,
  itemIds: string[],
): Promise<RestockResult | undefined> {
  try {
    return await api.postRestock(storeId, itemIds);
  } catch {
    return seed.restockItems(storeId, itemIds);
  }
}

export async function applyDismiss(
  alertId: string,
): Promise<Alert | undefined> {
  try {
    return await api.patchDismiss(alertId);
  } catch {
    return seed.dismissAlert(alertId);
  }
}

export async function applyPlanogramUpdate(
  storeId: string,
  update: PlanogramUpdate,
): Promise<PlanogramSlot[] | undefined> {
  try {
    return await api.patchPlanogram(storeId, update);
  } catch {
    return "boxes" in update
      ? seed.setPlanogram(storeId, update.boxes)
      : seed.resyncPlanogramSlot(storeId, update.resyncItemId);
  }
}

// ---------------------------------------------------------------------------
// Seed-side aggregations, mirroring what the backend computes in SQL.
// ---------------------------------------------------------------------------

function computeFleetSummarySeed(): FleetSummaryResponse {
  const stores = seed.getStores();
  const allAlerts: Alert[] = [];

  let criticalAlerts = 0;
  let warningAlerts = 0;
  let lowStockItems = 0;
  let totalHealth = 0;
  let totalItems = 0;

  const summaries: StoreSummary[] = stores.map((store) => {
    const alerts = seed.getAlerts(store.id) ?? [];
    const inventory = seed.getInventory(store.id) ?? [];
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

    return {
      storeId: store.id,
      alertCount: unacknowledged.length,
      inventoryHealth:
        inventory.length > 0
          ? Math.round((storeHealth / inventory.length) * 100)
          : 0,
      hasCritical: unacknowledged.some((a) => a.severity === "critical"),
      hasWarning: unacknowledged.some((a) => a.severity === "warning"),
    };
  });

  return {
    summaries,
    fleetStats: {
      criticalAlerts,
      warningAlerts,
      lowStockItems,
      avgInventoryHealth:
        totalItems > 0 ? Math.round((totalHealth / totalItems) * 100) : 0,
    },
    alertTrend: [...toAlertTrendData(allAlerts)],
  };
}

// ---------------------------------------------------------------------------
// Restock sessions
//
// Same live-API-first, seed-fallback shape as every other call here, so the
// demo keeps working end to end when portfolio_api is unreachable.
// ---------------------------------------------------------------------------

export async function openRestockSession(
  storeId: string,
): Promise<RestockSession | undefined> {
  try {
    return await api.postRestockSession(storeId);
  } catch {
    return seed.openRestockSession(storeId);
  }
}

export async function loadRestockSessions(
  storeId: string,
): Promise<RestockSession[]> {
  try {
    return await api.fetchRestockSessions(storeId);
  } catch {
    return seed.listRestockSessions(storeId);
  }
}

export async function loadRestockSession(
  sessionId: string,
): Promise<{ session: RestockSession; lines: RestockLine[] } | undefined> {
  try {
    return await api.fetchRestockSession(sessionId);
  } catch {
    const session = seed.getRestockSession(sessionId);
    if (!session) return undefined;
    return { session, lines: seed.getRestockLines(sessionId) };
  }
}

export async function saveRestockLine(
  sessionId: string,
  itemId: string,
  body: RestockLineBody,
): Promise<RestockLine | undefined> {
  try {
    return await api.putRestockLine(sessionId, itemId, body);
  } catch {
    return seed.upsertRestockLine(sessionId, itemId, body);
  }
}

export async function applyRestockSession(
  sessionId: string,
  notes: string | null,
): Promise<
  | {
      session: RestockSession;
      lines: RestockLine[];
      items: InventoryItem[];
      activity: ActivityEvent;
    }
  | undefined
> {
  try {
    return await api.postCompleteRestock(sessionId, notes);
  } catch {
    return seed.completeRestockSession(sessionId, notes);
  }
}

// ---------------------------------------------------------------------------
// Promotions
// ---------------------------------------------------------------------------

export async function loadPromotions(storeId: string): Promise<Promotion[]> {
  try {
    return await api.fetchPromotions(storeId);
  } catch {
    return seed.listPromotions(storeId);
  }
}

export async function createPromotion(
  storeId: string,
  body: api.PromotionBody,
): Promise<Promotion | undefined> {
  try {
    return await api.postPromotion(storeId, body);
  } catch {
    return seed.insertPromotion(storeId, body);
  }
}

export async function stopPromotion(
  promotionId: string,
): Promise<Promotion | undefined> {
  try {
    return await api.patchEndPromotion(promotionId);
  } catch {
    return seed.endPromotion(promotionId);
  }
}
