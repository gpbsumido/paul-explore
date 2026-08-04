// The BFF layer for the operator dashboard. It prefers the live portfolio_api
// operator service and falls back to the in-memory seed store when the service
// is unreachable, so the demo keeps working (and looks identical) whether or
// not the backend is running. Same pattern as the flags console.

import * as api from "@/lib/operator-client";
import * as seed from "@/lib/operator-data";
import type { RestockLineBody } from "@/lib/operator-restock-types";
import {
  OperatorServiceTokenError,
  OperatorUnavailableError,
} from "@/lib/operator-route-errors";
import { toAlertTrendData } from "@/lib/operator-chart-transforms";
import { LOW_STOCK_THRESHOLD } from "@/lib/operator-utils";
import {
  aggregateFleetSales,
  type SalesGranularity,
  type FleetSalesAnalytics,
} from "@/lib/operator-sales";
import { fleetBenchmarks, type FleetBenchmarks } from "@/lib/operator-planner";
import {
  fleetProductPerformance,
  type ProductPerformanceRow,
} from "@/lib/operator-product-performance";
import { fleetShrink, type FleetShrink } from "@/lib/operator-shrink";
import type { SearchIndexResponse } from "@/lib/operator-search";
import {
  summarizeFinance,
  FEE_MODEL,
  type FinanceResponse,
} from "@/lib/operator-finance";
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

/**
 * Says out loud that a read fell back to the seed.
 *
 * This used to be silent, which is how a failing fleet-summary turned into
 * every store card showing 0% with nothing in any log to explain it. The store
 * list still came from the API with real ids while the summaries came from the
 * seed with different ones, so nothing matched and absent rendered as zero. The
 * fallback is still the right behaviour, it just should not be a secret.
 */
/**
 * Reads the seed for a store, or admits it cannot.
 *
 * The seed is keyed by the ids it made up, so it has nothing to say about a
 * real store UUID. Returning an empty list there is a lie with a plausible
 * shape: the tab renders "no data" and nobody suspects the backend.
 */
function seedForStore<T>(
  storeId: string,
  read: () => T | undefined,
  what: string,
): T {
  const value = seed.getStore(storeId) ? read() : undefined;
  if (value === undefined) throw new OperatorUnavailableError(what);
  return value;
}

function noteFallback(what: string, err: unknown): void {
  const reason = err instanceof Error ? err.message : String(err);
  console.warn(
    `[operator] ${what} fell back to seed data: ${reason}. The page will render, but it is not showing what the API holds.`,
  );
}

// ---------------------------------------------------------------------------
// Reads — fall back to the seed on any failure (idempotent, so it is safe).
// ---------------------------------------------------------------------------

export async function loadStores(): Promise<readonly Store[]> {
  try {
    return await api.fetchStores();
  } catch (err) {
    noteFallback("loadStores", err);
    return seed.getStores();
  }
}

export async function loadStore(storeId: string): Promise<Store | undefined> {
  try {
    return await api.fetchStore(storeId);
  } catch (err) {
    noteFallback("loadStore", err);
    return seed.getStore(storeId);
  }
}

export async function loadInventory(
  storeId: string,
): Promise<InventoryItem[]> {
  try {
    return await api.fetchInventory(storeId);
  } catch (err) {
    noteFallback("loadInventory", err);
    return seedForStore(storeId, () => seed.getInventory(storeId), "inventory");
  }
}

export async function loadAlerts(storeId: string): Promise<Alert[]> {
  try {
    return await api.fetchAlerts(storeId);
  } catch (err) {
    noteFallback("loadAlerts", err);
    return seedForStore(storeId, () => seed.getAlerts(storeId), "alerts");
  }
}

export async function loadActivity(
  storeId: string,
): Promise<ActivityEvent[]> {
  try {
    return await api.fetchActivity(storeId);
  } catch (err) {
    noteFallback("loadActivity", err);
    return seedForStore(storeId, () => seed.getActivity(storeId), "the activity feed");
  }
}

export async function loadSales(storeId: string): Promise<Sale[]> {
  try {
    return await api.fetchSales(storeId);
  } catch (err) {
    noteFallback("loadSales", err);
    return seedForStore(storeId, () => seed.getSales(storeId), "sales");
  }
}

export async function loadPlanogram(
  storeId: string,
): Promise<PlanogramSlot[]> {
  try {
    return await api.fetchPlanogram(storeId);
  } catch (err) {
    noteFallback("loadPlanogram", err);
    return seedForStore(storeId, () => seed.getPlanogram(storeId), "the planogram");
  }
}

export async function loadFleetSummary(): Promise<FleetSummaryResponse> {
  try {
    return await api.fetchFleetSummary();
  } catch (err) {
    noteFallback("loadFleetSummary", err);
    return computeFleetSummarySeed();
  }
}

export async function loadSalesAnalytics(
  granularity: SalesGranularity,
  timeZone: string,
): Promise<FleetSalesAnalytics> {
  try {
    return await api.fetchSalesAnalytics(granularity, timeZone);
  } catch (err) {
    noteFallback("loadSalesAnalytics", err);
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


/**
 * Fleet-wide planner benchmarks: the mean price per item and mean items per
 * order across the fleet's sales history, or null when there are no sales.
 *
 * Aggregated here from the fleet's sales rather than proxied per store. A
 * benchmark is one coarse fleet-wide number, so fanning out a read per store
 * to build it would be N calls for a single average; the honest tradeoff is
 * that a production build would compute this in SQL in portfolio_api next to
 * the other aggregations, the same way fleet sales analytics already is.
 */
export async function loadPlannerBenchmarks(): Promise<FleetBenchmarks | null> {
  try {
    return await api.fetchPlannerBenchmarks();
  } catch (err) {
    noteFallback("loadPlannerBenchmarks", err);
    const sales = seed
      .getStores()
      .flatMap((store) => seed.getSales(store.id) ?? []);
    return fleetBenchmarks(sales);
  }
}

/** The range id the live product-performance endpoint expects for a day window. */
function rangeForDays(days: number): string {
  if (days === 7) return "7d";
  if (days === 90) return "90d";
  return "30d";
}

/**
 * Fleet-wide product performance over a day window: per-product units, revenue,
 * daily rate and a category-relative index across the whole fleet.
 *
 * Aggregated here from the fleet's sales and inventory, the same tradeoff as the
 * planner benchmarks: it is one cross-store rollup, and a per-store fan-out to
 * build it would be N calls where a production API would compute it in SQL.
 */
export async function loadProductPerformance(
  days: number,
): Promise<readonly ProductPerformanceRow[]> {
  try {
    return await api.fetchProductPerformance(rangeForDays(days));
  } catch (err) {
    noteFallback("loadProductPerformance", err);
    const stores = seed.getStores();
    const sales = stores.flatMap((store) => seed.getSales(store.id) ?? []);
    const items = stores.flatMap((store) => seed.getInventory(store.id) ?? []);
    return fleetProductPerformance(items, sales, days, new Date());
  }
}

/**
 * Fleet-wide shrink: reconciles every store's completed restock counts into
 * unexplained shrink versus reasoned loss, valued at each item's price.
 *
 * Same coarse-rollup tradeoff as the other fleet aggregations here: it walks the
 * seed's completed sessions rather than proxying, and a production build would
 * compute it in SQL in the API.
 */
export async function loadFleetShrink(): Promise<FleetShrink> {
  try {
    return await api.fetchShrinkSummary();
  } catch (err) {
    noteFallback("loadFleetShrink", err);
    const inputs = seed.getStores().map((store) => {
      const inventory = seed.getInventory(store.id) ?? [];
      const priceByItemId: Record<string, number> = {};
      for (const item of inventory) priceByItemId[item.id] = item.price;

      const lines = seed
        .listRestockSessions(store.id)
        .filter((session) => session.completedAt !== null)
        .flatMap((session) => seed.getRestockLines(session.id));

      return { storeId: store.id, storeName: store.name, lines, priceByItemId };
    });

    return fleetShrink(inputs);
  }
}

/**
 * The quick-search index: every store, and every distinct product name across
 * the fleet's inventory. Built here from the seed for the same reason as the
 * other rollups — one small payload the client can rank locally, where a
 * production build would expose a dedicated search endpoint.
 */
export async function loadSearchIndex(): Promise<SearchIndexResponse> {
  try {
    return await api.fetchSearchIndex();
  } catch (err) {
    noteFallback("loadSearchIndex", err);
    const stores = seed.getStores();

    const seenProduct = new Set<string>();
    const products: SearchIndexResponse["products"] = [];
    for (const store of stores) {
      for (const item of seed.getInventory(store.id) ?? []) {
        if (seenProduct.has(item.productName)) continue;
        seenProduct.add(item.productName);
        products.push({ name: item.productName, category: item.category });
      }
    }

    return {
      stores: stores.map((store) => ({
        id: store.id,
        name: store.name,
        status: store.status,
      })),
      products,
    };
  }
}

/**
 * Fleet finance: weekly payouts reconciled from every store's sales, with the
 * fee model surfaced so the breakdown is transparent. Aggregated in the BFF
 * from the seed, the same tradeoff as the other fleet rollups.
 */
export async function loadFinance(): Promise<FinanceResponse> {
  try {
    return await api.fetchFinance();
  } catch (err) {
    noteFallback("loadFinance", err);
    const stores = seed.getStores();
    const sales = stores.flatMap((store) => seed.getSales(store.id) ?? []);
    const { weeks, totals } = summarizeFinance(sales, stores.length, new Date());
    return { weeks: [...weeks], totals, fees: FEE_MODEL };
  }
}

/**
 * Falls through to the seed only when the API is genuinely unreachable.
 *
 * A 401 or 403 means the service token is missing here or does not match
 * portfolio_api, which is a misconfiguration rather than an outage. Falling
 * back on it would be the worst outcome available: the write would appear to
 * succeed against in-memory data, persist nothing, and look exactly like it
 * worked. That is the fiction this dashboard exists to not be, so it is
 * rethrown with a diagnosis instead of swallowed.
 */
function rethrowIfMisconfigured(err: unknown): void {
  if (
    err instanceof api.OperatorApiError &&
    (err.status === 401 || err.status === 403)
  ) {
    console.error(
      `[operator] the API rejected a write with ${err.status}. OPERATOR_SERVICE_TOKEN is likely unset here or different from the one portfolio_api expects. Not falling back to seed data, because that would make the write look like it succeeded.`,
    );
    throw new OperatorServiceTokenError(err.status);
  }
}

// ---------------------------------------------------------------------------
// Writes — fall back to the seed when the API is down, the same as the reads. The
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
  } catch (err) {
    rethrowIfMisconfigured(err);
    return seed.restockItems(storeId, itemIds);
  }
}

export async function applyDismiss(
  alertId: string,
): Promise<Alert | undefined> {
  try {
    return await api.patchDismiss(alertId);
  } catch (err) {
    rethrowIfMisconfigured(err);
    return seed.dismissAlert(alertId);
  }
}

export async function applyPlanogramUpdate(
  storeId: string,
  update: PlanogramUpdate,
): Promise<PlanogramSlot[] | undefined> {
  try {
    return await api.patchPlanogram(storeId, update);
  } catch (err) {
    rethrowIfMisconfigured(err);
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
  } catch (err) {
    rethrowIfMisconfigured(err);
    return seed.openRestockSession(storeId);
  }
}

export async function loadRestockSessions(
  storeId: string,
): Promise<RestockSession[]> {
  try {
    return await api.fetchRestockSessions(storeId);
  } catch (err) {
    noteFallback("loadRestockSessions", err);
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
  } catch (err) {
    rethrowIfMisconfigured(err);
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
  } catch (err) {
    rethrowIfMisconfigured(err);
    return seed.completeRestockSession(sessionId, notes);
  }
}

// ---------------------------------------------------------------------------
// Promotions
// ---------------------------------------------------------------------------

export async function loadPromotions(storeId: string): Promise<Promotion[]> {
  try {
    return await api.fetchPromotions(storeId);
  } catch (err) {
    noteFallback("loadPromotions", err);
    return seed.listPromotions(storeId);
  }
}

export async function createPromotion(
  storeId: string,
  body: api.PromotionBody,
): Promise<Promotion | undefined> {
  try {
    return await api.postPromotion(storeId, body);
  } catch (err) {
    rethrowIfMisconfigured(err);
    return seed.insertPromotion(storeId, body);
  }
}

export async function stopPromotion(
  promotionId: string,
): Promise<Promotion | undefined> {
  try {
    return await api.patchEndPromotion(promotionId);
  } catch (err) {
    rethrowIfMisconfigured(err);
    return seed.endPromotion(promotionId);
  }
}

export async function loadPromotionPerformance(promotionId: string) {
  try {
    return await api.fetchPromotionPerformance(promotionId);
  } catch {
    return seed.getPromotionPerformance(promotionId);
  }
}
