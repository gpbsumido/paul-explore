import { describe, it, expect, beforeAll } from "vitest";
import { http, HttpResponse } from "msw";
import { render, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { server } from "@/test/server";
import { operatorHandlers } from "@/test/handlers/operator";
import FleetSalesAnalytics from "@/components/operator/FleetSalesAnalytics";

beforeAll(() => {
  server.use(...operatorHandlers);
});

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("FleetSalesAnalytics", () => {
  it("renders the fleet total and a per-store ranking", async () => {
    const { container } = render(<FleetSalesAnalytics />, {
      wrapper: makeWrapper(),
    });
    const view = within(container);

    expect(
      await view.findByText("Top stores by revenue"),
    ).toBeInTheDocument();
    expect(view.getByText(/across the fleet/i)).toBeInTheDocument();
  });

  it("switches the range and keeps rendering analytics", async () => {
    const user = userEvent.setup();
    const { container } = render(<FleetSalesAnalytics />, {
      wrapper: makeWrapper(),
    });
    const view = within(container);

    await view.findByText("Top stores by revenue");

    const yearButton = view.getByRole("button", { name: "Year" });
    await user.click(yearButton);

    await waitFor(() =>
      expect(yearButton).toHaveAttribute("aria-pressed", "true"),
    );
    // The year query reloads, then the ranking renders again.
    expect(await view.findByText("Top stores by revenue")).toBeInTheDocument();
  });
});

describe("FleetSalesAnalytics with known numbers", () => {
  const store = (id: string, totalRevenue: number) => ({
    storeId: id,
    storeName: `Store ${id}`,
    totalRevenue,
    unitsSold: 10,
  });
  const payload = (over: { granularity: string; labels: string[]; byStore: ReturnType<typeof store>[] }) => ({
    granularity: over.granularity,
    buckets: over.labels.map((label, i) => ({
      label,
      start: `2026-0${i + 1}-01T00:00:00.000Z`,
      revenue: (i + 1) * 100,
      units: i + 1,
    })),
    byStore: over.byStore,
    totalRevenue: over.byStore.reduce((t, s) => t + s.totalRevenue, 0),
    totalUnits: 10 * over.byStore.length,
  });

  it("shows the fleet total, the revenue bars and the ranking, biggest store first and capped at six", async () => {
    const byStore = [10, 9, 8, 7, 6, 5, 4, 3].map((n) => store(`s${n}`, n * 1000));
    server.use(
      http.get("/api/operator/sales-analytics", () =>
        HttpResponse.json(payload({ granularity: "month", labels: ["Jan", "Feb"], byStore })),
      ),
    );
    const { container } = render(<FleetSalesAnalytics />, { wrapper: makeWrapper() });
    const view = within(container);

    expect(await view.findByText("$52,000.00 across the fleet")).toBeInTheDocument();
    // Each bucket is named twice: on the bar, and in the screen reader list.
    expect(view.getAllByText("Jan: $100.00")).toHaveLength(2);
    expect(view.getAllByText("Feb: $200.00")).toHaveLength(2);
    const ranked = view.getAllByRole("link").map((link) => link.textContent);
    expect(ranked).toEqual(["Store s10", "Store s9", "Store s8", "Store s7", "Store s6", "Store s5"]);
    expect(view.getByRole("link", { name: "Store s10" })).toHaveAttribute(
      "href",
      "/operator/stores/s10?tab=sales",
    );
  });

  it("asks the API for the range picked, in the viewer's time zone, and shows what comes back", async () => {
    const asked: { granularity: string | null; tz: string | null }[] = [];
    server.use(
      http.get("/api/operator/sales-analytics", ({ request }) => {
        const params = new URL(request.url).searchParams;
        asked.push({ granularity: params.get("granularity"), tz: params.get("tz") });
        return HttpResponse.json(
          params.get("granularity") === "year"
            ? payload({ granularity: "year", labels: ["2025", "2026"], byStore: [store("y1", 5000)] })
            : payload({ granularity: "month", labels: ["Jan"], byStore: [store("m1", 100)] }),
        );
      }),
    );
    const user = userEvent.setup();
    const { container } = render(<FleetSalesAnalytics />, { wrapper: makeWrapper() });
    const view = within(container);
    await view.findByText("Store m1");

    await user.click(view.getByRole("button", { name: "Year" }));

    expect(await view.findByText("Store y1")).toBeInTheDocument();
    expect(view.getAllByText("2026: $200.00")).toHaveLength(2);
    expect(asked.map((a) => a.granularity)).toEqual(["month", "year"]);
    expect(asked[0].tz).toBe(Intl.DateTimeFormat().resolvedOptions().timeZone);
  });

  it("shows the error, not an empty ranking, when the analytics fail to load", async () => {
    server.use(
      http.get("/api/operator/sales-analytics", () =>
        HttpResponse.json({ error: "down" }, { status: 500 }),
      ),
    );
    const { container } = render(<FleetSalesAnalytics />, { wrapper: makeWrapper() });
    const view = within(container);

    expect(await view.findByText("Failed to fetch sales analytics")).toBeInTheDocument();
    expect(view.queryByText("Top stores by revenue")).not.toBeInTheDocument();
  });
});
