import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
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

  it("PlanogramTab shows error message when the planogram fetch fails", async () => {
    server.use(
      http.get("/api/operator/stores/:id/planogram", () =>
        HttpResponse.json({ error: "Server error" }, { status: 500 }),
      ),
    );

    render(<PlanogramTab storeId={STORE_ID} />, { wrapper: makeWrapper() });

    expect(
      await screen.findByText("Failed to fetch planogram"),
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
  /** The value shown next to a label in a dt/dd or dt/dd-like pair. */
  const valueNextTo = (label: string): string | null | undefined =>
    screen.getByText(label).nextElementSibling?.textContent;

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

    await screen.findByText("Top sellers");
    expect(valueNextTo("Revenue")).toBe("$7.00");
    expect(valueNextTo("Units sold")).toBe("3");
    expect(valueNextTo("Transactions")).toBe("2");
    expect(valueNextTo("Avg sale")).toBe("$3.50");

    // Cola brought in more, so it leads the top sellers list
    const topSellers = screen.getByText("Top sellers").nextElementSibling;
    const rows = within(topSellers as HTMLElement).getAllByRole("listitem");
    expect(rows.map((row) => row.textContent)).toEqual([
      "Cola2 units$5.00",
      "Water1 units$2.00",
    ]);
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

    // $100 of sales in Ontario is $13 of HST, all of it federal
    const owedSection = screen
      .getByText("Tax to remit")
      .closest("section") as HTMLElement;
    expect(within(owedSection).getByText("$13.00", { selector: "p" })).toBeInTheDocument();
    expect(
      within(owedSection).getByText(/Federal \(GST\/HST\)/).nextElementSibling
        ?.textContent,
    ).toBe("$13.00");
    expect(
      within(owedSection).getByText(/Provincial \(PST\)/).nextElementSibling
        ?.textContent,
    ).toBe("$0.00");

    const latestSection = screen
      .getByText("Latest period")
      .closest("section") as HTMLElement;
    expect(within(latestSection).getByText("2026-07")).toBeInTheDocument();
    expect(within(latestSection).getByText("Sales (pre-tax)").nextElementSibling?.textContent).toBe("$100.00");
    expect(within(latestSection).getByText("Total billed").nextElementSibling?.textContent).toBe("$113.00");
  });

  it("TaxTab splits what is owed between federal and provincial", async () => {
    server.use(
      http.get("/api/operator/stores/:id", () =>
        HttpResponse.json({
          store: buildStore({ id: STORE_ID, province: "BC" }),
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

    await screen.findByText("British Columbia");
    // $100 in BC is $5 GST (federal) and $7 PST (provincial), $12 in all
    const owedSection = screen
      .getByText("Tax to remit")
      .closest("section") as HTMLElement;
    expect(
      within(owedSection).getByText("$12.00", { selector: "p" }),
    ).toBeInTheDocument();
    expect(
      within(owedSection).getByText(/Federal \(GST\/HST\)/).nextElementSibling
        ?.textContent,
    ).toBe("$5.00");
    expect(
      within(owedSection).getByText(/Provincial \(PST\)/).nextElementSibling
        ?.textContent,
    ).toBe("$7.00");
  });

  it("TaxTab says there is nothing to remit when there are no sales", async () => {
    server.use(
      http.get("/api/operator/stores/:id", () =>
        HttpResponse.json({ store: buildStore({ id: STORE_ID, province: "ON" }) }),
      ),
      http.get("/api/operator/stores/:id/sales", () =>
        HttpResponse.json({ sales: [] }),
      ),
    );

    render(<TaxTab storeId={STORE_ID} />, { wrapper: makeWrapper() });

    expect(
      await screen.findByText("No sales yet, so no tax to remit."),
    ).toBeInTheDocument();
    const owedSection = screen
      .getByText("Tax to remit")
      .closest("section") as HTMLElement;
    expect(within(owedSection).getByText("$0.00", { selector: "p" })).toBeInTheDocument();
  });

  it("TaxTab lists a GST plus QST regime for Quebec and GST alone for Alberta", async () => {
    server.use(
      http.get("/api/operator/stores/:id", () =>
        HttpResponse.json({ store: buildStore({ id: STORE_ID, province: "QC" }) }),
      ),
      http.get("/api/operator/stores/:id/sales", () =>
        HttpResponse.json({ sales: [] }),
      ),
    );
    const quebec = render(<TaxTab storeId={STORE_ID} />, {
      wrapper: makeWrapper(),
    });
    expect(await screen.findByText("GST 5% + QST 9.975%")).toBeInTheDocument();
    quebec.unmount();

    server.use(
      http.get("/api/operator/stores/:id", () =>
        HttpResponse.json({ store: buildStore({ id: STORE_ID, province: "AB" }) }),
      ),
    );
    render(<TaxTab storeId={STORE_ID} />, { wrapper: makeWrapper() });
    expect(await screen.findByText("GST 5%")).toBeInTheDocument();
  });
});
