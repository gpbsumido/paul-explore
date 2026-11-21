import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
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

afterEach(() => vi.restoreAllMocks());

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

  it("exports the current rows as a CSV download", async () => {
    const blobs: Blob[] = [];
    vi.spyOn(URL, "createObjectURL").mockImplementation((blob) => {
      blobs.push(blob as Blob);
      return "blob:mock";
    });
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const downloads: string[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      downloads.push(this.download);
    });

    const { container } = render(<ProductPerformance />, {
      wrapper: makeWrapper(),
    });
    const view = within(container);
    const user = userEvent.setup();

    await user.click(await view.findByRole("button", { name: /download csv/i }));

    expect(downloads).toEqual(["product-performance-30d.csv"]);
    expect((await blobs[0].text()).split("\r\n")).toEqual([
      "Product,Category,Units,Avg per day,Revenue,Category index",
      "Cola,beverages,120,4,240,150",
    ]);
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

describe("ProductPerformance verdicts and states", () => {
  const withIndexes = (indexes: number[]) =>
    server.use(
      http.get("/api/operator/product-performance", () =>
        HttpResponse.json({
          rangeId: "30d",
          days: 30,
          products: indexes.map((performanceIndex) => ({
            ...ROW,
            productName: `Index ${performanceIndex}`,
            performanceIndex,
          })),
        }),
      ),
    );

  it.each([
    [110, "Above avg"],
    [109, "Average"],
    [91, "Average"],
    [90, "Below avg"],
  ])("calls a product at %i%% of its category %s", async (index, label) => {
    withIndexes([index]);
    const { container } = render(<ProductPerformance />, { wrapper: makeWrapper() });
    const view = within(container);

    const row = (await view.findByText(`Index ${index}`)).closest("tr") as HTMLElement;

    expect(within(row).getByText(label)).toBeInTheDocument();
    expect(within(row).getByText(String(index))).toBeInTheDocument();
  });

  it("asks the API for the range picked", async () => {
    const asked: (string | null)[] = [];
    server.use(
      http.get("/api/operator/product-performance", ({ request }) => {
        asked.push(new URL(request.url).searchParams.get("range"));
        return HttpResponse.json({ rangeId: "30d", days: 30, products: [ROW] });
      }),
    );
    const { container } = render(<ProductPerformance />, { wrapper: makeWrapper() });
    const view = within(container);
    const user = userEvent.setup();
    await view.findByText("Cola");

    await user.click(view.getByRole("button", { name: "90 days" }));

    await waitFor(() => expect(asked).toEqual(["30d", "90d"]));
  });

  it("says the report failed to load, with a retry, instead of an empty table", async () => {
    let requests = 0;
    server.use(
      http.get("/api/operator/product-performance", () => {
        requests += 1;
        return requests === 1
          ? HttpResponse.json({ error: "down" }, { status: 500 })
          : HttpResponse.json({ rangeId: "30d", days: 30, products: [ROW] });
      }),
    );
    const { container } = render(<ProductPerformance />, { wrapper: makeWrapper() });
    const view = within(container);
    const user = userEvent.setup();

    expect(await view.findByText(/could not load product performance/i)).toBeInTheDocument();
    expect(view.queryByRole("button", { name: /download csv/i })).not.toBeInTheDocument();
    await user.click(view.getByRole("button", { name: /try again/i }));

    expect(await view.findByText("Cola")).toBeInTheDocument();
  });

  it("offers no CSV when there is nothing to export", async () => {
    server.use(
      http.get("/api/operator/product-performance", () =>
        HttpResponse.json({ rangeId: "30d", days: 30, products: [] }),
      ),
    );
    const { container } = render(<ProductPerformance />, { wrapper: makeWrapper() });
    const view = within(container);

    await view.findByText(/no products stocked or sold/i);

    expect(view.queryByRole("button", { name: /download csv/i })).not.toBeInTheDocument();
  });
});
