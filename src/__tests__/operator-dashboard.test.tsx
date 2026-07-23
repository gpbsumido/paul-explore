import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { server } from "@/test/server";
import OperatorDashboard from "@/app/operator/OperatorDashboard";
import type { Store, FleetSummaryResponse } from "@/types/operator";

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

function recentPing(): string {
  return new Date(Date.now() - 30_000).toISOString();
}

function makeStore(overrides: Partial<Store>): Store {
  return {
    id: "store-001",
    name: "Test Store",
    location: "Floor 1",
    status: "online",
    temperature: 3.5,
    lastPing: recentPing(),
    uptime: 99.2,
    revenue24h: 125.0,
    ...overrides,
  };
}

function emptyTrend(): FleetSummaryResponse["alertTrend"] {
  return Array.from({ length: 24 }, (_, i) => ({
    hour: `${i % 12 || 12} ${i < 12 ? "AM" : "PM"}`,
    count: 0,
  }));
}

// ---------------------------------------------------------------------------
// Store card rendering
// ---------------------------------------------------------------------------

describe("OperatorDashboard", () => {
  it("renders a store card for every store in the fleet", async () => {
    const stores = [
      makeStore({ id: "s1", name: "Lobby Fridge" }),
      makeStore({ id: "s2", name: "Break Room Cooler" }),
      makeStore({ id: "s3", name: "Gym Vending" }),
    ];

    const summary: FleetSummaryResponse = {
      summaries: stores.map((s) => ({
        storeId: s.id,
        alertCount: 0,
        inventoryHealth: 80,
        hasCritical: false,
        hasWarning: false,
      })),
      fleetStats: {
        criticalAlerts: 0,
        warningAlerts: 0,
        lowStockItems: 0,
        avgInventoryHealth: 80,
      },
      alertTrend: emptyTrend(),
    };

    server.use(
      http.get("/api/operator/stores", () => HttpResponse.json({ stores })),
      http.get("/api/operator/fleet-summary", () => HttpResponse.json(summary)),
    );

    render(<OperatorDashboard />, { wrapper: makeWrapper() });

    expect(await screen.findByText("Lobby Fridge")).toBeInTheDocument();
    expect(screen.getByText("Break Room Cooler")).toBeInTheDocument();
    expect(screen.getByText("Gym Vending")).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Sort order: offline > degraded+alerts > degraded > online
  // ---------------------------------------------------------------------------

  it("sorts stores worst-first: offline, degraded with alerts, online", async () => {
    const stores = [
      makeStore({ id: "online-1", name: "Alpha Market", status: "online" }),
      makeStore({
        id: "degraded-1",
        name: "Beta Corner",
        status: "degraded",
      }),
      makeStore({ id: "offline-1", name: "Gamma Outlet", status: "offline" }),
    ];

    const summary: FleetSummaryResponse = {
      summaries: [
        {
          storeId: "online-1",
          alertCount: 0,
          inventoryHealth: 90,
          hasCritical: false,
          hasWarning: false,
        },
        {
          storeId: "degraded-1",
          alertCount: 2,
          inventoryHealth: 45,
          hasCritical: true,
          hasWarning: false,
        },
        {
          storeId: "offline-1",
          alertCount: 0,
          inventoryHealth: 60,
          hasCritical: false,
          hasWarning: false,
        },
      ],
      fleetStats: {
        criticalAlerts: 2,
        warningAlerts: 0,
        lowStockItems: 1,
        avgInventoryHealth: 65,
      },
      alertTrend: emptyTrend(),
    };

    server.use(
      http.get("/api/operator/stores", () => HttpResponse.json({ stores })),
      http.get("/api/operator/fleet-summary", () => HttpResponse.json(summary)),
    );

    render(<OperatorDashboard />, { wrapper: makeWrapper() });

    // wait for the first card to appear
    await screen.findByText("Gamma Outlet");

    // all store cards render as links to their detail page
    const grid = screen
      .getByText("Gamma Outlet")
      .closest(".grid") as HTMLElement;
    const headings = within(grid).getAllByRole("heading", { level: 2 });
    const order = headings.map((h) => h.textContent);

    // offline (score 0) > degraded with alerts (score 0.5) > online (score 2)
    expect(order).toEqual(["Gamma Outlet", "Beta Corner", "Alpha Market"]);
  });

  // ---------------------------------------------------------------------------
  // Alert and inventory data shown on cards
  // ---------------------------------------------------------------------------

  it("displays alert count and inventory health from fleet summary", async () => {
    const stores = [
      makeStore({ id: "s1", name: "Snack Hub", status: "degraded" }),
    ];

    const summary: FleetSummaryResponse = {
      summaries: [
        {
          storeId: "s1",
          alertCount: 3,
          inventoryHealth: 42,
          hasCritical: true,
          hasWarning: true,
        },
      ],
      fleetStats: {
        criticalAlerts: 1,
        warningAlerts: 2,
        lowStockItems: 4,
        avgInventoryHealth: 42,
      },
      alertTrend: emptyTrend(),
    };

    server.use(
      http.get("/api/operator/stores", () => HttpResponse.json({ stores })),
      http.get("/api/operator/fleet-summary", () => HttpResponse.json(summary)),
    );

    render(<OperatorDashboard />, { wrapper: makeWrapper() });

    const card = (await screen.findByText("Snack Hub")).closest(
      "a",
    ) as HTMLElement;

    // alert count shown on the card
    expect(within(card).getByText("3 alerts")).toBeInTheDocument();

    // inventory health percentage shown on the card
    expect(within(card).getByText("42%")).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Fleet stats bar values
  // ---------------------------------------------------------------------------

  it("shows fleet stats from the summary response", async () => {
    const stores = [
      makeStore({ id: "s1", name: "Store One", status: "online" }),
      makeStore({ id: "s2", name: "Store Two", status: "degraded" }),
    ];

    const summary: FleetSummaryResponse = {
      summaries: [
        {
          storeId: "s1",
          alertCount: 0,
          inventoryHealth: 90,
          hasCritical: false,
          hasWarning: false,
        },
        {
          storeId: "s2",
          alertCount: 1,
          inventoryHealth: 50,
          hasCritical: false,
          hasWarning: true,
        },
      ],
      fleetStats: {
        criticalAlerts: 0,
        warningAlerts: 1,
        lowStockItems: 3,
        avgInventoryHealth: 70,
      },
      alertTrend: emptyTrend(),
    };

    server.use(
      http.get("/api/operator/stores", () => HttpResponse.json({ stores })),
      http.get("/api/operator/fleet-summary", () => HttpResponse.json(summary)),
    );

    render(<OperatorDashboard />, { wrapper: makeWrapper() });

    await screen.findByText("Store One");

    // fleet stats bar
    expect(screen.getByText("Total Stores")).toBeInTheDocument();
    expect(screen.getByText("Needs Attention")).toBeInTheDocument();
    expect(screen.getByText("Low Stock Items")).toBeInTheDocument();
  });
});
