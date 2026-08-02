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
