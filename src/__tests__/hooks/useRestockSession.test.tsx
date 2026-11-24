import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { server } from "@/test/server";
import { useRestockSession } from "@/hooks/useRestockSession";
import { queryKeys } from "@/lib/queryKeys";

const STORE_ID = "store-001";

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return { queryClient, Wrapper };
}

const openSession = {
  id: "session-001",
  storeId: STORE_ID,
  startedAt: "2026-08-02T15:00:00.000Z",
  completedAt: null,
  actor: null,
  notes: null,
};

/**
 * Finishing a restock adds a row to the store's restock history, and the
 * history panel kept showing the old list until something else refetched it.
 */
describe("completing a restock session", () => {
  it("refreshes the restock history along with inventory and activity", async () => {
    window.localStorage.clear();
    server.use(
      http.post("/api/operator/stores/:id/restock-sessions", () =>
        HttpResponse.json({ session: openSession }, { status: 201 }),
      ),
      http.post("/api/operator/restock-sessions/:sessionId/complete", () =>
        HttpResponse.json({
          session: { ...openSession, completedAt: "2026-08-02T16:00:00.000Z" },
        }),
      ),
    );
    const { queryClient, Wrapper } = makeWrapper();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useRestockSession(STORE_ID), { wrapper: Wrapper });

    await act(async () => {
      await result.current.open();
    });
    let completed = false;
    await act(async () => {
      completed = await result.current.complete(null);
    });

    expect(completed).toBe(true);
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: queryKeys.operator.restockHistory(STORE_ID),
    });
  });
});
