import { describe, it, expect, beforeEach } from "vitest";
import { render, waitFor, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { server } from "@/test/server";
import LocationPlanner from "@/components/operator/LocationPlanner";
import { DEFAULT_PLANNER_INPUTS } from "@/lib/operator-planner";

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
  server.use(
    http.get("/api/operator/planner/benchmarks", () =>
      HttpResponse.json({
        benchmarks: { avgItemPrice: 3.25, itemsPerOrder: 2.2, sampleSize: 1240 },
      }),
    ),
  );
});

describe("LocationPlanner", () => {
  it("raises projected revenue when foot traffic goes up", async () => {
    const { container } = render(<LocationPlanner />, { wrapper: makeWrapper() });
    const view = within(container);

    // Read the gross-revenue figure specifically (revenue/unit is identical at
    // one unit, so a bare text query would match two elements).
    const grossRevenue = () =>
      view
        .getByText("Gross revenue / year")
        .closest("div")
        ?.querySelector("dd")?.textContent;

    // Default 75 traffic -> $11,542.56 gross revenue / year.
    await waitFor(() => expect(grossRevenue()).toBe("$11,542.56"));

    // Double the traffic to 150 -> revenue doubles.
    fireEvent.change(view.getByLabelText("Daily foot traffic"), {
      target: { value: "150" },
    });

    await waitFor(() => expect(grossRevenue()).toBe("$23,085.00"));
  });

  it("applies a price-tier preset to the basket price", async () => {
    const { container } = render(<LocationPlanner />, { wrapper: makeWrapper() });
    const view = within(container);
    const user = userEvent.setup();

    await user.click(view.getByRole("button", { name: "Retail" }));

    const priceSlider = view.getByLabelText("Basket price") as HTMLInputElement;
    expect(priceSlider.value).toBe("7");
  });

  it("prefills basket and items from the fleet's real averages on request", async () => {
    const { container } = render(<LocationPlanner />, { wrapper: makeWrapper() });
    const view = within(container);
    const user = userEvent.setup();

    await user.click(await view.findByRole("button", { name: /use fleet averages/i }));

    expect((view.getByLabelText("Basket price") as HTMLInputElement).value).toBe(
      "3.25",
    );
    expect(
      (view.getByLabelText("Items per order") as HTMLInputElement).value,
    ).toBe("2.2");
  });

  it("says so honestly when a location never pays back", async () => {
    const doomed = {
      ...DEFAULT_PLANNER_INPUTS,
      dailyFootTraffic: 5,
      conversionRate: 2,
      avgItemPrice: 2,
      itemsPerOrder: 1,
      margin: 30,
    };
    const { container } = render(
      <LocationPlanner initialInputs={doomed} prefillFromFleet={false} />,
      { wrapper: makeWrapper() },
    );
    const view = within(container);

    expect(await view.findByText(/never pays back/i)).toBeInTheDocument();
    expect(view.queryByText(/months$/)).not.toBeInTheDocument();
  });

  it("labels its inputs and exposes the projection as a live region", () => {
    const { container } = render(<LocationPlanner />, { wrapper: makeWrapper() });
    const view = within(container);

    expect(view.getByLabelText("Daily foot traffic")).toBeInTheDocument();
    expect(view.getByLabelText("Gross margin")).toBeInTheDocument();
    // The projection panel announces updates without stealing focus.
    expect(view.getByRole("status")).toBeInTheDocument();
  });
});
