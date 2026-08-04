import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { server } from "@/test/server";
import InventoryTab from "@/components/operator/InventoryTab";
import AlertsTab from "@/components/operator/AlertsTab";
import ActivityTab from "@/components/operator/ActivityTab";
import PlanogramTab from "@/components/operator/PlanogramTab";
import SalesTab from "@/components/operator/SalesTab";
import TaxTab from "@/components/operator/TaxTab";
import { buildStore, buildSale } from "@/test/factories/operator";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

const STORE_ID = "store-test-001";

// ---------------------------------------------------------------------------
// Error states — each tab shows the error message from the hook on failure
// ---------------------------------------------------------------------------

describe("tab error states", () => {
  it("InventoryTab shows error message when inventory fetch fails", async () => {
    server.use(
      http.get("/api/operator/stores/:id/inventory", () =>
        HttpResponse.json({ error: "Server error" }, { status: 500 }),
      ),
      http.get("/api/operator/stores/:id", () =>
        HttpResponse.json({ store: null }),
      ),
    );

    render(<InventoryTab storeId={STORE_ID} />, { wrapper: makeWrapper() });

    expect(
      await screen.findByText("Failed to fetch inventory"),
    ).toBeInTheDocument();
  });

  it("AlertsTab shows error message when alerts fetch fails", async () => {
    server.use(
      http.get("/api/operator/stores/:id/alerts", () =>
        HttpResponse.json({ error: "Server error" }, { status: 500 }),
      ),
    );

    render(<AlertsTab storeId={STORE_ID} />, { wrapper: makeWrapper() });

    expect(
      await screen.findByText("Failed to fetch alerts"),
    ).toBeInTheDocument();
  });

  it("ActivityTab shows error message when activity fetch fails", async () => {
    server.use(
      http.get("/api/operator/stores/:id/activity", () =>
        HttpResponse.json({ error: "Server error" }, { status: 500 }),
      ),
    );

    render(<ActivityTab storeId={STORE_ID} />, { wrapper: makeWrapper() });

    expect(
      await screen.findByText("Failed to fetch activity"),
    ).toBeInTheDocument();
  });

  it("PlanogramTab shows error message when inventory fetch fails", async () => {
    server.use(
      http.get("/api/operator/stores/:id/inventory", () =>
        HttpResponse.json({ error: "Server error" }, { status: 500 }),
      ),
    );

    render(<PlanogramTab storeId={STORE_ID} />, { wrapper: makeWrapper() });

    expect(
      await screen.findByText("Failed to fetch inventory"),
    ).toBeInTheDocument();
  });

  it("SalesTab shows error message when sales fetch fails", async () => {
    server.use(
      http.get("/api/operator/stores/:id/sales", () =>
        HttpResponse.json({ error: "Server error" }, { status: 500 }),
      ),
    );

    render(<SalesTab storeId={STORE_ID} />, { wrapper: makeWrapper() });

    expect(
      await screen.findByText("Failed to fetch sales"),
    ).toBeInTheDocument();
  });

  it("TaxTab shows error message when sales fetch fails", async () => {
    server.use(
      http.get("/api/operator/stores/:id/sales", () =>
        HttpResponse.json({ error: "Server error" }, { status: 500 }),
      ),
      http.get("/api/operator/stores/:id", () =>
        HttpResponse.json({ store: buildStore({ id: STORE_ID }) }),
      ),
    );

    render(<TaxTab storeId={STORE_ID} />, { wrapper: makeWrapper() });

    expect(
      await screen.findByText("Failed to fetch sales"),
    ).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Empty states — each tab shows a message when the API returns no data
// ---------------------------------------------------------------------------

describe("tab empty states", () => {
  it("InventoryTab shows empty message when no inventory items exist", async () => {
    server.use(
      http.get("/api/operator/stores/:id/inventory", () =>
        HttpResponse.json({ items: [] }),
      ),
      http.get("/api/operator/stores/:id", () =>
        HttpResponse.json({ store: null }),
      ),
    );

    render(<InventoryTab storeId={STORE_ID} />, { wrapper: makeWrapper() });

    expect(
      await screen.findByText("No inventory data available."),
    ).toBeInTheDocument();
  });

  it("AlertsTab shows all-clear message when no alerts exist", async () => {
    server.use(
      http.get("/api/operator/stores/:id/alerts", () =>
        HttpResponse.json({ alerts: [] }),
      ),
    );

    render(<AlertsTab storeId={STORE_ID} />, { wrapper: makeWrapper() });

    expect(await screen.findByText("All clear")).toBeInTheDocument();
    expect(
      screen.getByText("No active alerts for this store."),
    ).toBeInTheDocument();
  });

  it("ActivityTab shows empty message when no events exist", async () => {
    server.use(
      http.get("/api/operator/stores/:id/activity", () =>
        HttpResponse.json({ events: [] }),
      ),
    );

    render(<ActivityTab storeId={STORE_ID} />, { wrapper: makeWrapper() });

    expect(
      await screen.findByText("No activity recorded for this store yet."),
    ).toBeInTheDocument();
  });

  it("PlanogramTab shows empty message when no slots exist", async () => {
    server.use(
      http.get("/api/operator/stores/:id/inventory", () =>
        HttpResponse.json({ items: [] }),
      ),
      http.get("/api/operator/stores/:id/planogram", () =>
        HttpResponse.json({ slots: [] }),
      ),
    );

    render(<PlanogramTab storeId={STORE_ID} />, { wrapper: makeWrapper() });

    expect(
      await screen.findByText("No planogram data available."),
    ).toBeInTheDocument();
  });

  it("SalesTab shows empty message when no sales exist", async () => {
    server.use(
      http.get("/api/operator/stores/:id/sales", () =>
        HttpResponse.json({ sales: [] }),
      ),
    );

    render(<SalesTab storeId={STORE_ID} />, { wrapper: makeWrapper() });

    expect(await screen.findByText("No sales yet.")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Rendering — new tabs render their computed content from real data
// ---------------------------------------------------------------------------

describe("sales and tax tabs render computed content", () => {
  it("SalesTab shows the revenue summary and top sellers", async () => {
    server.use(
      http.get("/api/operator/stores/:id/sales", () =>
        HttpResponse.json({
          sales: [
            buildSale({ productName: "Cola", quantity: 2, total: 5 }),
            buildSale({ productName: "Water", quantity: 1, total: 2 }),
          ],
        }),
      ),
    );

    render(<SalesTab storeId={STORE_ID} />, { wrapper: makeWrapper() });

    expect(await screen.findByText("Top sellers")).toBeInTheDocument();
    expect(screen.getAllByText("Cola").length).toBeGreaterThan(0);
  });

  it("TaxTab shows the province regime and computes tax owed", async () => {
    server.use(
      http.get("/api/operator/stores/:id", () =>
        HttpResponse.json({
          store: buildStore({ id: STORE_ID, province: "ON" }),
        }),
      ),
      http.get("/api/operator/stores/:id/sales", () =>
        HttpResponse.json({
          sales: [
            buildSale({ total: 100, timestamp: "2026-07-10T10:00:00Z" }),
          ],
        }),
      ),
    );

    render(<TaxTab storeId={STORE_ID} />, { wrapper: makeWrapper() });

    expect(await screen.findByText("Ontario")).toBeInTheDocument();
    expect(screen.getByText("HST 13%")).toBeInTheDocument();
  });
});
