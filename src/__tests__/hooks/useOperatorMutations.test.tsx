import { describe, it, expect } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse, delay } from "msw";
import { server } from "@/test/server";
import { useDismissAlert, useRestockStore } from "@/hooks/useOperatorMutations";
import {
  buildAlert,
  buildInventoryItem,
  buildActivityEvent,
} from "@/test/factories/operator";
import { queryKeys } from "@/lib/queryKeys";
import type { Alert, InventoryItem } from "@/types/operator";
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

    await act(async () => {
      await result.current
        .dismissAlert({ alertId: "alert-fail", storeId })
        .catch(() => {});
    });

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

    act(() => {
      void result.current
        .restockStore({ storeId, itemIds: ["item-fail"] })
        .catch(() => {});
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
  });
});
