import { describe, it, expect, beforeEach } from "vitest";
import { render, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { server } from "@/test/server";
import ProductPerformance from "@/components/operator/ProductPerformance";

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

const ROW = {
  productName: "Cola",
  category: "beverages",
  unitsSold: 120,
  revenue: 240,
  avgPerDay: 4,
  performanceIndex: 150,
  hasSales: true,
};

beforeEach(() => {
  server.use(
    http.get("/api/operator/product-performance", ({ request }) => {
      const range = new URL(request.url).searchParams.get("range");
      // 7d window returns a single dead SKU; anything else returns the seller.
      if (range === "7d") {
        return HttpResponse.json({
          rangeId: "7d",
          days: 7,
          products: [
            {
              productName: "Kombucha",
              category: "beverages",
              unitsSold: 0,
              revenue: 0,
              avgPerDay: 0,
              performanceIndex: 0,
              hasSales: false,
            },
          ],
        });
      }
      return HttpResponse.json({ rangeId: "30d", days: 30, products: [ROW] });
    }),
  );
});

describe("ProductPerformance", () => {
  it("ranks products with a category-relative verdict", async () => {
    const { container } = render(<ProductPerformance />, {
      wrapper: makeWrapper(),
    });
    const view = within(container);

    await view.findByText("Cola");
    expect(view.getByText("Above avg")).toBeInTheDocument();
    expect(view.getByText("$240.00")).toBeInTheDocument();
  });

  it("flags a stocked product with no sales when the range changes", async () => {
    const { container } = render(<ProductPerformance />, {
      wrapper: makeWrapper(),
    });
    const view = within(container);
    const user = userEvent.setup();

    await view.findByText("Cola");
    await user.click(view.getByRole("button", { name: "7 days" }));

    await waitFor(() =>
      expect(view.getByText("Kombucha")).toBeInTheDocument(),
    );
    expect(view.getByText("No sales")).toBeInTheDocument();
  });

  it("shows an empty state when nothing is stocked or sold", async () => {
    server.use(
      http.get("/api/operator/product-performance", () =>
        HttpResponse.json({ rangeId: "30d", days: 30, products: [] }),
      ),
    );
    const { container } = render(<ProductPerformance />, {
      wrapper: makeWrapper(),
    });
    expect(
      await within(container).findByText(/no products stocked or sold/i),
    ).toBeInTheDocument();
  });

  it("renders the products as an accessible table", async () => {
    const { container } = render(<ProductPerformance />, {
      wrapper: makeWrapper(),
    });
    const view = within(container);
    await view.findByText("Cola");
    expect(view.getByRole("table")).toBeInTheDocument();
    expect(
      view.getByRole("columnheader", { name: "Revenue" }),
    ).toBeInTheDocument();
  });
});
