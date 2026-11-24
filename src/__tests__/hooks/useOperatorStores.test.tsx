import { describe, it, expect, vi, afterEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { advanceTimersWithinAct } from "@/test/advanceTimersWithinAct";
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
import { CONNECTION_ERROR_MESSAGE } from "@/lib/userFacingError";
import type { ReactNode } from "react";

afterEach(() => vi.restoreAllMocks());

/** Counts how often a polled hook asks again, with only the interval timer faked. */
async function countPolls({
  everyMs,
  usePolledHook,
  requests,
}: {
  everyMs: number;
  usePolledHook: () => { loading: boolean };
  requests: () => number;
}) {
  vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
  try {
    const { result } = renderHook(usePolledHook, { wrapper: makeWrapper() });
    await act(async () => {
      await vi.waitFor(() => expect(result.current.loading).toBe(false));
    });
    expect(requests()).toBe(1);

    await advanceTimersWithinAct(everyMs - 1_000);
    expect(requests()).toBe(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
      await vi.waitFor(() => expect(requests()).toBe(2));
    });
  } finally {
    vi.useRealTimers();
  }
}

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
  it("fetches and exposes the stores from the API", async () => {
    const stores = [...buildStoreList(3)];
    server.use(
      http.get("/api/operator/stores", () => HttpResponse.json({ stores })),
    );

    const { result } = renderHook(() => useOperatorStores(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.stores).toEqual(stores);
    expect(result.current.error).toBeNull();
  });

  it("returns an empty array while loading", () => {
    const { result } = renderHook(() => useOperatorStores(), {
      wrapper: makeWrapper(),
    });

    expect(result.current.stores).toEqual([]);
    expect(result.current.loading).toBe(true);
  });

  it("says the stores couldn't be fetched when the server errors", async () => {
    server.use(
      http.get("/api/operator/stores", () =>
        HttpResponse.json({ error: "down" }, { status: 500 }),
      ),
    );

    const { result } = renderHook(() => useOperatorStores(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.error).toBe("Failed to fetch stores"));
    expect(result.current.stores).toEqual([]);
  });

  it("says the connection failed when the request never arrives", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    server.use(http.get("/api/operator/stores", () => HttpResponse.error()));

    const { result } = renderHook(() => useOperatorStores(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.error).toBe(CONNECTION_ERROR_MESSAGE));
  });

  it("falls back to a plain message when the body isn't a list of stores", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    server.use(
      http.get("/api/operator/stores", () =>
        HttpResponse.json({ stores: [{ id: 1, nonsense: true }] }),
      ),
    );

    const { result } = renderHook(() => useOperatorStores(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.error).toBe("Failed to load stores."));
  });

  it("checks the fleet again every 30 seconds", async () => {
    let requests = 0;
    server.use(
      http.get("/api/operator/stores", () => {
        requests += 1;
        return HttpResponse.json({ stores: [] });
      }),
    );

    await countPolls({
      everyMs: 30_000,
      usePolledHook: () => useOperatorStores(),
      requests: () => requests,
    });
  });
});

// ---------------------------------------------------------------------------
// useOperatorStore — single store detail
// ---------------------------------------------------------------------------

describe("useOperatorStore", () => {
  it("fetches the store it is given by ID", async () => {
    const store = buildStore({ id: "store-detail" });
    const askedFor: string[] = [];
    server.use(
      http.get("/api/operator/stores/:id", ({ params }) => {
        askedFor.push(String(params.id));
        return HttpResponse.json({ store });
      }),
    );

    const { result } = renderHook(() => useOperatorStore("store-detail"), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(askedFor).toEqual(["store-detail"]);
    expect(result.current.store).toEqual(store);
  });

  it("says the store couldn't be fetched when it is not found", async () => {
    server.use(
      http.get("/api/operator/stores/:id", () =>
        HttpResponse.json({ error: "Store not found" }, { status: 404 }),
      ),
    );

    const { result } = renderHook(() => useOperatorStore("nonexistent"), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.error).toBe("Failed to fetch store"));
    expect(result.current.store).toBeUndefined();
  });

  it("falls back to a plain message when the body isn't a store", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    server.use(
      http.get("/api/operator/stores/:id", () =>
        HttpResponse.json({ store: { id: "x", nonsense: true } }),
      ),
    );

    const { result } = renderHook(() => useOperatorStore("x"), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.error).toBe("Failed to load store."));
  });

  it("shows a server-seeded store immediately, with no loading pass", () => {
    // The page loads the store server-side; seeding it means the detail view
    // renders its header on first paint instead of after a client round-trip,
    // which is what the LCP was waiting on.
    const seeded = buildStore({ id: "seeded" });

    const { result } = renderHook(
      () => useOperatorStore("seeded", { initialData: seeded }),
      { wrapper: makeWrapper() },
    );

    expect(result.current.loading).toBe(false);
    expect(result.current.store).toEqual(seeded);
  });

  it("swaps the seeded store for the fresher one the background refetch returns", async () => {
    const seeded = buildStore({ id: "seeded", name: "Old name" });
    const fresh = { ...seeded, name: "New name" };
    server.use(
      http.get("/api/operator/stores/:id", () => HttpResponse.json({ store: fresh })),
    );

    const { result } = renderHook(
      () => useOperatorStore("seeded", { initialData: seeded }),
      { wrapper: makeWrapper() },
    );

    await waitFor(() => expect(result.current.store?.name).toBe("New name"));
  });
});

// ---------------------------------------------------------------------------
// useOperatorInventory — store inventory
// ---------------------------------------------------------------------------

describe("useOperatorInventory", () => {
  it("fetches the inventory items of the store it is given", async () => {
    const items = [...buildInventoryList("store-inv", 4)];
    const askedFor: string[] = [];
    server.use(
      http.get("/api/operator/stores/:id/inventory", ({ params }) => {
        askedFor.push(String(params.id));
        return HttpResponse.json({ items });
      }),
    );

    const { result } = renderHook(() => useOperatorInventory("store-inv"), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(askedFor).toEqual(["store-inv"]);
    expect(result.current.items).toEqual(items);
  });

  it("returns an empty array while loading", () => {
    const { result } = renderHook(() => useOperatorInventory("store-inv"), {
      wrapper: makeWrapper(),
    });

    expect(result.current.items).toEqual([]);
    expect(result.current.loading).toBe(true);
  });

  it("says the inventory couldn't be fetched when the store is not found", async () => {
    server.use(
      http.get("/api/operator/stores/:id/inventory", () =>
        HttpResponse.json({ error: "Store not found" }, { status: 404 }),
      ),
    );

    const { result } = renderHook(() => useOperatorInventory("nonexistent"), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.error).toBe("Failed to fetch inventory"));
  });

  it("falls back to a plain message when the body isn't a list of items", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    server.use(
      http.get("/api/operator/stores/:id/inventory", () =>
        HttpResponse.json({ items: [{ id: 1, nonsense: true }] }),
      ),
    );

    const { result } = renderHook(() => useOperatorInventory("store-inv"), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.error).toBe("Failed to load inventory."));
  });

  it("checks stock again every 60 seconds", async () => {
    let requests = 0;
    server.use(
      http.get("/api/operator/stores/:id/inventory", () => {
        requests += 1;
        return HttpResponse.json({ items: [] });
      }),
    );

    await countPolls({
      everyMs: 60_000,
      usePolledHook: () => useOperatorInventory("store-inv"),
      requests: () => requests,
    });
  });
});
