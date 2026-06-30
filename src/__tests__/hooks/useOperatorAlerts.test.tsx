import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { useOperatorAlerts } from "@/hooks/useOperatorAlerts";
import { buildAlertList } from "@/test/factories/operator";
import { alertSchema } from "@/lib/operator-schemas";
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
  it("fetches alerts for a store", async () => {
    const alerts = [...buildAlertList("store-alerts", 3)];
    server.use(
      http.get("/api/operator/stores/:id/alerts", () =>
        HttpResponse.json({ alerts }),
      ),
    );

    const { result } = renderHook(() => useOperatorAlerts("store-alerts"), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.alerts).toHaveLength(3);
    result.current.alerts.forEach((a) => {
      expect(alertSchema.safeParse(a).success).toBe(true);
    });
  });

  it("returns an empty array while loading", () => {
    const { result } = renderHook(() => useOperatorAlerts("store-alerts"), {
      wrapper: makeWrapper(),
    });

    expect(result.current.alerts).toEqual([]);
    expect(result.current.loading).toBe(true);
  });

  it("exposes an error when the fetch fails", async () => {
    server.use(
      http.get("/api/operator/stores/:id/alerts", () => HttpResponse.error()),
    );

    const { result } = renderHook(() => useOperatorAlerts("store-alerts"), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.error).not.toBeNull());
  });
});
