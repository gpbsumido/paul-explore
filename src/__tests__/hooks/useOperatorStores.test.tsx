import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { useOperatorStores } from "@/hooks/useOperatorStores";
import { useOperatorStore } from "@/hooks/useOperatorStore";
import { useOperatorInventory } from "@/hooks/useOperatorInventory";
import {
  buildStoreList,
  buildStore,
  buildInventoryList,
} from "@/test/factories/operator";
import { storeSchema, inventoryItemSchema } from "@/lib/operator-schemas";
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
  return Wrapper;
}

// ---------------------------------------------------------------------------
// useOperatorStores — fleet list
// ---------------------------------------------------------------------------

describe("useOperatorStores", () => {
  it("fetches and exposes stores from the API", async () => {
    const stores = [...buildStoreList(3)];
    server.use(
      http.get("/api/operator/stores", () => HttpResponse.json({ stores })),
    );

    const { result } = renderHook(() => useOperatorStores(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.stores).toHaveLength(3);
    result.current.stores.forEach((s) => {
      expect(storeSchema.safeParse(s).success).toBe(true);
    });
  });

  it("returns an empty array while loading", () => {
    const { result } = renderHook(() => useOperatorStores(), {
      wrapper: makeWrapper(),
    });

    expect(result.current.stores).toEqual([]);
    expect(result.current.loading).toBe(true);
  });

  it("exposes an error message when the fetch fails", async () => {
    server.use(http.get("/api/operator/stores", () => HttpResponse.error()));

    const { result } = renderHook(() => useOperatorStores(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.error).not.toBeNull());
  });
});

// ---------------------------------------------------------------------------
// useOperatorStore — single store detail
// ---------------------------------------------------------------------------

describe("useOperatorStore", () => {
  it("fetches a single store by ID", async () => {
    const store = buildStore({ id: "store-detail" });
    server.use(
      http.get("/api/operator/stores/:id", () => HttpResponse.json({ store })),
    );

    const { result } = renderHook(() => useOperatorStore("store-detail"), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.store?.id).toBe("store-detail");
    expect(storeSchema.safeParse(result.current.store).success).toBe(true);
  });

  it("exposes an error when the store is not found", async () => {
    server.use(
      http.get("/api/operator/stores/:id", () =>
        HttpResponse.json({ error: "Store not found" }, { status: 404 }),
      ),
    );

    const { result } = renderHook(() => useOperatorStore("nonexistent"), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.error).not.toBeNull());
  });
});

// ---------------------------------------------------------------------------
// useOperatorInventory — store inventory
// ---------------------------------------------------------------------------

describe("useOperatorInventory", () => {
  it("fetches inventory items for a store", async () => {
    const items = [...buildInventoryList("store-inv", 4)];
    server.use(
      http.get("/api/operator/stores/:id/inventory", () =>
        HttpResponse.json({ items }),
      ),
    );

    const { result } = renderHook(() => useOperatorInventory("store-inv"), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toHaveLength(4);
    result.current.items.forEach((item) => {
      expect(inventoryItemSchema.safeParse(item).success).toBe(true);
    });
  });

  it("returns an empty array while loading", () => {
    const { result } = renderHook(() => useOperatorInventory("store-inv"), {
      wrapper: makeWrapper(),
    });

    expect(result.current.items).toEqual([]);
    expect(result.current.loading).toBe(true);
  });

  it("exposes an error when the store is not found", async () => {
    server.use(
      http.get("/api/operator/stores/:id/inventory", () =>
        HttpResponse.json({ error: "Store not found" }, { status: 404 }),
      ),
    );

    const { result } = renderHook(() => useOperatorInventory("nonexistent"), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.error).not.toBeNull());
  });
});
