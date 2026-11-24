import { describe, it, expect, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse, delay } from "msw";
import { server } from "@/test/server";
import {
  useDismissAlert,
  useReorderPlanogram,
  useResyncSlot,
  useRestockStore,
} from "@/hooks/useOperatorMutations";
import {
  buildAlert,
  buildInventoryItem,
  buildActivityEvent,
} from "@/test/factories/operator";
import { queryKeys } from "@/lib/queryKeys";
import type { Alert, InventoryItem, PlanogramSlot } from "@/types/operator";
import type { ReactNode } from "react";

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }
  return { queryClient, Wrapper };
}

// ---------------------------------------------------------------------------
// useDismissAlert — optimistic acknowledge + rollback
// ---------------------------------------------------------------------------

describe("useDismissAlert", () => {
  it("optimistically marks the alert as acknowledged in the cache", async () => {
    const storeId = "store-dismiss";
    const alerts: Alert[] = [
      buildAlert({ id: "alert-1", storeId, acknowledged: false }),
      buildAlert({ id: "alert-2", storeId, acknowledged: false }),
    ];

    server.use(
      http.get("/api/operator/stores/:id/alerts", () =>
        HttpResponse.json({ alerts }),
      ),
      http.patch("/api/operator/alerts/:id/dismiss", async () => {
        await delay(300);
        return HttpResponse.json({
          alert: { ...alerts[0], acknowledged: true },
        });
      }),
    );

    const { queryClient, Wrapper } = makeWrapper();
    queryClient.setQueryData(queryKeys.operator.alerts(storeId), alerts);

    const { result } = renderHook(() => useDismissAlert(), {
      wrapper: Wrapper,
    });

    act(() => {
      void result.current.dismissAlert({ alertId: "alert-1", storeId });
    });

    // the optimistic update should fire synchronously via onMutate,
    // marking alert-1 acknowledged before the server responds
    await waitFor(() => {
      const cached = queryClient.getQueryData<Alert[]>(
        queryKeys.operator.alerts(storeId),
      );
      expect(cached?.find((a) => a.id === "alert-1")?.acknowledged).toBe(true);
    });

    // alert-2 should be untouched
    const cached = queryClient.getQueryData<Alert[]>(
      queryKeys.operator.alerts(storeId),
    );
    expect(cached?.find((a) => a.id === "alert-2")?.acknowledged).toBe(false);
  });

  it("rolls back when the dismiss fails", async () => {
    const storeId = "store-dismiss-fail";
    const alerts: Alert[] = [
      buildAlert({ id: "alert-fail", storeId, acknowledged: false }),
    ];

    server.use(
      http.get("/api/operator/stores/:id/alerts", () =>
        HttpResponse.json({ alerts }),
      ),
      http.patch("/api/operator/alerts/:id/dismiss", () =>
        HttpResponse.json({ error: "Server error" }, { status: 500 }),
      ),
    );

    const { queryClient, Wrapper } = makeWrapper();
    queryClient.setQueryData(queryKeys.operator.alerts(storeId), alerts);

    const { result } = renderHook(() => useDismissAlert(), {
      wrapper: Wrapper,
    });

    let failure: unknown;
    await act(async () => {
      await result.current
        .dismissAlert({ alertId: "alert-fail", storeId })
        .catch((error: unknown) => {
          failure = error;
        });
    });

    expect(failure).toMatchObject({ message: "Server error", status: 500 });
    await waitFor(() => {
      const cached = queryClient.getQueryData<Alert[]>(
        queryKeys.operator.alerts(storeId),
      );
      expect(cached?.find((a) => a.id === "alert-fail")?.acknowledged).toBe(
        false,
      );
    });
  });
});

// ---------------------------------------------------------------------------
// useRestockStore — optimistic restock + rollback
// ---------------------------------------------------------------------------

describe("useRestockStore", () => {
  it("optimistically sets item stock to capacity in the cache", async () => {
    const storeId = "store-restock";
    const items: InventoryItem[] = [
      buildInventoryItem({
        id: "item-1",
        storeId,
        currentStock: 2,
        capacity: 12,
      }),
      buildInventoryItem({
        id: "item-2",
        storeId,
        currentStock: 5,
        capacity: 15,
      }),
    ];

    server.use(
      http.get("/api/operator/stores/:id/inventory", () =>
        HttpResponse.json({ items }),
      ),
      http.post("/api/operator/stores/:id/restock", async () => {
        await delay(300);
        return HttpResponse.json({
          items: [{ ...items[0], currentStock: 12 }],
          activity: buildActivityEvent({ storeId, type: "restock" }),
        });
      }),
    );

    const { queryClient, Wrapper } = makeWrapper();
    queryClient.setQueryData(queryKeys.operator.inventory(storeId), items);

    const { result } = renderHook(() => useRestockStore(), {
      wrapper: Wrapper,
    });

    act(() => {
      void result.current.restockStore({ storeId, itemIds: ["item-1"] });
    });

    // item-1 should optimistically jump to full capacity
    await waitFor(() => {
      const cached = queryClient.getQueryData<InventoryItem[]>(
        queryKeys.operator.inventory(storeId),
      );
      expect(cached?.find((i) => i.id === "item-1")?.currentStock).toBe(12);
    });

    // item-2 should remain unchanged
    const cached = queryClient.getQueryData<InventoryItem[]>(
      queryKeys.operator.inventory(storeId),
    );
    expect(cached?.find((i) => i.id === "item-2")?.currentStock).toBe(5);
  });

  it("rolls back when the restock fails", async () => {
    const storeId = "store-restock-fail";
    const items: InventoryItem[] = [
      buildInventoryItem({
        id: "item-fail",
        storeId,
        currentStock: 3,
        capacity: 10,
      }),
    ];

    server.use(
      http.get("/api/operator/stores/:id/inventory", () =>
        HttpResponse.json({ items }),
      ),
      http.post("/api/operator/stores/:id/restock", async () => {
        await delay(300);
        return HttpResponse.json({ error: "Server error" }, { status: 500 });
      }),
    );

    const { queryClient, Wrapper } = makeWrapper();
    queryClient.setQueryData(queryKeys.operator.inventory(storeId), items);

    const { result } = renderHook(() => useRestockStore(), {
      wrapper: Wrapper,
    });

    let failure: unknown;
    act(() => {
      void result.current
        .restockStore({ storeId, itemIds: ["item-fail"] })
        .catch((error: unknown) => {
          failure = error;
        });
    });

    // the optimistic update should fire before the server responds
    await waitFor(() => {
      const cached = queryClient.getQueryData<InventoryItem[]>(
        queryKeys.operator.inventory(storeId),
      );
      expect(cached?.find((i) => i.id === "item-fail")?.currentStock).toBe(10);
    });

    // after the 500 response, stock should revert to the original value
    await waitFor(() => {
      const cached = queryClient.getQueryData<InventoryItem[]>(
        queryKeys.operator.inventory(storeId),
      );
      expect(cached?.find((i) => i.id === "item-fail")?.currentStock).toBe(3);
    });
    expect(failure).toMatchObject({ message: "Server error", status: 500 });
  });

  it("sends the chosen item ids to the store's restock endpoint and returns what came back", async () => {
    const storeId = "store-restock-send";
    const items = [buildInventoryItem({ id: "item-1", storeId, currentStock: 2, capacity: 12 })];
    const activity = buildActivityEvent({ storeId, type: "restock" });
    let sent: { path: string; body: unknown } | undefined;
    server.use(
      http.post("/api/operator/stores/:id/restock", async ({ request }) => {
        sent = { path: new URL(request.url).pathname, body: await request.json() };
        return HttpResponse.json({ items: [{ ...items[0], currentStock: 12 }], activity });
      }),
    );
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useRestockStore(), { wrapper: Wrapper });

    let restocked: Awaited<ReturnType<typeof result.current.restockStore>> | undefined;
    await act(async () => {
      restocked = await result.current.restockStore({ storeId, itemIds: ["item-1", "item-3"] });
    });

    expect(sent).toEqual({
      path: `/api/operator/stores/${storeId}/restock`,
      body: { itemIds: ["item-1", "item-3"] },
    });
    expect(restocked?.items[0].currentStock).toBe(12);
    expect(restocked?.activity).toEqual(activity);
  });
});

// ---------------------------------------------------------------------------
// useDismissAlert — the request itself
// ---------------------------------------------------------------------------

describe("useDismissAlert request", () => {
  it("patches the alert it was asked to dismiss and returns the acknowledged alert", async () => {
    const storeId = "store-dismiss-send";
    const alert = buildAlert({ id: "alert-9", storeId, acknowledged: false });
    let patchedPath: string | undefined;
    server.use(
      http.patch("/api/operator/alerts/:id/dismiss", ({ request }) => {
        patchedPath = new URL(request.url).pathname;
        return HttpResponse.json({ alert: { ...alert, acknowledged: true } });
      }),
    );
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useDismissAlert(), { wrapper: Wrapper });

    let dismissed: Alert | undefined;
    await act(async () => {
      dismissed = await result.current.dismissAlert({ alertId: "alert-9", storeId });
    });

    expect(patchedPath).toBe("/api/operator/alerts/alert-9/dismiss");
    expect(dismissed).toEqual({ ...alert, acknowledged: true });
  });
});

// ---------------------------------------------------------------------------
// useReorderPlanogram — optimistic layout + rollback
// ---------------------------------------------------------------------------

describe("useReorderPlanogram", () => {
  const before: PlanogramSlot[] = [
    { itemId: "item-a", sensorMatch: true },
    { itemId: "item-b", sensorMatch: true },
  ];
  const after: PlanogramSlot[] = [
    { itemId: "item-b", sensorMatch: true },
    { itemId: "item-a", sensorMatch: true },
  ];

  it("shows the new layout at once and sends it to the planogram endpoint", async () => {
    const storeId = "store-reorder";
    let sent: unknown;
    server.use(
      http.patch("/api/operator/stores/:id/planogram", async ({ request }) => {
        sent = await request.json();
        await delay(300);
        return HttpResponse.json({ slots: after });
      }),
    );
    const { queryClient, Wrapper } = makeWrapper();
    queryClient.setQueryData(queryKeys.operator.planogram(storeId), before);
    const { result } = renderHook(() => useReorderPlanogram(), { wrapper: Wrapper });

    act(() => {
      void result.current.reorderPlanogram({ storeId, boxes: after });
    });

    await waitFor(() =>
      expect(queryClient.getQueryData(queryKeys.operator.planogram(storeId))).toEqual(after),
    );
    await waitFor(() => expect(sent).toEqual({ boxes: after }));
  });

  it("puts the old layout back and says so when the move is refused", async () => {
    const storeId = "store-reorder-fail";
    server.use(
      http.patch("/api/operator/stores/:id/planogram", () =>
        HttpResponse.json({ error: "no" }, { status: 500 }),
      ),
    );
    const { queryClient, Wrapper } = makeWrapper();
    queryClient.setQueryData(queryKeys.operator.planogram(storeId), before);
    const { result } = renderHook(() => useReorderPlanogram(), { wrapper: Wrapper });

    let failure: unknown;
    await act(async () => {
      await result.current
        .reorderPlanogram({ storeId, boxes: after })
        .catch((error: unknown) => {
          failure = error;
        });
    });

    expect(failure).toMatchObject({ message: "no", status: 500 });
    expect(queryClient.getQueryData(queryKeys.operator.planogram(storeId))).toEqual(before);
  });
});

// ---------------------------------------------------------------------------
// useResyncSlot — optimistic sensor fix + rollback
// ---------------------------------------------------------------------------

describe("useResyncSlot", () => {
  const mismatched: PlanogramSlot[] = [
    { itemId: "item-a", sensorMatch: false },
    { itemId: "item-b", sensorMatch: false },
  ];

  it("clears the warning on that slot only, and asks the server to re-sync that item", async () => {
    const storeId = "store-resync";
    let sent: unknown;
    server.use(
      http.patch("/api/operator/stores/:id/planogram", async ({ request }) => {
        sent = await request.json();
        await delay(300);
        return HttpResponse.json({ slots: [{ itemId: "item-a", sensorMatch: true }, mismatched[1]] });
      }),
    );
    const { queryClient, Wrapper } = makeWrapper();
    queryClient.setQueryData(queryKeys.operator.planogram(storeId), mismatched);
    const { result } = renderHook(() => useResyncSlot(), { wrapper: Wrapper });

    act(() => {
      void result.current.resyncSlot({ storeId, itemId: "item-a" });
    });

    await waitFor(() =>
      expect(queryClient.getQueryData(queryKeys.operator.planogram(storeId))).toEqual([
        { itemId: "item-a", sensorMatch: true },
        { itemId: "item-b", sensorMatch: false },
      ]),
    );
    await waitFor(() => expect(sent).toEqual({ resyncItemId: "item-a" }));
  });

  it("brings the warning back when the re-sync fails", async () => {
    const storeId = "store-resync-fail";
    server.use(
      http.patch("/api/operator/stores/:id/planogram", () =>
        HttpResponse.json({ error: "no" }, { status: 500 }),
      ),
    );
    const { queryClient, Wrapper } = makeWrapper();
    queryClient.setQueryData(queryKeys.operator.planogram(storeId), mismatched);
    const { result } = renderHook(() => useResyncSlot(), { wrapper: Wrapper });

    let failure: unknown;
    await act(async () => {
      await result.current
        .resyncSlot({ storeId, itemId: "item-a" })
        .catch((error: unknown) => {
          failure = error;
        });
    });

    expect(failure).toMatchObject({ message: "no", status: 500 });
    expect(queryClient.getQueryData(queryKeys.operator.planogram(storeId))).toEqual(mismatched);
  });
});

// ---------------------------------------------------------------------------
// Failures carry the server's reason
// ---------------------------------------------------------------------------

/**
 * Every write threw a fixed string ("Failed to restock items"), so the app's
 * failure toast could only ever say that. The routes answer with a sentence
 * written for whoever clicked, like "the change may have been saved, so reload
 * before trying again", and that's the one worth showing.
 */
describe("a refused operator write", () => {
  const REASON =
    "The operator API didn't answer in time. The change may have been saved, so reload before trying again.";
  const refuse = () => HttpResponse.json({ error: REASON }, { status: 504 });

  type Wrapper = ReturnType<typeof makeWrapper>["Wrapper"];
  it.each([
    {
      name: "dismiss",
      handler: http.patch("/api/operator/alerts/:id/dismiss", refuse),
      mount: (wrapper: Wrapper) => {
        const { result } = renderHook(() => useDismissAlert(), { wrapper });
        return () => result.current.dismissAlert({ alertId: "a", storeId: "s" });
      },
    },
    {
      name: "restock",
      handler: http.post("/api/operator/stores/:id/restock", refuse),
      mount: (wrapper: Wrapper) => {
        const { result } = renderHook(() => useRestockStore(), { wrapper });
        return () => result.current.restockStore({ storeId: "s", itemIds: ["i"] });
      },
    },
    {
      name: "reorder",
      handler: http.patch("/api/operator/stores/:id/planogram", refuse),
      mount: (wrapper: Wrapper) => {
        const { result } = renderHook(() => useReorderPlanogram(), { wrapper });
        return () => result.current.reorderPlanogram({ storeId: "s", boxes: [] });
      },
    },
    {
      name: "re-sync",
      handler: http.patch("/api/operator/stores/:id/planogram", refuse),
      mount: (wrapper: Wrapper) => {
        const { result } = renderHook(() => useResyncSlot(), { wrapper });
        return () => result.current.resyncSlot({ storeId: "s", itemId: "i" });
      },
    },
  ])("$name fails with the route's own sentence", async ({ handler, mount }) => {
    server.use(handler);
    const { Wrapper } = makeWrapper();
    const run = mount(Wrapper);

    let failure: unknown;
    await act(async () => {
      await run().catch((error: unknown) => {
        failure = error;
      });
    });

    expect(failure).toBeInstanceOf(Error);
    expect((failure as Error).message).toBe(REASON);
  });
});

describe("what a restock refreshes", () => {
  it("refreshes the activity feed as well as the inventory, since the restock logged an event", async () => {
    server.use(
      http.post("/api/operator/stores/:id/restock", () =>
        HttpResponse.json({
          items: [buildInventoryItem({ id: "i", storeId: "s" })],
          activity: buildActivityEvent({ storeId: "s" }),
        }),
      ),
    );
    const { queryClient, Wrapper } = makeWrapper();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useRestockStore(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.restockStore({ storeId: "s", itemIds: ["i"] });
    });

    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.operator.activity("s") });
  });
});
