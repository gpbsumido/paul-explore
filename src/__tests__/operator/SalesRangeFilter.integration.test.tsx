import { describe, it, expect, beforeEach } from "vitest";
import { render, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { server } from "@/test/server";
import SalesTab from "@/components/operator/SalesTab";
import { buildSale } from "@/test/factories/operator";

const STORE_ID = "store-range-1";
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
    http.get(`/api/operator/stores/${STORE_ID}/sales`, () =>
      HttpResponse.json({
        sales: [
          buildSale({
            productName: "FreshSeller",
            total: 20,
            timestamp: new Date(now - 2 * DAY).toISOString(),
          }),
          buildSale({
            productName: "StaleSeller",
            total: 50,
            timestamp: new Date(now - 120 * DAY).toISOString(),
          }),
        ],
      }),
    ),
  );
});

describe("SalesTab range toggle filters the whole tab", () => {
  it("drops out-of-range products from the top sellers when switching to Day", async () => {
    const user = userEvent.setup();
    const { container } = render(<SalesTab storeId={STORE_ID} />, {
      wrapper: makeWrapper(),
    });
    const view = within(container);

    // Default is Month, so both a recent and a months-old sale are in range.
    expect((await view.findAllByText("StaleSeller")).length).toBeGreaterThan(0);
    expect(view.getAllByText("FreshSeller").length).toBeGreaterThan(0);

    // Switch to Day (last 7 days): the months-old product falls out entirely.
    await user.click(view.getByRole("button", { name: "Day" }));

    await waitFor(() =>
      expect(view.queryAllByText("StaleSeller")).toHaveLength(0),
    );
    expect(view.getAllByText("FreshSeller").length).toBeGreaterThan(0);
  });
});
