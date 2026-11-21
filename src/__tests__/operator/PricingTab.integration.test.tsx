import { describe, it, expect, beforeEach } from "vitest";
import { render, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { server } from "@/test/server";
import PricingTab from "@/components/operator/PricingTab";
import { buildStore, buildInventoryItem, buildSale } from "@/test/factories/operator";

const STORE_ID = "store-pricing-1";
const DAY = 24 * 60 * 60 * 1000;

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

beforeEach(() => {
  const now = Date.now();
  server.use(
    http.get(`/api/operator/stores/${STORE_ID}`, () =>
      HttpResponse.json({
        store: buildStore({ id: STORE_ID, province: "AB" }),
      }),
    ),
    http.get(`/api/operator/stores/${STORE_ID}/inventory`, () =>
      HttpResponse.json({
        items: [
          buildInventoryItem({
            id: "item-cola",
            storeId: STORE_ID,
            productName: "Cola",
            category: "beverages",
            price: 2,
          }),
        ],
      }),
    ),
    http.get(`/api/operator/stores/${STORE_ID}/sales`, () =>
      HttpResponse.json({
        sales: [
          buildSale({
            productName: "Cola",
            quantity: 10,
            total: 20,
            timestamp: new Date(now - 1 * DAY).toISOString(),
          }),
        ],
      }),
    ),
  );
});

describe("PricingTab", () => {
  it("recomputes the revenue impact when a product discount is applied", async () => {
    const user = userEvent.setup();
    const { container } = render(<PricingTab storeId={STORE_ID} />, {
      wrapper: makeWrapper(),
    });
    const view = within(container);

    // 10 units/week at $2 = $20/week at list and, with no discount, at promo too.
    await view.findByText("Cola");
    expect(view.getAllByText("$20.00").length).toBeGreaterThanOrEqual(2);

    // Apply 10% off to Cola: promo price $1.80, weekly promo revenue $18.00.
    await user.click(
      view.getByRole("button", { name: "Set Cola discount to 10%" }),
    );

    await waitFor(() =>
      expect(view.getByText("$18.00")).toBeInTheDocument(),
    );
    // The impact line shows the week's revenue given up.
    expect(view.getByText(/\$2\.00 \/ week/)).toBeInTheDocument();
  });

  it("warns when a clearance discount pushes a product below cost", async () => {
    const user = userEvent.setup();
    const { container } = render(<PricingTab storeId={STORE_ID} />, {
      wrapper: makeWrapper(),
    });
    const view = within(container);

    await view.findByText("Cola");
    // Default margin 45% on a $2 item -> cost $1.10. A 50% clearance -> $1.00,
    // below cost.
    await user.click(
      view.getByRole("button", { name: "Set Cola discount to 50%" }),
    );

    await waitFor(() =>
      expect(view.getByText(/priced\s+below cost/i)).toBeInTheDocument(),
    );
  });

  it("shows an empty state when the store has no products", async () => {
    server.use(
      http.get(`/api/operator/stores/${STORE_ID}/inventory`, () =>
        HttpResponse.json({ items: [] }),
      ),
    );
    const { container } = render(<PricingTab storeId={STORE_ID} />, {
      wrapper: makeWrapper(),
    });
    expect(
      await within(container).findByText(/nothing to price/i),
    ).toBeInTheDocument();
  });
});

describe("PricingTab with two products", () => {
  beforeEach(() => {
    const now = Date.now();
    server.use(
      http.get(`/api/operator/stores/${STORE_ID}/inventory`, () =>
        HttpResponse.json({
          items: [
            buildInventoryItem({ id: "item-cola", storeId: STORE_ID, productName: "Cola", price: 2 }),
            buildInventoryItem({ id: "item-chips", storeId: STORE_ID, productName: "Chips", price: 3 }),
          ],
        }),
      ),
      http.get(`/api/operator/stores/${STORE_ID}/sales`, () =>
        HttpResponse.json({
          sales: [
            buildSale({ productName: "Cola", quantity: 10, total: 20, timestamp: new Date(now - DAY).toISOString() }),
            buildSale({ productName: "Chips", quantity: 5, total: 15, timestamp: new Date(now - DAY).toISOString() }),
          ],
        }),
      ),
    );
  });

  /** The figure under a headline label, e.g. "Profit at list". */
  const headline = (view: ReturnType<typeof within>, label: string) =>
    view.getByText(label).closest("div")?.querySelector("dd")?.textContent;

  it("applies a store-wide discount to every product and totals the revenue given up", async () => {
    const user = userEvent.setup();
    const { container } = render(<PricingTab storeId={STORE_ID} />, { wrapper: makeWrapper() });
    const view = within(container);
    await view.findByText("Cola");
    expect(headline(view, "Revenue at list")).toBe("$35.00");

    await user.click(view.getByRole("button", { name: "20% off" }));

    await waitFor(() => expect(headline(view, "Revenue with promos")).toBe("$28.00"));
    expect(headline(view, "Revenue at list")).toBe("$35.00");
    expect(view.getByText(/−\$7\.00 \/ week/)).toBeInTheDocument();
    expect(view.getByText(/2 on promo at 20% avg/)).toBeInTheDocument();
  });

  it("clears every discount again with Clear all", async () => {
    const user = userEvent.setup();
    const { container } = render(<PricingTab storeId={STORE_ID} />, { wrapper: makeWrapper() });
    const view = within(container);
    await user.click(await view.findByRole("button", { name: "30% off" }));
    await waitFor(() => expect(headline(view, "Revenue with promos")).toBe("$24.50"));

    await user.click(view.getByRole("button", { name: "Clear all" }));

    await waitFor(() => expect(headline(view, "Revenue with promos")).toBe("$35.00"));
    expect(view.queryByText(/on promo at/)).not.toBeInTheDocument();
  });

  it("projects profit from the assumed margin, before and after promos", async () => {
    const user = userEvent.setup();
    const { container } = render(<PricingTab storeId={STORE_ID} />, { wrapper: makeWrapper() });
    const view = within(container);
    await view.findByText("Cola");

    // 45% margin by default: 35.00 of revenue leaves 15.75 of profit.
    expect(headline(view, "Profit at list")).toBe("$15.75");

    await user.click(view.getByRole("button", { name: "20% off" }));

    // Promo prices 1.60 and 2.40 against costs 1.10 and 1.65: 10 * 0.50 + 5 * 0.75.
    await waitFor(() => expect(headline(view, "Profit with promos")).toBe("$8.75"));
  });

  it("only warns about selling below cost when a discount really goes under it, and a higher margin lifts the warning", async () => {
    const user = userEvent.setup();
    const { container } = render(<PricingTab storeId={STORE_ID} />, { wrapper: makeWrapper() });
    const view = within(container);
    await view.findByText("Cola");

    await user.click(view.getByRole("button", { name: "20% off" }));
    await waitFor(() => expect(headline(view, "Revenue with promos")).toBe("$28.00"));
    expect(view.queryByText(/below cost at this margin/i)).not.toBeInTheDocument();

    await user.click(view.getByRole("button", { name: "50% off" }));
    expect(await view.findByText(/2 products are priced below cost at this margin/i)).toBeInTheDocument();

    // At a 60% margin the cost is low enough that half price still clears it.
    await user.click(view.getByRole("button", { name: "60%" }));
    await waitFor(() =>
      expect(view.queryByText(/below cost at this margin/i)).not.toBeInTheDocument(),
    );
  });

  it("doesn't call a price below cost when it lands exactly on cost", async () => {
    const user = userEvent.setup();
    const { container } = render(<PricingTab storeId={STORE_ID} />, { wrapper: makeWrapper() });
    const view = within(container);
    await view.findByText("Cola");

    // A 50% margin puts cost at half of list, and 50% off prices at exactly that.
    await user.click(view.getByRole("button", { name: "50%" }));
    await user.click(view.getByRole("button", { name: "50% off" }));

    await waitFor(() => expect(headline(view, "Revenue with promos")).toBe("$17.50"));
    expect(view.queryByText(/below cost at this margin/i)).not.toBeInTheDocument();
  });

  it("shows the error rather than an empty price list when the products fail to load", async () => {
    server.use(
      http.get(`/api/operator/stores/${STORE_ID}/inventory`, () =>
        HttpResponse.json({ error: "down" }, { status: 500 }),
      ),
    );
    const { container } = render(<PricingTab storeId={STORE_ID} />, { wrapper: makeWrapper() });

    expect(await within(container).findByText("Failed to fetch inventory")).toBeInTheDocument();
    expect(within(container).queryByText(/nothing to price/i)).not.toBeInTheDocument();
  });
});
