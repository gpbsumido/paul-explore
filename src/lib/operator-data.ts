import type {
  Store,
  InventoryItem,
  Alert,
  ActivityEvent,
} from "@/types/operator";
import {
  buildStoreList,
  buildInventoryList,
  buildAlertList,
  buildActivityList,
  buildActivityEvent,
  resetFactoryCounter,
} from "@/test/factories/operator";

// ---------------------------------------------------------------------------
// Seeded in-memory data for demo mode (no real backend)
// ---------------------------------------------------------------------------

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

const allAlerts = new Map<string, Alert>();
for (const alerts of alertsByStore.values()) {
  for (const a of alerts) {
    allAlerts.set(a.id, a);
  }
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
  return stores.map(withFreshPing);
}

export function getStore(id: string): Store | undefined {
  const store = stores.find((s) => s.id === id);
  return store ? withFreshPing(store) : undefined;
}

export function getInventory(storeId: string): InventoryItem[] | undefined {
  return inventoryByStore.get(storeId);
}

export function getAlerts(storeId: string): Alert[] | undefined {
  return alertsByStore.get(storeId);
}

export function getActivity(storeId: string): ActivityEvent[] | undefined {
  return activityByStore.get(storeId);
}

export function getAlert(alertId: string): Alert | undefined {
  return allAlerts.get(alertId);
}

export function dismissAlert(alertId: string): Alert | undefined {
  const existing = allAlerts.get(alertId);
  if (!existing) return undefined;

  const updated = { ...existing, acknowledged: true };
  allAlerts.set(alertId, updated);

  const storeAlerts = alertsByStore.get(updated.storeId);
  if (storeAlerts) {
    alertsByStore.set(
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
  const inventory = inventoryByStore.get(storeId);
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

  inventoryByStore.set(storeId, updatedInventory);

  const activity = buildActivityEvent({
    storeId,
    type: "restock",
    description: `Restocked ${restocked.length} item(s) to full capacity`,
  });

  return { items: restocked, activity };
}
