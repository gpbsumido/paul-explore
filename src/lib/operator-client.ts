// Client for the portfolio_api operator endpoints. The operator dashboard is a
// public demo, so these are unauthenticated reads and writes. Responses are
// validated against the same Zod schemas the UI uses, so a drifting API
// surfaces as a clear error the BFF can fall back on instead of bad UI state.

import { z } from "zod";
import {
  storeSchema,
  inventoryItemSchema,
  alertSchema,
  activityEventSchema,
  saleSchema,
  planogramSlotSchema,
  promotionPerformanceSchema,
  promotionSchema,
  restockLineSchema,
  restockSessionSchema,
  fleetSummaryResponseSchema,
  fleetSalesAnalyticsSchema,
} from "@/lib/operator-schemas";
import type {
  Store,
  InventoryItem,
  Alert,
  ActivityEvent,
  Sale,
  PlanogramSlot,
  FleetSummaryResponse,
} from "@/types/operator";
import { API_URL } from "@/lib/backendFetch";
import { safeSegment } from "@/lib/safeSegment";
import { VISITOR_HEADER, readVisitorId } from "@/lib/operator-visitor";
import type { RestockLineBody } from "@/lib/operator-restock-types";
import {
  plannerBenchmarksResponseSchema,
  type FleetBenchmarks,
} from "@/lib/operator-planner";
import {
  productPerformanceResponseSchema,
  type ProductPerformanceRow,
} from "@/lib/operator-product-performance";
import { fleetShrinkResponseSchema, type FleetShrink } from "@/lib/operator-shrink";
import {
  searchIndexResponseSchema,
  type SearchIndexResponse,
} from "@/lib/operator-search";
import { financeResponseSchema, type FinanceResponse } from "@/lib/operator-finance";

const BASE = `${API_URL}/api/operator`;

/**
 * Shared secret the operator API expects on writes. Server-side only, never
 * NEXT_PUBLIC_, so it stays out of the browser bundle. Its whole job is to let
 * the API tell "a visitor using the dashboard" apart from "someone with curl",
 * without asking the visitor to log in.
 */
async function writeHeaders(): Promise<Record<string, string>> {
  return {
    "Content-Type": "application/json",
    ...(await callerHeaders()),
  };
}

/**
 * Who we are, and who is asking.
 *
 * The service token says the request came from this app rather than from curl.
 * The visitor id says which browser, so the API can rate limit per visitor
 * instead of per egress IP and record something meaningful as the actor. Reads
 * carry it too, since a runaway read loop is exactly what a fairness limit is
 * for.
 */
async function callerHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};

  const token = process.env.OPERATOR_SERVICE_TOKEN;
  if (token) headers["x-operator-token"] = token;

  const visitor = await readVisitorId();
  if (visitor) headers[VISITOR_HEADER] = visitor;

  return headers;
}

/**
 * The API answered with a non-2xx status. Distinct from a thrown fetch (the API
 * being unreachable) so the BFF can fall back to the seed only when the service
 * is truly down.
 */
export class OperatorApiError extends Error {
  constructor(readonly status: number) {
    super(`operator API responded ${status}`);
    this.name = "OperatorApiError";
  }
}

/**
 * How long a read waits on the upstream before giving up. A cross-service fetch
 * with no deadline can hang for as long as the other end takes to fail, and
 * these reads sit on a page's render path — a hung upstream became a nine-second
 * store detail. On timeout the fetch aborts and throws, which the BFF treats as
 * "service down" and answers from the seed. Reads only: a write that times out
 * might have applied upstream, so it must not silently fall back.
 */
const READ_TIMEOUT_MS = 5000;

async function getJson<T>(
  path: string,
  schema: z.ZodType<T>,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    cache: "no-store",
    headers: await callerHeaders(),
    signal: AbortSignal.timeout(READ_TIMEOUT_MS),
  });
  if (!res.ok) throw new OperatorApiError(res.status);
  return schema.parse(await res.json());
}

async function sendJson<T>(
  path: string,
  method: "POST" | "PATCH" | "PUT",
  body: unknown,
  schema: z.ZodType<T>,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: await writeHeaders(),
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) throw new OperatorApiError(res.status);
  return schema.parse(await res.json());
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

const storesPayload = z.object({ stores: z.array(storeSchema) });
const storePayload = z.object({ store: storeSchema });
const inventoryPayload = z.object({ items: z.array(inventoryItemSchema) });
const alertsPayload = z.object({ alerts: z.array(alertSchema) });
const activityPayload = z.object({ events: z.array(activityEventSchema) });
const salesPayload = z.object({ sales: z.array(saleSchema) });
const planogramPayload = z.object({ slots: z.array(planogramSlotSchema) });

export async function fetchStores(): Promise<Store[]> {
  return (await getJson("/stores", storesPayload)).stores;
}

export async function fetchStore(storeId: string): Promise<Store> {
  return (await getJson(`/stores/${safeSegment(storeId)}`, storePayload)).store;
}

export async function fetchInventory(
  storeId: string,
): Promise<InventoryItem[]> {
  return (await getJson(`/stores/${safeSegment(storeId)}/inventory`, inventoryPayload))
    .items;
}

export async function fetchAlerts(storeId: string): Promise<Alert[]> {
  return (await getJson(`/stores/${safeSegment(storeId)}/alerts`, alertsPayload))
    .alerts;
}

export async function fetchActivity(
  storeId: string,
): Promise<ActivityEvent[]> {
  return (await getJson(`/stores/${safeSegment(storeId)}/activity`, activityPayload))
    .events;
}

export async function fetchSales(storeId: string): Promise<Sale[]> {
  return (await getJson(`/stores/${safeSegment(storeId)}/sales`, salesPayload)).sales;
}

export async function fetchPlanogram(
  storeId: string,
): Promise<PlanogramSlot[]> {
  return (await getJson(`/stores/${safeSegment(storeId)}/planogram`, planogramPayload))
    .slots;
}

export async function fetchFleetSummary(): Promise<FleetSummaryResponse> {
  return getJson("/fleet-summary", fleetSummaryResponseSchema);
}

export async function fetchSalesAnalytics(
  granularity: string,
  timeZone: string,
): Promise<z.infer<typeof fleetSalesAnalyticsSchema>> {
  const query = new URLSearchParams({ granularity, tz: timeZone });
  return getJson(`/sales-analytics?${query}`, fleetSalesAnalyticsSchema);
}

// ---------------------------------------------------------------------------
// Fleet aggregation reads. Each unwraps to the shape the BFF's loader returns,
// so wiring the live path is just try-this-then-fall-back-to-seed.
// ---------------------------------------------------------------------------

export async function fetchPlannerBenchmarks(): Promise<FleetBenchmarks | null> {
  return (await getJson("/planner/benchmarks", plannerBenchmarksResponseSchema))
    .benchmarks;
}

export async function fetchProductPerformance(
  range: string,
): Promise<readonly ProductPerformanceRow[]> {
  return (
    await getJson(
      `/product-performance?range=${encodeURIComponent(range)}`,
      productPerformanceResponseSchema,
    )
  ).products;
}

export async function fetchShrinkSummary(): Promise<FleetShrink> {
  return getJson("/shrink-summary", fleetShrinkResponseSchema);
}

export async function fetchSearchIndex(): Promise<SearchIndexResponse> {
  return getJson("/search-index", searchIndexResponseSchema);
}

export async function fetchFinance(): Promise<FinanceResponse> {
  return getJson("/finance", financeResponseSchema);
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

const restockPayload = z.object({
  items: z.array(inventoryItemSchema),
  activity: activityEventSchema,
});
const dismissPayload = z.object({ alert: alertSchema });

export async function postRestock(
  storeId: string,
  itemIds: string[],
): Promise<z.infer<typeof restockPayload>> {
  return sendJson(
    `/stores/${safeSegment(storeId)}/restock`,
    "POST",
    { itemIds },
    restockPayload,
  );
}

export async function patchDismiss(alertId: string): Promise<Alert> {
  return (
    await sendJson(`/alerts/${safeSegment(alertId)}/dismiss`, "PATCH", {}, dismissPayload)
  ).alert;
}

export async function patchPlanogram(
  storeId: string,
  body: { boxes: PlanogramSlot[] } | { resyncItemId: string },
): Promise<PlanogramSlot[]> {
  return (
    await sendJson(
      `/stores/${safeSegment(storeId)}/planogram`,
      "PATCH",
      body,
      planogramPayload,
    )
  ).slots;
}

// ---------------------------------------------------------------------------
// Restock sessions
// ---------------------------------------------------------------------------

const sessionPayload = z.object({ session: restockSessionSchema });
const sessionsPayload = z.object({ sessions: z.array(restockSessionSchema) });
const sessionDetailPayload = z.object({
  session: restockSessionSchema,
  lines: z.array(restockLineSchema),
});
const linePayload = z.object({ line: restockLineSchema });
const completePayload = z.object({
  session: restockSessionSchema,
  lines: z.array(restockLineSchema),
  items: z.array(inventoryItemSchema),
  activity: activityEventSchema,
});

export async function postRestockSession(
  storeId: string,
): Promise<z.infer<typeof restockSessionSchema>> {
  return (
    await sendJson(
      `/stores/${safeSegment(storeId)}/restock-sessions`,
      "POST",
      {},
      sessionPayload,
    )
  ).session;
}

export async function fetchRestockSessions(
  storeId: string,
): Promise<z.infer<typeof restockSessionSchema>[]> {
  return (
    await getJson(`/stores/${safeSegment(storeId)}/restock-sessions`, sessionsPayload)
  ).sessions;
}

export async function fetchRestockSession(
  sessionId: string,
): Promise<z.infer<typeof sessionDetailPayload>> {
  return getJson(`/restock-sessions/${safeSegment(sessionId)}`, sessionDetailPayload);
}

export async function putRestockLine(
  sessionId: string,
  itemId: string,
  body: RestockLineBody,
): Promise<z.infer<typeof restockLineSchema>> {
  return (
    await sendJson(
      `/restock-sessions/${safeSegment(sessionId)}/lines/${safeSegment(itemId)}`,
      "PUT",
      body,
      linePayload,
    )
  ).line;
}

export async function postCompleteRestock(
  sessionId: string,
  notes: string | null,
): Promise<z.infer<typeof completePayload>> {
  return sendJson(
    `/restock-sessions/${safeSegment(sessionId)}/complete`,
    "POST",
    { notes },
    completePayload,
  );
}

// ---------------------------------------------------------------------------
// Promotions
// ---------------------------------------------------------------------------

const promotionsPayload = z.object({ promotions: z.array(promotionSchema) });
const promotionPayload = z.object({ promotion: promotionSchema });

export type PromotionBody = {
  productName: string | null;
  percent: number;
  startsAt: string;
  endsAt: string | null;
};

export async function fetchPromotions(
  storeId: string,
): Promise<z.infer<typeof promotionSchema>[]> {
  return (await getJson(`/stores/${safeSegment(storeId)}/promotions`, promotionsPayload))
    .promotions;
}

export async function postPromotion(
  storeId: string,
  body: PromotionBody,
): Promise<z.infer<typeof promotionSchema>> {
  return (
    await sendJson(
      `/stores/${safeSegment(storeId)}/promotions`,
      "POST",
      body,
      promotionPayload,
    )
  ).promotion;
}

export async function patchEndPromotion(
  promotionId: string,
): Promise<z.infer<typeof promotionSchema>> {
  return (
    await sendJson(
      `/promotions/${safeSegment(promotionId)}/end`,
      "PATCH",
      {},
      promotionPayload,
    )
  ).promotion;
}

export async function fetchPromotionPerformance(
  promotionId: string,
): Promise<z.infer<typeof promotionPerformanceSchema>> {
  return getJson(
    `/promotions/${safeSegment(promotionId)}/performance`,
    promotionPerformanceSchema,
  );
}
