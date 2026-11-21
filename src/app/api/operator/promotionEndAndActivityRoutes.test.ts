import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { resetOperatorWriteState } from "@/test/handlers/operator";
import { API_URL } from "@/lib/apiUrl";
import { activityEventSchema } from "@/lib/operator-schemas";
import { buildActivityEvent } from "@/test/factories/operator";
import { z } from "zod";

import { PATCH as endPromotion } from "./promotions/[promotionId]/end/route";
import { POST as schedulePromotion } from "./stores/[storeId]/promotions/route";
import { GET as getActivity } from "./stores/[storeId]/activity/route";

/**
 * The MSW handlers answer for the API here. A silent fall-back to the seed
 * would make these assert against fixtures, so it is turned into a failure
 * unless a test says it expects one.
 */
let seedFallbackExpected = false;

beforeEach(() => {
  seedFallbackExpected = false;
  resetOperatorWriteState();
  vi.spyOn(console, "warn").mockImplementation((...args: unknown[]) => {
    const line = args.map(String).join(" ");
    if (line.includes("fell back to seed data") && !seedFallbackExpected) {
      throw new Error(`Fell back to the seed during a route test: ${line}`);
    }
  });
});

afterEach(() => vi.restoreAllMocks());

const request = (path: string, init?: { method: string; body?: unknown }) =>
  new NextRequest(`http://localhost${path}`, {
    method: init?.method,
    headers: { "Content-Type": "application/json" },
    body: init?.body === undefined ? undefined : JSON.stringify(init.body),
  });

const endCtx = (promotionId: string) => ({ params: Promise.resolve({ promotionId }) });
const storeCtx = (storeId: string) => ({ params: Promise.resolve({ storeId }) });

/** Schedules a promotion on a seeded store and returns its id. */
async function scheduleOne(): Promise<string> {
  const res = await schedulePromotion(
    request("/api/operator/stores/store-001/promotions", {
      method: "POST",
      body: { productName: null, percent: 20, startsAt: "2026-01-01T00:00:00.000Z", endsAt: null },
    }),
    storeCtx("store-001"),
  );
  expect(res.status).toBe(201);
  return (await res.json()).promotion.id;
}

describe("PATCH /api/operator/promotions/:promotionId/end", () => {
  it("closes the promotion now and returns it as ended", async () => {
    const promotionId = await scheduleOne();

    const res = await endPromotion(
      request(`/api/operator/promotions/${promotionId}/end`, { method: "PATCH" }),
      endCtx(promotionId),
    );

    expect(res.status).toBe(200);
    const { promotion } = await res.json();
    expect(promotion).toMatchObject({ id: promotionId, status: "ended" });
    expect(promotion.endsAt).not.toBeNull();
  });

  it("answers 404 for a promotion the API has never heard of", async () => {
    const res = await endPromotion(
      request("/api/operator/promotions/promo-nope/end", { method: "PATCH" }),
      endCtx("promo-nope"),
    );

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Promotion not found" });
  });

  it("tells the caller to fix the service token when the API answers 401, instead of seeding", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    server.use(
      http.patch(`${API_URL}/api/operator/promotions/:id/end`, () => new HttpResponse(null, { status: 401 })),
    );

    const res = await endPromotion(
      request("/api/operator/promotions/promo-1/end", { method: "PATCH" }),
      endCtx("promo-1"),
    );

    expect(res.status).toBe(503);
    expect(res.headers.get("x-operator-config")).toBe("token-mismatch");
  });
});

describe("GET /api/operator/stores/:storeId/activity", () => {
  it("returns the store's activity events in the shape the feed reads", async () => {
    const events = [
      buildActivityEvent({ storeId: "store-001", description: "first" }),
      buildActivityEvent({ storeId: "store-001", description: "second" }),
    ];
    server.use(
      http.get(`${API_URL}/api/operator/stores/:id/activity`, () => HttpResponse.json({ events })),
    );

    const res = await getActivity(request("/api/operator/stores/store-001/activity"), storeCtx("store-001"));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.events.map((e: { description: string }) => e.description)).toEqual(["first", "second"]);
    expect(z.array(activityEventSchema).safeParse(body.events).success).toBe(true);
  });

  it("falls back to the seeded events, loudly, when the API can't be reached", async () => {
    seedFallbackExpected = true;
    server.use(http.get(`${API_URL}/api/operator/stores/:id/activity`, () => HttpResponse.error()));

    const res = await getActivity(request("/api/operator/stores/store-001/activity"), storeCtx("store-001"));

    expect(res.status).toBe(200);
    expect((await res.json()).events.length).toBeGreaterThan(0);
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("loadActivity fell back to seed data"));
  });

  it("says it could not load, rather than claiming nothing happened, for a store the seed doesn't know", async () => {
    seedFallbackExpected = true;
    server.use(http.get(`${API_URL}/api/operator/stores/:id/activity`, () => HttpResponse.error()));

    const res = await getActivity(request("/api/operator/stores/real-uuid/activity"), storeCtx("real-uuid"));

    expect(res.status).toBe(503);
    expect((await res.json()).error).toMatch(/could not load/i);
  });
});
