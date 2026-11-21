import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { API_URL } from "@/lib/apiUrl";
import type { InventoryItem, RestockLine, RestockSession } from "@/types/operator";
import { operatorHandlers, resetOperatorWriteState } from "../operator";

/**
 * The handlers have to match the absolute URL the BFF requests, or MSW misses
 * them, the BFF falls back to its seed, and the tests pass while asserting
 * against fixture data instead of the API.
 *
 * That happened, was fixed, and then happened again: the first fix used a
 * pattern that only saw registrations where the path sat on the same line as
 * the http.* call, so four multi-line ones kept their bare paths for another
 * round. The symptom is invisible in test results, so these tests ask the
 * handlers themselves: what they are registered against, and what they answer
 * when called the way the app calls them.
 */

// The handlers add a 100-300ms random delay to feel like a network. Pin the
// dice so the suite does not wait on them.
beforeEach(() => {
  vi.spyOn(Math, "random").mockReturnValue(0);
  resetOperatorWriteState();
});
afterEach(() => {
  vi.restoreAllMocks();
});

const asJson = async (response: Response) => response.json();

const post = (path: string, body: unknown = {}) =>
  fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

const put = (path: string, body: unknown) =>
  fetch(path, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

/** The first store the handlers serve, and one of its inventory items. */
async function firstStoreWithItem(base: string): Promise<{ storeId: string; item: InventoryItem }> {
  const { stores } = await asJson(await fetch(`${base}/api/operator/stores`));
  const storeId: string = stores[0].id;
  const { items } = await asJson(await fetch(`${base}/api/operator/stores/${storeId}/inventory`));
  return { storeId, item: items[0] };
}

describe("operator MSW handlers: where they are registered", () => {
  const registrations = operatorHandlers.map((handler) => ({
    method: handler.info.method,
    path: String(handler.info.path),
  }));

  it("registers every endpoint on the relative path and again on the API base", () => {
    const relative = registrations.filter((r) => r.path.startsWith("/api/"));
    const absolute = registrations.filter((r) => r.path.startsWith(API_URL));

    expect(relative.length).toBeGreaterThan(0);
    // Nothing is registered on any other shape of path, such as a bare one that
    // lost its base or a base that is not the API's.
    expect(relative.length + absolute.length).toBe(registrations.length);

    const absoluteKeys = new Set(absolute.map((r) => `${r.method} ${r.path.slice(API_URL.length)}`));
    const relativeKeys = new Set(relative.map((r) => `${r.method} ${r.path}`));
    expect(absoluteKeys).toEqual(relativeKeys);
  });

  it("answers the same list from the relative path and from the API base", async () => {
    const fromRoute = await asJson(await fetch("/api/operator/stores"));
    const fromApi = await asJson(await fetch(`${API_URL}/api/operator/stores`));

    expect(fromRoute.stores).toHaveLength(6);
    expect(fromApi).toEqual(fromRoute);
  });
});

describe("operator MSW handlers: reads", () => {
  it("returns a 404 with an error for a store that does not exist", async () => {
    for (const path of ["", "/inventory", "/alerts", "/activity", "/sales", "/planogram"]) {
      const response = await fetch(`${API_URL}/api/operator/stores/no-such-store${path}`);
      expect(response.status, `GET stores/no-such-store${path}`).toBe(404);
      expect(await asJson(response)).toEqual({ error: "Store not found" });
    }
  });

  it("marks a degraded store in the fleet so the dashboard has something to show", async () => {
    const { stores } = await asJson(await fetch(`${API_URL}/api/operator/stores`));
    expect(stores.filter((store: { status: string }) => store.status === "degraded")).toHaveLength(1);
  });
});

describe("operator MSW handlers: restock sessions", () => {
  const countedLine = (item: InventoryItem, over: Partial<RestockLine> = {}) => ({
    expectedQty: item.currentStock,
    countedQty: item.currentStock,
    added: 0,
    removed: 0,
    removalReason: null,
    ...over,
  });

  it("opens a session for a known store and refuses one for an unknown store", async () => {
    const { storeId } = await firstStoreWithItem(API_URL);

    const created = await post(`${API_URL}/api/operator/stores/${storeId}/restock-sessions`);
    expect(created.status).toBe(201);
    const { session } = (await asJson(created)) as { session: RestockSession };
    expect(session).toMatchObject({ id: "session-001", storeId, completedAt: null });

    const missing = await post(`${API_URL}/api/operator/stores/no-such-store/restock-sessions`);
    expect(missing.status).toBe(404);
  });

  it("rejects removing stock without a reason, the same way the API does", async () => {
    const { storeId, item } = await firstStoreWithItem(API_URL);
    const { session } = await asJson(
      await post(`${API_URL}/api/operator/stores/${storeId}/restock-sessions`),
    );

    const response = await put(
      `${API_URL}/api/operator/restock-sessions/${session.id}/lines/${item.id}`,
      countedLine(item, { removed: 1, removalReason: null }),
    );

    expect(response.status).toBe(400);
  });

  it("keeps stock untouched while lines accumulate and applies it only on completion", async () => {
    const { storeId, item } = await firstStoreWithItem(API_URL);
    const { session } = await asJson(
      await post(`${API_URL}/api/operator/stores/${storeId}/restock-sessions`),
    );
    const line = countedLine(item, { added: 2 });

    const saved = await put(`${API_URL}/api/operator/restock-sessions/${session.id}/lines/${item.id}`, line);
    expect(saved.status).toBe(200);

    const midway = await asJson(await fetch(`${API_URL}/api/operator/stores/${storeId}/inventory`));
    expect(midway.items.find((i: InventoryItem) => i.id === item.id).currentStock).toBe(item.currentStock);

    const completed = await post(`${API_URL}/api/operator/restock-sessions/${session.id}/complete`, {
      notes: "spot check",
    });
    expect(completed.status).toBe(200);
    const body = await asJson(completed);
    expect(body.session.notes).toBe("spot check");
    expect(body.session.completedAt).not.toBeNull();

    const expectedStock = Math.min(item.currentStock + 2, item.capacity);
    expect(body.lines[0].resultingStock).toBe(expectedStock);
    expect(body.items[0].currentStock).toBe(expectedStock);

    const after = await asJson(await fetch(`${API_URL}/api/operator/stores/${storeId}/inventory`));
    expect(after.items.find((i: InventoryItem) => i.id === item.id).currentStock).toBe(expectedStock);
  });

  it("refuses to complete a session twice or to edit one that is complete", async () => {
    const { storeId, item } = await firstStoreWithItem(API_URL);
    const { session } = await asJson(
      await post(`${API_URL}/api/operator/stores/${storeId}/restock-sessions`),
    );
    await post(`${API_URL}/api/operator/restock-sessions/${session.id}/complete`, { notes: null });

    const again = await post(`${API_URL}/api/operator/restock-sessions/${session.id}/complete`, { notes: null });
    const edit = await put(
      `${API_URL}/api/operator/restock-sessions/${session.id}/lines/${item.id}`,
      countedLine(item),
    );

    expect(again.status).toBe(409);
    expect(edit.status).toBe(409);
  });

  it("returns 404 for a session that was never opened", async () => {
    const response = await fetch(`${API_URL}/api/operator/restock-sessions/session-999`);
    expect(response.status).toBe(404);
  });

  it("forgets every session and restarts the numbering once the write state is reset", async () => {
    const { storeId } = await firstStoreWithItem(API_URL);
    await post(`${API_URL}/api/operator/stores/${storeId}/restock-sessions`);
    expect((await fetch(`${API_URL}/api/operator/restock-sessions/session-001`)).status).toBe(200);

    resetOperatorWriteState();

    expect((await fetch(`${API_URL}/api/operator/restock-sessions/session-001`)).status).toBe(404);
    const reopened = await asJson(await post(`${API_URL}/api/operator/stores/${storeId}/restock-sessions`));
    expect(reopened.session.id).toBe("session-001");
  });
});

describe("operator MSW handlers: promotions", () => {
  const promotion = {
    productName: null,
    percent: 15,
    startsAt: "2020-01-01T00:00:00.000Z",
    endsAt: null,
  };

  it("creates a promotion, lists it for its store, and ends it", async () => {
    const { storeId } = await firstStoreWithItem(API_URL);

    const created = await post(`${API_URL}/api/operator/stores/${storeId}/promotions`, promotion);
    expect(created.status).toBe(201);
    const { promotion: made } = await asJson(created);
    expect(made).toMatchObject({ id: "promo-001", storeId, percent: 15, status: "active" });

    const listed = await asJson(await fetch(`${API_URL}/api/operator/stores/${storeId}/promotions`));
    expect(listed.promotions.map((p: { id: string }) => p.id)).toEqual(["promo-001"]);

    const ended = await asJson(
      await fetch(`${API_URL}/api/operator/promotions/${made.id}/end`, { method: "PATCH" }),
    );
    expect(ended.promotion.endsAt).not.toBeNull();
    expect(ended.promotion.status).toBe("ended");
  });

  it("lists a store's promotions without those of another store", async () => {
    const { stores } = await asJson(await fetch(`${API_URL}/api/operator/stores`));
    const [first, second] = stores as { id: string }[];
    await post(`${API_URL}/api/operator/stores/${first.id}/promotions`, promotion);

    const listed = await asJson(await fetch(`${API_URL}/api/operator/stores/${second.id}/promotions`));

    expect(listed.promotions).toEqual([]);
  });

  it("refuses a promotion for a store that does not exist", async () => {
    const response = await post(`${API_URL}/api/operator/stores/no-such-store/promotions`, promotion);
    expect(response.status).toBe(404);
  });

  it("returns 404 when ending or measuring a promotion that does not exist", async () => {
    expect((await fetch(`${API_URL}/api/operator/promotions/promo-999/end`, { method: "PATCH" })).status).toBe(404);
    expect((await fetch(`${API_URL}/api/operator/promotions/promo-999/performance`)).status).toBe(404);
  });
});

describe("operator MSW handlers: alerts", () => {
  it("returns 404 when dismissing an alert that does not exist", async () => {
    const response = await fetch(`${API_URL}/api/operator/alerts/no-such-alert/dismiss`, { method: "PATCH" });
    expect(response.status).toBe(404);
  });

  it("marks a real alert acknowledged when it is dismissed", async () => {
    const { storeId } = await firstStoreWithItem(API_URL);
    const { alerts } = await asJson(await fetch(`${API_URL}/api/operator/stores/${storeId}/alerts`));

    const dismissed = await asJson(
      await fetch(`${API_URL}/api/operator/alerts/${alerts[0].id}/dismiss`, { method: "PATCH" }),
    );

    expect(dismissed.alert).toMatchObject({ id: alerts[0].id, acknowledged: true });
  });
});
