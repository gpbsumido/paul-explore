import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, within, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
    province: "ON",
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

    // fleet stats bar: each tile reads value-then-label
    await waitFor(() => expect(statValue("Low Stock Items")).toBe("3"));
    expect(statValue("Total Stores")).toBe("2");
    expect(statValue("Needs Attention")).toBe("1");
    expect(statValue("Avg Inventory")).toBe("70%");
  });
});

/** The figure shown in the fleet stats tile with this label. */
function statValue(label: string): string | null | undefined {
  return screen.getByText(label).previousElementSibling?.textContent;
}

const summaryFor = (
  store: Store,
  over: Partial<FleetSummaryResponse["summaries"][number]> = {},
): FleetSummaryResponse["summaries"][number] => ({
  storeId: store.id,
  alertCount: 0,
  inventoryHealth: 80,
  hasCritical: false,
  hasWarning: false,
  ...over,
});

/** Serves a fleet whose stats are filled in from its own summaries. */
function serveFleet(
  stores: Store[],
  summaries: FleetSummaryResponse["summaries"],
  fleetStats: Partial<FleetSummaryResponse["fleetStats"]> = {},
) {
  const summary: FleetSummaryResponse = {
    summaries,
    fleetStats: {
      criticalAlerts: 0,
      warningAlerts: 0,
      lowStockItems: 0,
      avgInventoryHealth: 80,
      ...fleetStats,
    },
    alertTrend: emptyTrend(),
  };
  server.use(
    http.get("/api/operator/stores", () => HttpResponse.json({ stores })),
    http.get("/api/operator/fleet-summary", () => HttpResponse.json(summary)),
  );
}

describe("OperatorDashboard filtering", () => {
  const alpha = makeStore({ id: "a", name: "Alpha Market", status: "online" });
  const beta = makeStore({ id: "b", name: "Beta Corner", status: "degraded" });
  const gamma = makeStore({ id: "g", name: "Gamma Outlet", status: "offline" });

  // A first visit opens the tour dialog, which would sit over the grid.
  beforeEach(() => window.localStorage.setItem("operator-tour-seen", "true"));

  /**
   * Names of the store cards in the grid. The sales table further down links to
   * stores too, once its own request lands, so only a link with a card heading
   * counts.
   */
  const visibleNames = () =>
    screen
      .queryAllByRole("link", { hidden: true })
      .map((link) => within(link).queryByRole("heading", { level: 2, hidden: true }))
      .filter((heading) => heading !== null)
      .map((heading) => heading.textContent);

  it("narrows the grid to the stores that need attention from the stats tile", async () => {
    serveFleet(
      [alpha, beta, gamma],
      [summaryFor(alpha), summaryFor(beta), summaryFor(gamma)],
    );
    const user = userEvent.setup();
    render(<OperatorDashboard />, { wrapper: makeWrapper() });
    await screen.findByText("Alpha Market");

    await user.click(screen.getByRole("button", { name: /needs attention/i }));

    expect(visibleNames()).toEqual(["Gamma Outlet", "Beta Corner"]);
  });

  it("narrows the grid by store name as you type", async () => {
    serveFleet([alpha, beta, gamma], [summaryFor(alpha), summaryFor(beta), summaryFor(gamma)]);
    const user = userEvent.setup();
    render(<OperatorDashboard />, { wrapper: makeWrapper() });
    await screen.findByText("Alpha Market");

    await user.type(screen.getByRole("textbox", { name: /search stores/i }), "corner");

    expect(visibleNames()).toEqual(["Beta Corner"]);
  });

  it("says nothing matches and offers to clear the filters", async () => {
    serveFleet([alpha, beta], [summaryFor(alpha), summaryFor(beta)]);
    const user = userEvent.setup();
    render(<OperatorDashboard />, { wrapper: makeWrapper() });
    await screen.findByText("Alpha Market");

    await user.type(screen.getByRole("textbox", { name: /search stores/i }), "zzz");
    expect(screen.getByText(/no stores match the current filters/i)).toBeInTheDocument();
    expect(visibleNames()).toEqual([]);

    await user.click(screen.getByRole("button", { name: /clear filters/i }));

    expect(visibleNames().sort()).toEqual(["Alpha Market", "Beta Corner"]);
  });

  it("filters to stores with a critical alert from the banner, and clears again", async () => {
    serveFleet(
      [alpha, beta],
      [summaryFor(alpha), summaryFor(beta, { alertCount: 2, hasCritical: true })],
      { criticalAlerts: 2 },
    );
    const user = userEvent.setup();
    render(<OperatorDashboard />, { wrapper: makeWrapper() });
    await screen.findByText("Alpha Market");

    await user.click(await screen.findByRole("button", { name: "2 critical" }));
    expect(visibleNames()).toEqual(["Beta Corner"]);
    expect(screen.getByText(/critical alerts only/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /clear severity filter/i }));
    expect(visibleNames().sort()).toEqual(["Alpha Market", "Beta Corner"]);
  });
});

describe("OperatorDashboard stores without a summary", () => {
  const known = makeStore({ id: "k", name: "Known Market" });
  const unknown = makeStore({ id: "u", name: "Unknown Market" });

  beforeEach(() => window.localStorage.setItem("operator-tour-seen", "true"));

  it("shows a dash for a store the summary doesn't mention, not a made-up 0%", async () => {
    serveFleet([known, unknown], [summaryFor(known, { inventoryHealth: 64 })]);
    render(<OperatorDashboard />, { wrapper: makeWrapper() });

    const card = (await screen.findByText("Unknown Market")).closest("a") as HTMLElement;

    await waitFor(() => expect(within(card).getByText("—")).toBeInTheDocument());
    expect(within(card).queryByText("0%")).not.toBeInTheDocument();
  });

  it("leaves it out when filtering by alert severity, since nothing says it has one", async () => {
    serveFleet(
      [known, unknown],
      [summaryFor(known, { alertCount: 1, hasCritical: true })],
      { criticalAlerts: 1 },
    );
    const user = userEvent.setup();
    render(<OperatorDashboard />, { wrapper: makeWrapper() });
    await screen.findByText("Unknown Market");

    await user.click(await screen.findByRole("button", { name: "1 critical" }));

    expect(screen.getByText("Known Market")).toBeInTheDocument();
    expect(screen.queryByText("Unknown Market")).not.toBeInTheDocument();
  });

  it("clear filters also drops an alert-severity filter that matches no store", async () => {
    serveFleet([known], [summaryFor(known)], { criticalAlerts: 1 });
    const user = userEvent.setup();
    render(<OperatorDashboard />, { wrapper: makeWrapper() });
    await screen.findByText("Known Market");

    await user.click(await screen.findByRole("button", { name: "1 critical" }));
    expect(screen.getByText(/no stores match the current filters/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /clear filters/i }));

    expect(screen.getByText("Known Market")).toBeInTheDocument();
    expect(screen.queryByText(/critical alerts only/i)).not.toBeInTheDocument();
  });
});

describe("OperatorDashboard when a request fails", () => {
  it("says the fleet summary failed, still lists the stores, and shows no made-up stats", async () => {
    const stores = [makeStore({ id: "a", name: "Alpha Market" })];
    server.use(
      http.get("/api/operator/stores", () => HttpResponse.json({ stores })),
      http.get("/api/operator/fleet-summary", () =>
        HttpResponse.json({ error: "down" }, { status: 500 }),
      ),
    );
    render(<OperatorDashboard />, { wrapper: makeWrapper() });

    expect(await screen.findByText("Alpha Market")).toBeInTheDocument();
    expect(await screen.findByText(/this is an error, not an empty store/i)).toBeInTheDocument();
    expect(screen.queryByText("Low Stock Items")).not.toBeInTheDocument();
  });

  it("shows the store list error with a retry that asks again", async () => {
    let attempts = 0;
    const stores = [makeStore({ id: "a", name: "Alpha Market" })];
    server.use(
      http.get("/api/operator/stores", () => {
        attempts += 1;
        return attempts === 1
          ? HttpResponse.json({ error: "down" }, { status: 500 })
          : HttpResponse.json({ stores });
      }),
      http.get("/api/operator/fleet-summary", () =>
        HttpResponse.json({
          summaries: [summaryFor(stores[0])],
          fleetStats: { criticalAlerts: 0, warningAlerts: 0, lowStockItems: 0, avgInventoryHealth: 80 },
          alertTrend: emptyTrend(),
        }),
      ),
    );
    const user = userEvent.setup();
    render(<OperatorDashboard />, { wrapper: makeWrapper() });

    expect(await screen.findByText("Failed to fetch stores")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByText("Alpha Market")).toBeInTheDocument();
    expect(attempts).toBe(2);
  });
});

describe("OperatorDashboard guided tour", () => {
  beforeEach(() => window.localStorage.clear());

  function seedFleet() {
    const stores = [makeStore({ id: "s1", name: "Lobby Fridge" })];
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
  }

  it("exposes a Take the tour button and the anchors it points at", async () => {
    window.localStorage.setItem("operator-tour-seen", "true");
    seedFleet();
    render(<OperatorDashboard />, { wrapper: makeWrapper() });
    await screen.findByText("Lobby Fridge");

    expect(
      screen.getByRole("button", { name: /take the tour/i }),
    ).toBeInTheDocument();
    expect(document.getElementById("op-tour-intro")).not.toBeNull();
    expect(document.getElementById("op-tour-stats")).not.toBeNull();
    expect(document.getElementById("op-tour-filters")).not.toBeNull();
    expect(document.getElementById("op-tour-tools")).not.toBeNull();
  });

  it("opens the tour and walks into it", async () => {
    window.localStorage.setItem("operator-tour-seen", "true");
    seedFleet();
    render(<OperatorDashboard />, { wrapper: makeWrapper() });
    await screen.findByText("Lobby Fridge");

    fireEvent.click(screen.getByRole("button", { name: /take the tour/i }));
    const tour = () => screen.getByRole("dialog", { name: /tour/i });
    fireEvent.click(
      within(tour()).getByRole("button", { name: /^next$/i }),
    );
    expect(within(tour()).getByText(/your fleet, live/i)).toBeInTheDocument();
  });
});
