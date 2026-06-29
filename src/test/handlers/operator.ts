import { http, HttpResponse, delay } from "msw";
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
  buildActivityEvent,
  resetFactoryCounter,
} from "@/test/factories/operator";

// ---------------------------------------------------------------------------
// Seed data — generated once, mutated in-place by handlers
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

const allAlerts = new Map<string, Alert>();
for (const alerts of alertsByStore.values()) {
  for (const alert of alerts) {
    allAlerts.set(alert.id, alert);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function randomDelay(): Promise<void> {
  return delay(100 + Math.floor(Math.random() * 200));
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

export const operatorHandlers = [
  // GET /api/operator/stores — fleet list
  http.get("/api/operator/stores", async () => {
    await randomDelay();
    return HttpResponse.json({ stores });
  }),

  // GET /api/operator/stores/:id — store detail
  http.get("/api/operator/stores/:id", async ({ params }) => {
    await randomDelay();
    const store = stores.find((s) => s.id === params.id);
    if (!store) {
      return HttpResponse.json({ error: "Store not found" }, { status: 404 });
    }
    return HttpResponse.json({ store });
  }),

  // GET /api/operator/stores/:id/inventory — inventory list
  http.get("/api/operator/stores/:id/inventory", async ({ params }) => {
    await randomDelay();
    const items = inventoryByStore.get(params.id as string);
    if (!items) {
      return HttpResponse.json({ error: "Store not found" }, { status: 404 });
    }
    return HttpResponse.json({ items });
  }),

  // GET /api/operator/stores/:id/alerts — alerts for a store
  http.get("/api/operator/stores/:id/alerts", async ({ params }) => {
    await randomDelay();
    const alerts = alertsByStore.get(params.id as string);
    if (!alerts) {
      return HttpResponse.json({ error: "Store not found" }, { status: 404 });
    }
    return HttpResponse.json({ alerts });
  }),

  // PATCH /api/operator/alerts/:id/dismiss — dismiss an alert
  http.patch("/api/operator/alerts/:id/dismiss", async ({ params }) => {
    await randomDelay();
    const alert = allAlerts.get(params.id as string);
    if (!alert) {
      return HttpResponse.json({ error: "Alert not found" }, { status: 404 });
    }
    alert.acknowledged = true;
    return HttpResponse.json({ alert });
  }),

  // POST /api/operator/stores/:id/restock — mark items restocked
  http.post("/api/operator/stores/:id/restock", async ({ params, request }) => {
    await randomDelay();
    const storeId = params.id as string;
    const items = inventoryByStore.get(storeId);
    if (!items) {
      return HttpResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const body = (await request.json()) as { itemIds: string[] };
    const restocked: InventoryItem[] = [];

    for (const item of items) {
      if (body.itemIds.includes(item.id)) {
        item.currentStock = item.capacity;
        restocked.push(item);
      }
    }

    const activity: ActivityEvent = buildActivityEvent({
      storeId,
      type: "restock",
      description: `Restocked ${restocked.length} item(s) to full capacity`,
    });

    return HttpResponse.json({ items: restocked, activity });
  }),
];
