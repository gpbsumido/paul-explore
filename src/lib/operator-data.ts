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
} from "@/types/operator";
import { deriveSensorMatch } from "@/lib/operator-detail";
import type { RestockLineBody } from "@/lib/operator-restock-types";
import {
  countStatusOf,
  describeDraft,
  resultingStock,
  summarizeDraft,
} from "@/lib/operator-restock";
import {
  comparePerformance,
  measurementWindow,
  promotionStatus,
} from "@/lib/operator-promotions";
import {
  buildStoreList,
  buildInventoryList,
  buildAlertList,
  buildActivityList,
  buildActivityEvent,
  buildSalesList,
  resetFactoryCounter,
} from "@/test/factories/operator";

// ---------------------------------------------------------------------------
// Seeded in-memory data for demo mode (no real backend)
//
// Next.js bundles each route handler independently, so a plain module-level
// variable can end up as a separate instance per route. Attaching the data
// store to globalThis guarantees every route handler (dismiss, alerts GET,
// fleet-summary, etc.) shares the same in-memory state.
// ---------------------------------------------------------------------------

type OperatorDataStore = {
  stores: Store[];
  inventoryByStore: Map<string, InventoryItem[]>;
  alertsByStore: Map<string, Alert[]>;
  activityByStore: Map<string, ActivityEvent[]>;
  salesByStore: Map<string, Sale[]>;
  planogramByStore: Map<string, PlanogramSlot[]>;
  allAlerts: Map<string, Alert>;
  /** Restock sessions, so the flow still works with the backend unreachable. */
  restockSessions: Map<string, RestockSession>;
  restockLines: Map<string, RestockLine[]>;
  promotions: Map<string, Promotion>;
};

const GLOBAL_KEY = "__operatorDataStore" as const;

function initDataStore(): OperatorDataStore {
  resetFactoryCounter();

  const DEGRADED_INDEX = 2;

  const stores: Store[] = [...buildStoreList(6)].map((s, i) => {
    if (i === DEGRADED_INDEX) {
      return {
        ...s,
        status: "degraded" as const,
        temperature: 8.4,
        uptime: 72.3,
        lastPing: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
      };
    }
    return { ...s };
  });

  const inventoryByStore = new Map<string, InventoryItem[]>(
    stores.map((s) => [s.id, [...buildInventoryList(s.id, 6)]]),
  );

  const alertsByStore = new Map<string, Alert[]>(
    stores.map((s) => [s.id, [...buildAlertList(s.id, 4)]]),
  );

  const activityByStore = new Map<string, ActivityEvent[]>(
    stores.map((s) => [s.id, [...buildActivityList(s.id, 15)]]),
  );

  // Spread ~18 months of sales so the day/week/month/year analytics all have data.
  const salesByStore = new Map<string, Sale[]>(
    stores.map((s) => [s.id, [...buildSalesList(s.id, 90, 540)]]),
  );

  // Planogram starts with each item in its own box, then pads to full shelves
  // plus one spare empty shelf so there's room to move products into empty
  // boxes. Sensor match is seeded deterministically from the item id.
  const PLANOGRAM_SHELF_WIDTH = 4;
  const planogramByStore = new Map<string, PlanogramSlot[]>(
    stores.map((s) => {
      const boxes: PlanogramSlot[] = (inventoryByStore.get(s.id) ?? []).map(
        (item) => ({ itemId: item.id, sensorMatch: deriveSensorMatch(item.id) }),
      );
      const targetLen =
        (Math.ceil(boxes.length / PLANOGRAM_SHELF_WIDTH) + 1) *
        PLANOGRAM_SHELF_WIDTH;
      while (boxes.length < targetLen) {
        boxes.push({ itemId: null, sensorMatch: true });
      }
      return [s.id, boxes];
    }),
  );

  const allAlerts = new Map<string, Alert>();
  for (const alerts of alertsByStore.values()) {
    for (const a of alerts) {
      allAlerts.set(a.id, a);
    }
  }

  return {
    stores,
    inventoryByStore,
    alertsByStore,
    activityByStore,
    salesByStore,
    planogramByStore,
    allAlerts,
    restockSessions: new Map<string, RestockSession>(),
    restockLines: new Map<string, RestockLine[]>(),
    promotions: new Map<string, Promotion>(),
  };
}

function getDataStore(): OperatorDataStore {
  const g = globalThis as unknown as Record<string, OperatorDataStore>;
  if (!g[GLOBAL_KEY]) {
    g[GLOBAL_KEY] = initDataStore();
  }
  return g[GLOBAL_KEY];
}

// ---------------------------------------------------------------------------
// Accessors
// ---------------------------------------------------------------------------

/**
 * Recomputes lastPing relative to now so demo data never drifts into "offline".
 * Online stores get a 0-60s-old ping; degraded stores get a 7-min-old ping.
 */
function withFreshPing(store: Store): Store {
  if (store.status !== "online") {
    return {
      ...store,
      lastPing: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
    };
  }
  return {
    ...store,
    lastPing: new Date(Date.now() - Math.random() * 60_000).toISOString(),
  };
}

export function getStores(): readonly Store[] {
  return getDataStore().stores.map(withFreshPing);
}

export function getStore(id: string): Store | undefined {
  const store = getDataStore().stores.find((s) => s.id === id);
  return store ? withFreshPing(store) : undefined;
}

export function getInventory(storeId: string): InventoryItem[] | undefined {
  return getDataStore().inventoryByStore.get(storeId);
}

export function getAlerts(storeId: string): Alert[] | undefined {
  return getDataStore().alertsByStore.get(storeId);
}

export function getActivity(storeId: string): ActivityEvent[] | undefined {
  return getDataStore().activityByStore.get(storeId);
}

export function getSales(storeId: string): Sale[] | undefined {
  return getDataStore().salesByStore.get(storeId);
}

export function getPlanogram(storeId: string): PlanogramSlot[] | undefined {
  return getDataStore().planogramByStore.get(storeId);
}

/**
 * Replaces a store's planogram boxes with a new arrangement (produced by the
 * client moving a product between boxes). Stored as fresh objects so reference
 * identity changes for React.
 */
export function setPlanogram(
  storeId: string,
  boxes: readonly PlanogramSlot[],
): PlanogramSlot[] | undefined {
  const ds = getDataStore();
  if (!ds.planogramByStore.has(storeId)) return undefined;
  const stored = boxes.map((b) => ({ ...b }));
  ds.planogramByStore.set(storeId, stored);
  return stored;
}

/**
 * Clears a slot's sensor mismatch by marking it as matching again, returning
 * new slot objects so reference identity changes for React.
 */
export function resyncPlanogramSlot(
  storeId: string,
  itemId: string,
): PlanogramSlot[] | undefined {
  const ds = getDataStore();
  const slots = ds.planogramByStore.get(storeId);
  if (!slots) return undefined;

  const updated = slots.map((s) =>
    s.itemId === itemId ? { ...s, sensorMatch: true } : s,
  );
  ds.planogramByStore.set(storeId, updated);
  return updated;
}

export function dismissAlert(alertId: string): Alert | undefined {
  const ds = getDataStore();
  const existing = ds.allAlerts.get(alertId);
  if (!existing) return undefined;

  const updated = { ...existing, acknowledged: true };
  ds.allAlerts.set(alertId, updated);

  const storeAlerts = ds.alertsByStore.get(updated.storeId);
  if (storeAlerts) {
    ds.alertsByStore.set(
      updated.storeId,
      storeAlerts.map((a) => (a.id === alertId ? updated : a)),
    );
  }

  return updated;
}

export function restockItems(
  storeId: string,
  itemIds: readonly string[],
): { items: InventoryItem[]; activity: ActivityEvent } | undefined {
  const ds = getDataStore();
  const inventory = ds.inventoryByStore.get(storeId);
  if (!inventory) return undefined;

  const targetIds = new Set(itemIds);
  const restocked: InventoryItem[] = [];
  const updatedInventory = inventory.map((item) => {
    if (targetIds.has(item.id)) {
      const updated = { ...item, currentStock: item.capacity };
      restocked.push(updated);
      return updated;
    }
    return item;
  });

  ds.inventoryByStore.set(storeId, updatedInventory);

  const activity = buildActivityEvent({
    storeId,
    type: "restock",
    description: `Restocked ${restocked.length} item(s) to full capacity`,
  });

  return { items: restocked, activity };
}

// ---------------------------------------------------------------------------
// Restock sessions (seed fallback)
//
// Mirrors the API's session lifecycle closely enough that the flow behaves the
// same when portfolio_api is unreachable: lines accumulate, and only completing
// touches inventory.
// ---------------------------------------------------------------------------

let sessionCounter = 0;

export function openRestockSession(storeId: string): RestockSession | undefined {
  const ds = getDataStore();
  if (!ds.stores.some((s) => s.id === storeId)) return undefined;

  sessionCounter += 1;
  const session: RestockSession = {
    id: `session-${String(sessionCounter).padStart(3, "0")}`,
    storeId,
    startedAt: new Date().toISOString(),
    completedAt: null,
    actor: "operator@smartstore.example",
    notes: null,
  };

  ds.restockSessions.set(session.id, session);
  ds.restockLines.set(session.id, []);
  return session;
}

export function getRestockSession(sessionId: string): RestockSession | undefined {
  return getDataStore().restockSessions.get(sessionId);
}

export function listRestockSessions(storeId: string): RestockSession[] {
  return [...getDataStore().restockSessions.values()]
    .filter((s) => s.storeId === storeId)
    .sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1));
}

export function getRestockLines(sessionId: string): RestockLine[] {
  return getDataStore().restockLines.get(sessionId) ?? [];
}

export function upsertRestockLine(
  sessionId: string,
  itemId: string,
  values: RestockLineBody,
): RestockLine | undefined {
  const ds = getDataStore();
  const session = ds.restockSessions.get(sessionId);
  if (!session) return undefined;

  const lines = ds.restockLines.get(sessionId) ?? [];
  const line: RestockLine = {
    id: `${sessionId}-${itemId}`,
    sessionId,
    itemId,
    expectedQty: values.expectedQty,
    countedQty: values.countedQty,
    added: values.added,
    removed: values.removed,
    removalReason: values.removalReason,
    resultingStock: null,
    countStatus: countStatusOf(values),
  };

  const without = lines.filter((l) => l.itemId !== itemId);
  ds.restockLines.set(sessionId, [...without, line]);
  return line;
}

export function completeRestockSession(
  sessionId: string,
  notes: string | null,
):
  | {
      session: RestockSession;
      lines: RestockLine[];
      items: InventoryItem[];
      activity: ActivityEvent;
    }
  | undefined {
  const ds = getDataStore();
  const session = ds.restockSessions.get(sessionId);
  if (!session) return undefined;

  const lines = ds.restockLines.get(sessionId) ?? [];
  const inventory = ds.inventoryByStore.get(session.storeId) ?? [];
  const byItem = new Map(lines.map((l) => [l.itemId, l]));

  const applied: InventoryItem[] = [];
  const frozen: RestockLine[] = [];

  const updatedInventory = inventory.map((item) => {
    const line = byItem.get(item.id);
    if (!line) return item;

    const resulting = resultingStock(line, item.capacity);
    frozen.push({ ...line, resultingStock: resulting });

    const updated = { ...item, currentStock: resulting };
    applied.push(updated);
    return updated;
  });

  ds.inventoryByStore.set(session.storeId, updatedInventory);
  ds.restockLines.set(sessionId, frozen);

  const activity = buildActivityEvent({
    storeId: session.storeId,
    type: "restock",
    description: describeDraft(summarizeDraft(frozen)),
  });

  const closed: RestockSession = {
    ...session,
    completedAt: new Date().toISOString(),
    notes,
  };
  ds.restockSessions.set(sessionId, closed);

  const events = ds.activityByStore.get(session.storeId) ?? [];
  ds.activityByStore.set(session.storeId, [activity, ...events]);

  return { session: closed, lines: frozen, items: applied, activity };
}

// ---------------------------------------------------------------------------
// Promotions (seed fallback)
// ---------------------------------------------------------------------------

let promotionCounter = 0;

export function listPromotions(storeId: string): Promotion[] {
  return [...getDataStore().promotions.values()]
    .filter((p) => p.storeId === storeId)
    .sort((a, b) => (a.startsAt < b.startsAt ? 1 : -1))
    .map(withDerivedStatus);
}

export function getPromotion(id: string): Promotion | undefined {
  const found = getDataStore().promotions.get(id);
  return found ? withDerivedStatus(found) : undefined;
}

export function insertPromotion(
  storeId: string,
  body: {
    productName: string | null;
    percent: number;
    startsAt: string;
    endsAt: string | null;
  },
): Promotion | undefined {
  const ds = getDataStore();
  if (!ds.stores.some((s) => s.id === storeId)) return undefined;

  promotionCounter += 1;
  const promo: Promotion = {
    id: `promo-${String(promotionCounter).padStart(3, "0")}`,
    storeId,
    productName: body.productName,
    percent: body.percent,
    startsAt: body.startsAt,
    endsAt: body.endsAt,
    status: "scheduled",
  };

  ds.promotions.set(promo.id, promo);

  const activity = buildActivityEvent({
    storeId,
    type: "price-update",
    description: `Scheduled ${body.percent}% off ${body.productName ?? "every product"}`,
  });
  const events = ds.activityByStore.get(storeId) ?? [];
  ds.activityByStore.set(storeId, [activity, ...events]);

  return withDerivedStatus(promo);
}

export function endPromotion(id: string): Promotion | undefined {
  const ds = getDataStore();
  const found = ds.promotions.get(id);
  if (!found) return undefined;

  const ended: Promotion = { ...found, endsAt: new Date().toISOString() };
  ds.promotions.set(id, ended);
  return withDerivedStatus(ended);
}

function withDerivedStatus(promo: Promotion): Promotion {
  return { ...promo, status: promotionStatus(promo) };
}

/**
 * Promotion performance from the seed sales, mirroring the API's arithmetic so
 * the readout still renders with the backend unreachable.
 */
export function getPromotionPerformance(id: string):
  | {
      promotion: Promotion;
      window: { units: number; revenue: number };
      baseline: { units: number; revenue: number };
      unitsChangePercent: number | null;
      revenueChangePercent: number | null;
      measuredFrom: string;
      measuredTo: string;
      note: string;
    }
  | undefined {
  const promo = getPromotion(id);
  if (!promo) return undefined;

  const win = measurementWindow(
    new Date(promo.startsAt),
    promo.endsAt ? new Date(promo.endsAt) : new Date(),
  );
  const sales = getDataStore().salesByStore.get(promo.storeId) ?? [];
  const comparison = comparePerformance(promo, sales, win.start, win.end);

  const base =
    "Comparison against the equal-length period before this promotion. It is not a claim that the promotion caused the difference.";

  return {
    promotion: promo,
    ...comparison,
    measuredFrom: win.start.toISOString(),
    measuredTo: win.end.toISOString(),
    note: win.clamped
      ? `${base} This promotion has run longer than 180 days, so only its most recent 180 days are measured.`
      : base,
  };
}
