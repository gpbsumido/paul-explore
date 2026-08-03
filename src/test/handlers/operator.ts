import { http, HttpResponse, delay } from "msw";
import type {
  Store,
  InventoryItem,
  Alert,
  ActivityEvent,
  Sale,
  PlanogramSlot,
  StoreSummary,
  RestockSession,
  RestockLine,
  Promotion,
} from "@/types/operator";
import { countStatusOf, describeDraft, resultingStock, summarizeDraft } from "@/lib/operator-restock";
import {
  comparePerformance,
  measurementWindow,
  promotionStatus,
} from "@/lib/operator-promotions";
import { toAlertTrendData } from "@/lib/operator-chart-transforms";
import { deriveSensorMatch } from "@/lib/operator-detail";
import {
  aggregateFleetSales,
  type SalesGranularity,
} from "@/lib/operator-sales";
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

const activityByStore = new Map<string, ActivityEvent[]>(
  stores.map((s) => [s.id, [...buildActivityList(s.id, 15)]]),
);

const salesByStore = new Map<string, Sale[]>(
  stores.map((s) => [s.id, [...buildSalesList(s.id, 90, 540)]]),
);

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
  for (const alert of alerts) {
    allAlerts.set(alert.id, alert);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Write state for the session and promotion flows. Module-level like the rest
// of this file, so a test that creates a promotion would otherwise leak it into
// the next one in the same file.
const sessions = new Map<string, RestockSession>();
const sessionLines = new Map<string, RestockLine[]>();
const promotions = new Map<string, Promotion>();
let sessionCounter = 0;
let promotionCounter = 0;

/** Clears the write state these handlers accumulate. Call it in beforeEach. */
export function resetOperatorWriteState(): void {
  sessions.clear();
  sessionLines.clear();
  promotions.clear();
  sessionCounter = 0;
  promotionCounter = 0;
}

function randomDelay(): Promise<void> {
  return delay(100 + Math.floor(Math.random() * 200));
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

const LOW_STOCK_THRESHOLD = 0.2;

export const operatorHandlers = [
  // GET /api/operator/fleet-summary — aggregated dashboard data
  http.get("/api/operator/fleet-summary", async () => {
    await randomDelay();

    const allAlertsFlat: Alert[] = [];
    let criticalAlerts = 0;
    let warningAlerts = 0;
    let lowStockItems = 0;
    let totalHealth = 0;
    let totalItems = 0;

    const summaries: StoreSummary[] = stores.map((store) => {
      const storeAlerts = alertsByStore.get(store.id) ?? [];
      const inventory = inventoryByStore.get(store.id) ?? [];

      allAlertsFlat.push(...storeAlerts);

      const unacknowledged = storeAlerts.filter((a) => !a.acknowledged);

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

    const alertTrend = toAlertTrendData(allAlertsFlat);

    return HttpResponse.json({ summaries, fleetStats, alertTrend });
  }),

  // GET /api/operator/sales-analytics — fleet-wide sales rollup
  http.get("/api/operator/sales-analytics", async ({ request }) => {
    await randomDelay();
    const url = new URL(request.url);
    const granularities: SalesGranularity[] = ["day", "week", "month", "year"];
    const param = url.searchParams.get("granularity");
    const granularity =
      param && granularities.includes(param as SalesGranularity)
        ? (param as SalesGranularity)
        : "month";

    const fleet = stores.map((store) => ({
      storeId: store.id,
      storeName: store.name,
      sales: salesByStore.get(store.id) ?? [],
    }));

    return HttpResponse.json(aggregateFleetSales(fleet, granularity));
  }),

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

  // GET /api/operator/stores/:id/activity — activity events
  http.get("/api/operator/stores/:id/activity", async ({ params }) => {
    await randomDelay();
    const events = activityByStore.get(params.id as string);
    if (!events) {
      return HttpResponse.json({ error: "Store not found" }, { status: 404 });
    }
    return HttpResponse.json({ events });
  }),

  // GET /api/operator/stores/:id/sales — sales history
  http.get("/api/operator/stores/:id/sales", async ({ params }) => {
    await randomDelay();
    const sales = salesByStore.get(params.id as string);
    if (!sales) {
      return HttpResponse.json({ error: "Store not found" }, { status: 404 });
    }
    return HttpResponse.json({ sales });
  }),

  // GET /api/operator/stores/:id/planogram — persisted shelf layout
  http.get("/api/operator/stores/:id/planogram", async ({ params }) => {
    await randomDelay();
    const slots = planogramByStore.get(params.id as string);
    if (!slots) {
      return HttpResponse.json({ error: "Store not found" }, { status: 404 });
    }
    return HttpResponse.json({ slots });
  }),

  // PATCH /api/operator/stores/:id/planogram — reorder or re-sync a slot
  http.patch(
    "/api/operator/stores/:id/planogram",
    async ({ params, request }) => {
      await randomDelay();
      const storeId = params.id as string;
      const slots = planogramByStore.get(storeId);
      if (!slots) {
        return HttpResponse.json({ error: "Store not found" }, { status: 404 });
      }

      const body = (await request.json()) as {
        boxes?: PlanogramSlot[];
        resyncItemId?: string;
      };

      if (body.boxes) {
        const stored = body.boxes.map((b) => ({ ...b }));
        planogramByStore.set(storeId, stored);
        return HttpResponse.json({ slots: stored });
      }

      if (body.resyncItemId) {
        const updated = slots.map((s) =>
          s.itemId === body.resyncItemId ? { ...s, sensorMatch: true } : s,
        );
        planogramByStore.set(storeId, updated);
        return HttpResponse.json({ slots: updated });
      }

      return HttpResponse.json({ error: "Invalid body" }, { status: 400 });
    },
  ),

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

  // -------------------------------------------------------------------------
  // Restock sessions
  //
  // Mirrors the API's lifecycle closely enough to drive the flow: lines
  // accumulate, and only completing touches inventory.
  // -------------------------------------------------------------------------

  http.post("/api/operator/stores/:id/restock-sessions", async ({ params }) => {
    await randomDelay();
    const storeId = params.id as string;
    if (!inventoryByStore.has(storeId)) {
      return HttpResponse.json({ error: "Store not found" }, { status: 404 });
    }

    sessionCounter += 1;
    const session: RestockSession = {
      id: `session-${String(sessionCounter).padStart(3, "0")}`,
      storeId,
      startedAt: new Date().toISOString(),
      completedAt: null,
      actor: "operator@smartstore.example",
      notes: null,
    };
    sessions.set(session.id, session);
    sessionLines.set(session.id, []);

    return HttpResponse.json({ session }, { status: 201 });
  }),

  http.get("/api/operator/stores/:id/restock-sessions", async ({ params }) => {
    await randomDelay();
    const storeId = params.id as string;
    return HttpResponse.json({
      sessions: [...sessions.values()].filter((s) => s.storeId === storeId),
    });
  }),

  http.get("/api/operator/restock-sessions/:sessionId", async ({ params }) => {
    await randomDelay();
    const id = params.sessionId as string;
    const session = sessions.get(id);
    if (!session) {
      return HttpResponse.json(
        { error: "Restock session not found" },
        { status: 404 },
      );
    }
    return HttpResponse.json({ session, lines: sessionLines.get(id) ?? [] });
  }),

  http.put(
    "/api/operator/restock-sessions/:sessionId/lines/:itemId",
    async ({ params, request }) => {
      await randomDelay();
      const sessionId = params.sessionId as string;
      const session = sessions.get(sessionId);
      if (!session) {
        return HttpResponse.json(
          { error: "Restock session not found" },
          { status: 404 },
        );
      }
      if (session.completedAt) {
        return HttpResponse.json(
          { error: "Session already complete" },
          { status: 409 },
        );
      }

      const body = (await request.json()) as {
        expectedQty: number;
        countedQty: number | null;
        added: number;
        removed: number;
        removalReason: string | null;
      };
      // The API rejects a removal with no reason; the flow relies on that.
      if (body.removed > 0 && body.removalReason === null) {
        return HttpResponse.json(
          { error: "A reason is required when removing stock" },
          { status: 400 },
        );
      }

      const itemId = params.itemId as string;
      const line: RestockLine = {
        id: `${sessionId}-${itemId}`,
        sessionId,
        itemId,
        ...body,
        resultingStock: null,
        countStatus: countStatusOf(body),
      };
      const existing = sessionLines.get(sessionId) ?? [];
      sessionLines.set(sessionId, [
        ...existing.filter((l) => l.itemId !== itemId),
        line,
      ]);

      return HttpResponse.json({ line });
    },
  ),

  http.post(
    "/api/operator/restock-sessions/:sessionId/complete",
    async ({ params, request }) => {
      await randomDelay();
      const sessionId = params.sessionId as string;
      const session = sessions.get(sessionId);
      if (!session) {
        return HttpResponse.json(
          { error: "Restock session not found" },
          { status: 404 },
        );
      }
      if (session.completedAt) {
        return HttpResponse.json(
          { error: "Session already complete" },
          { status: 409 },
        );
      }

      const body = (await request.json()) as { notes: string | null };
      const lines = sessionLines.get(sessionId) ?? [];
      const items = inventoryByStore.get(session.storeId) ?? [];
      const applied: InventoryItem[] = [];
      const frozen: RestockLine[] = [];

      for (const line of lines) {
        const item = items.find((i) => i.id === line.itemId);
        if (!item) continue;
        const resulting = resultingStock(line, item.capacity);
        item.currentStock = resulting;
        applied.push(item);
        frozen.push({ ...line, resultingStock: resulting });
      }

      const closed: RestockSession = {
        ...session,
        completedAt: new Date().toISOString(),
        notes: body.notes,
      };
      sessions.set(sessionId, closed);
      sessionLines.set(sessionId, frozen);

      return HttpResponse.json({
        session: closed,
        lines: frozen,
        items: applied,
        activity: buildActivityEvent({
          storeId: session.storeId,
          type: "restock",
          description: describeDraft(summarizeDraft(frozen)),
        }),
      });
    },
  ),

  // -------------------------------------------------------------------------
  // Promotions
  // -------------------------------------------------------------------------

  http.get("/api/operator/stores/:id/promotions", async ({ params }) => {
    await randomDelay();
    const storeId = params.id as string;
    return HttpResponse.json({
      promotions: [...promotions.values()]
        .filter((p) => p.storeId === storeId)
        .map((p) => ({ ...p, status: promotionStatus(p) })),
    });
  }),

  http.post(
    "/api/operator/stores/:id/promotions",
    async ({ params, request }) => {
      await randomDelay();
      const storeId = params.id as string;
      if (!inventoryByStore.has(storeId)) {
        return HttpResponse.json({ error: "Store not found" }, { status: 404 });
      }

      const body = (await request.json()) as {
        productName: string | null;
        percent: number;
        startsAt: string;
        endsAt: string | null;
      };

      promotionCounter += 1;
      const promotion: Promotion = {
        id: `promo-${String(promotionCounter).padStart(3, "0")}`,
        storeId,
        ...body,
        status: "scheduled",
      };
      promotions.set(promotion.id, promotion);

      return HttpResponse.json(
        { promotion: { ...promotion, status: promotionStatus(promotion) } },
        { status: 201 },
      );
    },
  ),

  http.patch("/api/operator/promotions/:id/end", async ({ params }) => {
    await randomDelay();
    const found = promotions.get(params.id as string);
    if (!found) {
      return HttpResponse.json(
        { error: "Promotion not found" },
        { status: 404 },
      );
    }

    const ended: Promotion = { ...found, endsAt: new Date().toISOString() };
    promotions.set(ended.id, ended);
    return HttpResponse.json({
      promotion: { ...ended, status: promotionStatus(ended) },
    });
  }),

  http.get("/api/operator/promotions/:id/performance", async ({ params }) => {
    await randomDelay();
    const promo = promotions.get(params.id as string);
    if (!promo) {
      return HttpResponse.json(
        { error: "Promotion not found" },
        { status: 404 },
      );
    }

    const win = measurementWindow(
      new Date(promo.startsAt),
      promo.endsAt ? new Date(promo.endsAt) : new Date(),
    );
    const sales = salesByStore.get(promo.storeId) ?? [];
    const comparison = comparePerformance(promo, sales, win.start, win.end);

    return HttpResponse.json({
      promotion: { ...promo, status: promotionStatus(promo) },
      ...comparison,
      measuredFrom: win.start.toISOString(),
      measuredTo: win.end.toISOString(),
      note: "Comparison against the equal-length period before this promotion. It is not a claim that the promotion caused the difference.",
    });
  }),
];
