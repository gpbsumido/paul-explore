import { describe, it, expect, vi, afterEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { advanceTimersWithinAct } from "@/test/advanceTimersWithinAct";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { useOperatorAlerts } from "@/hooks/useOperatorAlerts";
import { buildAlertList } from "@/test/factories/operator";
import { CONNECTION_ERROR_MESSAGE } from "@/lib/userFacingError";
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
// useOperatorAlerts — store alerts
// ---------------------------------------------------------------------------

describe("useOperatorAlerts", () => {
  afterEach(() => vi.restoreAllMocks());

  it("fetches the alerts of the store it is given", async () => {
    const alerts = [...buildAlertList("store-alerts", 3)];
    const askedFor: string[] = [];
    server.use(
      http.get("/api/operator/stores/:id/alerts", ({ params }) => {
        askedFor.push(String(params.id));
        return HttpResponse.json({ alerts });
      }),
    );

    const { result } = renderHook(() => useOperatorAlerts("store-alerts"), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(askedFor).toEqual(["store-alerts"]);
    expect(result.current.alerts).toEqual(alerts);
    expect(result.current.error).toBeNull();
  });

  it("returns an empty array while loading", () => {
    const { result } = renderHook(() => useOperatorAlerts("store-alerts"), {
      wrapper: makeWrapper(),
    });

    expect(result.current.alerts).toEqual([]);
    expect(result.current.loading).toBe(true);
  });

  it("says the alerts couldn't be fetched when the server errors", async () => {
    server.use(
      http.get("/api/operator/stores/:id/alerts", () =>
        HttpResponse.json({ error: "down" }, { status: 500 }),
      ),
    );

    const { result } = renderHook(() => useOperatorAlerts("store-alerts"), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.error).toBe("Failed to fetch alerts"));
    expect(result.current.alerts).toEqual([]);
  });

  it("says the connection failed when the request never arrives", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    server.use(
      http.get("/api/operator/stores/:id/alerts", () => HttpResponse.error()),
    );

    const { result } = renderHook(() => useOperatorAlerts("store-alerts"), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.error).toBe(CONNECTION_ERROR_MESSAGE));
  });

  it("falls back to a plain message when the body isn't a list of alerts", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    server.use(
      http.get("/api/operator/stores/:id/alerts", () =>
        HttpResponse.json({ alerts: [{ id: 1, nonsense: true }] }),
      ),
    );

    const { result } = renderHook(() => useOperatorAlerts("store-alerts"), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.error).toBe("Failed to load alerts."));
    expect(result.current.alerts).toEqual([]);
  });

  it("checks for new alerts every 15 seconds", async () => {
    let requests = 0;
    server.use(
      http.get("/api/operator/stores/:id/alerts", () => {
        requests += 1;
        return HttpResponse.json({ alerts: [] });
      }),
    );
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
    try {
      const { result } = renderHook(() => useOperatorAlerts("store-alerts"), {
        wrapper: makeWrapper(),
      });
      await act(async () => {
        await vi.waitFor(() => expect(result.current.loading).toBe(false));
      });
      expect(requests).toBe(1);

      await advanceTimersWithinAct(14_000);
      expect(requests).toBe(1);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1_000);
        await vi.waitFor(() => expect(requests).toBe(2));
      });
    } finally {
      vi.useRealTimers();
    }
  });
});
