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
import { fleetBenchmarks } from "@/lib/operator-planner";
import {
  fleetProductPerformance,
  daysForRange,
} from "@/lib/operator-product-performance";
import { fleetShrink } from "@/lib/operator-shrink";
import { summarizeFinance, FEE_MODEL } from "@/lib/operator-finance";
import {
  buildStoreList,
  buildInventoryList,
  buildAlertList,
  buildActivityList,
  buildActivityEvent,
  buildSalesList,
  resetFactoryCounter,
} from "@/test/factories/operator";


/**
 * Handlers must match the URL the BFF actually requests, which is absolute.
 *
 * All 21 registrations carry the base, including the four written across
 * several lines. The first pass at this only caught the ones where the path sat
 * on the same line as the http.* call, so four write endpoints -- planogram,
 * restock lines, session completion and promotions -- kept their bare paths and
 * kept missing. A partial fix to this bug looks exactly like a whole one from
 * the test output, because the tests pass either way.
 *
 * They used to be registered on bare paths. MSW resolves a relative handler
 * against the document origin, which under jsdom is port 3000, while the BFF
 * calls the API on 3001 -- so nothing matched. With onUnhandledRequest set to
 * "error" that should have been loud, and it was: MSW refused the request. But
 * the BFF catches a failed call and falls back to seeded data by design, so it
 * swallowed the refusal and returned a plausible answer, and the tests went
 * green. A test named "returns a list of stores that pass schema validation"
 * was validating the seed rather than anything the API said, 40 times in one
 * file. The fallback that keeps the demo alive had eaten the mechanism meant
 * to catch missing handlers.
 */
// Read straight from the environment rather than importing backendFetch. This
// module is loaded during test setup for every file, so importing the app's
// fetch layer here pulls it into suites that deliberately mock its
// dependencies, and their mocks stop lining up. Same default as backendFetch;
// the duplication is one line and buys full isolation.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

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

const handlersFor = (API_BASE: string) => [
  // GET /api/operator/fleet-summary — aggregated dashboard data
  http.get(`${API_BASE}/api/operator/fleet-summary`, async () => {
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
  http.get(`${API_BASE}/api/operator/sales-analytics`, async ({ request }) => {
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

  // GET /api/operator/planner/benchmarks — fleet basket price + items/order
  http.get(`${API_BASE}/api/operator/planner/benchmarks`, async () => {
    await randomDelay();
    const sales = stores.flatMap((s) => salesByStore.get(s.id) ?? []);
    return HttpResponse.json({ benchmarks: fleetBenchmarks(sales) });
  }),

  // GET /api/operator/product-performance — per-product over a day window
  http.get(
    `${API_BASE}/api/operator/product-performance`,
    async ({ request }) => {
      await randomDelay();
      const rangeId = new URL(request.url).searchParams.get("range") ?? "30d";
      const days = daysForRange(rangeId);
      const sales = stores.flatMap((s) => salesByStore.get(s.id) ?? []);
      const items = stores.flatMap((s) => inventoryByStore.get(s.id) ?? []);
      return HttpResponse.json({
        rangeId,
        days,
        products: fleetProductPerformance(items, sales, days),
      });
    },
  ),

  // GET /api/operator/shrink-summary — unexplained vs reasoned loss per store
  http.get(`${API_BASE}/api/operator/shrink-summary`, async () => {
    await randomDelay();
    const inputs = stores.map((store, storeIndex) => {
      const items = inventoryByStore.get(store.id) ?? [];
      const priceByItemId: Record<string, number> = {};
      for (const item of items) priceByItemId[item.id] = item.price;
      const lines = items.map((item, i) => {
        const expectedQty = Math.max(2, Math.round(item.capacity * 0.5));
        const bucket = (i + storeIndex) % 4;
        return {
          itemId: item.id,
          expectedQty,
          countedQty:
            bucket === 2
              ? null
              : Math.max(0, expectedQty - (1 + ((i + storeIndex) % 3))),
          removed: bucket === 1 ? 1 + (i % 2) : 0,
          removalReason: bucket === 1 ? "expired" : null,
        };
      });
      return { storeId: store.id, storeName: store.name, lines, priceByItemId };
    });
    return HttpResponse.json(fleetShrink(inputs));
  }),

  // GET /api/operator/search-index — stores + distinct fleet products
  http.get(`${API_BASE}/api/operator/search-index`, async () => {
    await randomDelay();
    const seen = new Set<string>();
    const products: { name: string; category: string }[] = [];
    for (const store of stores) {
      for (const item of inventoryByStore.get(store.id) ?? []) {
        if (seen.has(item.productName)) continue;
        seen.add(item.productName);
        products.push({ name: item.productName, category: item.category });
      }
    }
    return HttpResponse.json({
      stores: stores.map((s) => ({ id: s.id, name: s.name, status: s.status })),
      products,
    });
  }),

  // GET /api/operator/finance — weekly payouts reconciled from sales
  http.get(`${API_BASE}/api/operator/finance`, async () => {
    await randomDelay();
    const sales = stores.flatMap((s) => salesByStore.get(s.id) ?? []);
    const { weeks, totals } = summarizeFinance(sales, stores.length, new Date());
    return HttpResponse.json({ weeks, totals, fees: FEE_MODEL });
  }),

  // GET /api/operator/stores — fleet list
  http.get(`${API_BASE}/api/operator/stores`, async () => {
    await randomDelay();
    return HttpResponse.json({ stores });
  }),

  // GET /api/operator/stores/:id — store detail
  http.get(`${API_BASE}/api/operator/stores/:id`, async ({ params }) => {
    await randomDelay();
    const store = stores.find((s) => s.id === params.id);
    if (!store) {
      return HttpResponse.json({ error: "Store not found" }, { status: 404 });
    }
    return HttpResponse.json({ store });
  }),

  // GET /api/operator/stores/:id/inventory — inventory list
  http.get(`${API_BASE}/api/operator/stores/:id/inventory`, async ({ params }) => {
    await randomDelay();
    const items = inventoryByStore.get(params.id as string);
    if (!items) {
      return HttpResponse.json({ error: "Store not found" }, { status: 404 });
    }
    return HttpResponse.json({ items });
  }),

  // GET /api/operator/stores/:id/alerts — alerts for a store
  http.get(`${API_BASE}/api/operator/stores/:id/alerts`, async ({ params }) => {
    await randomDelay();
    const alerts = alertsByStore.get(params.id as string);
    if (!alerts) {
      return HttpResponse.json({ error: "Store not found" }, { status: 404 });
    }
    return HttpResponse.json({ alerts });
  }),

  // GET /api/operator/stores/:id/activity — activity events
  http.get(`${API_BASE}/api/operator/stores/:id/activity`, async ({ params }) => {
    await randomDelay();
    const events = activityByStore.get(params.id as string);
    if (!events) {
      return HttpResponse.json({ error: "Store not found" }, { status: 404 });
    }
    return HttpResponse.json({ events });
  }),

  // GET /api/operator/stores/:id/sales — sales history
  http.get(`${API_BASE}/api/operator/stores/:id/sales`, async ({ params }) => {
    await randomDelay();
    const sales = salesByStore.get(params.id as string);
    if (!sales) {
      return HttpResponse.json({ error: "Store not found" }, { status: 404 });
    }
    return HttpResponse.json({ sales });
  }),

  // GET /api/operator/stores/:id/planogram — persisted shelf layout
  http.get(`${API_BASE}/api/operator/stores/:id/planogram`, async ({ params }) => {
    await randomDelay();
    const slots = planogramByStore.get(params.id as string);
    if (!slots) {
      return HttpResponse.json({ error: "Store not found" }, { status: 404 });
    }
    return HttpResponse.json({ slots });
  }),

  // PATCH /api/operator/stores/:id/planogram — reorder or re-sync a slot
  http.patch(
    `${API_BASE}/api/operator/stores/:id/planogram`,
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
  http.patch(`${API_BASE}/api/operator/alerts/:id/dismiss`, async ({ params }) => {
    await randomDelay();
    const alert = allAlerts.get(params.id as string);
    if (!alert) {
      return HttpResponse.json({ error: "Alert not found" }, { status: 404 });
    }
    alert.acknowledged = true;
    return HttpResponse.json({ alert });
  }),

  // POST /api/operator/stores/:id/restock — mark items restocked
  http.post(`${API_BASE}/api/operator/stores/:id/restock`, async ({ params, request }) => {
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

  http.post(`${API_BASE}/api/operator/stores/:id/restock-sessions`, async ({ params }) => {
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

  http.get(`${API_BASE}/api/operator/stores/:id/restock-sessions`, async ({ params }) => {
    await randomDelay();
    const storeId = params.id as string;
    return HttpResponse.json({
      sessions: [...sessions.values()].filter((s) => s.storeId === storeId),
    });
  }),

  http.get(`${API_BASE}/api/operator/restock-sessions/:sessionId`, async ({ params }) => {
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
    `${API_BASE}/api/operator/restock-sessions/:sessionId/lines/:itemId`,
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
    `${API_BASE}/api/operator/restock-sessions/:sessionId/complete`,
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

  http.get(`${API_BASE}/api/operator/stores/:id/promotions`, async ({ params }) => {
    await randomDelay();
    const storeId = params.id as string;
    return HttpResponse.json({
      promotions: [...promotions.values()]
        .filter((p) => p.storeId === storeId)
        .map((p) => ({ ...p, status: promotionStatus(p) })),
    });
  }),

  http.post(
    `${API_BASE}/api/operator/stores/:id/promotions`,
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

  http.patch(`${API_BASE}/api/operator/promotions/:id/end`, async ({ params }) => {
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

  http.get(`${API_BASE}/api/operator/promotions/:id/performance`, async ({ params }) => {
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

/**
 * Registered against both bases on purpose.
 *
 * Two different callers reach these endpoints in tests. Component and route
 * tests fetch the Next route on a relative path; the BFF calls portfolio_api on
 * an absolute one. Handlers were registered relative only, so MSW resolved them
 * against the jsdom origin on port 3000 while the BFF asked for 3001 and
 * matched nothing.
 *
 * That should have been loud -- onUnhandledRequest is "error" -- and MSW did
 * refuse. But the BFF catches a failed call and falls back to seeded data by
 * design, so it swallowed the refusal and returned a plausible answer. Every
 * affected test passed while asserting against the seed, 40 times in one file,
 * visible only as warnings in a green log.
 */
export const operatorHandlers = [
  ...handlersFor(""),
  ...handlersFor(API_URL),
];
