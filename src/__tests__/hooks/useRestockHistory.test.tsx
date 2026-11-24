import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { useRestockHistory } from "@/hooks/useRestockHistory";
import { CONNECTION_ERROR_MESSAGE } from "@/lib/userFacingError";
import type { RestockSession } from "@/types/operator";
import type { ReactNode } from "react";

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }
  return Wrapper;
}

const session = (id: string, storeId: string): RestockSession => ({
  id,
  storeId,
  startedAt: "2026-11-01T14:00:00.000Z",
  completedAt: "2026-11-01T14:40:00.000Z",
  actor: "restocker@example.test",
  notes: null,
});

describe("useRestockHistory", () => {
  afterEach(() => vi.restoreAllMocks());

  it("fetches the completed sessions of the store it is given", async () => {
    const sessions = [session("s1", "store-9"), session("s2", "store-9")];
    const askedFor: string[] = [];
    server.use(
      http.get("/api/operator/stores/:id/restock-sessions", ({ params }) => {
        askedFor.push(String(params.id));
        return HttpResponse.json({ sessions });
      }),
    );

    const { result } = renderHook(() => useRestockHistory("store-9"), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(askedFor).toEqual(["store-9"]);
    expect(result.current.sessions).toEqual(sessions);
    expect(result.current.error).toBeNull();
  });

  it("returns an empty list while it is still loading", () => {
    const { result } = renderHook(() => useRestockHistory("store-9"), {
      wrapper: makeWrapper(),
    });

    expect(result.current.sessions).toEqual([]);
    expect(result.current.loading).toBe(true);
  });

  it("says the history couldn't be fetched when the server errors", async () => {
    server.use(
      http.get("/api/operator/stores/:id/restock-sessions", () =>
        HttpResponse.json({ error: "down" }, { status: 500 }),
      ),
    );

    const { result } = renderHook(() => useRestockHistory("store-9"), {
      wrapper: makeWrapper(),
    });

    await waitFor(() =>
      expect(result.current.error).toBe("Failed to fetch restock history"),
    );
    expect(result.current.sessions).toEqual([]);
  });

  it("says the connection failed when the request never arrives", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    server.use(
      http.get("/api/operator/stores/:id/restock-sessions", () =>
        HttpResponse.error(),
      ),
    );

    const { result } = renderHook(() => useRestockHistory("store-9"), {
      wrapper: makeWrapper(),
    });

    await waitFor(() =>
      expect(result.current.error).toBe(CONNECTION_ERROR_MESSAGE),
    );
  });

  it("falls back to a plain message when the body isn't a list of sessions", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    server.use(
      http.get("/api/operator/stores/:id/restock-sessions", () =>
        HttpResponse.json({ sessions: [{ id: 1, nonsense: true }] }),
      ),
    );

    const { result } = renderHook(() => useRestockHistory("store-9"), {
      wrapper: makeWrapper(),
    });

    await waitFor(() =>
      expect(result.current.error).toBe("Failed to load restock history."),
    );
    expect(result.current.sessions).toEqual([]);
  });
});
