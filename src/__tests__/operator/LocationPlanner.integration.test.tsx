import { describe, it, expect, beforeEach } from "vitest";
import { render, waitFor, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { server } from "@/test/server";
import LocationPlanner from "@/components/operator/LocationPlanner";
import { DEFAULT_PLANNER_INPUTS, projectLocation } from "@/lib/operator-planner";

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

describe("LocationPlanner presets and projection", () => {
  const slider = (view: ReturnType<typeof within>, name: string) =>
    view.getByLabelText(name) as HTMLInputElement;

  it("sets the conversion rate from the location type", async () => {
    const { container } = render(<LocationPlanner />, { wrapper: makeWrapper() });
    const view = within(container);

    await userEvent.click(view.getByRole("button", { name: "Workplace" }));

    expect(slider(view, "Conversion rate").value).toBe("9");
    expect(view.getByRole("button", { name: "Workplace" })).toHaveAttribute("aria-pressed", "true");
    expect(view.getByRole("button", { name: "Residential" })).toHaveAttribute("aria-pressed", "false");
  });

  it("sets the gross margin from the product mix", async () => {
    const { container } = render(<LocationPlanner />, { wrapper: makeWrapper() });
    const view = within(container);

    await userEvent.click(view.getByRole("button", { name: "Specialty" }));

    expect(slider(view, "Gross margin").value).toBe("55");
  });

  it("puts every assumption back to the defaults on reset", async () => {
    const { container } = render(<LocationPlanner />, { wrapper: makeWrapper() });
    const view = within(container);
    await userEvent.click(view.getByRole("button", { name: "Workplace" }));
    await userEvent.click(view.getByRole("button", { name: "Retail" }));

    await userEvent.click(view.getByRole("button", { name: /reset to defaults/i }));

    expect(slider(view, "Conversion rate").value).toBe(String(DEFAULT_PLANNER_INPUTS.conversionRate));
    expect(slider(view, "Basket price").value).toBe(String(DEFAULT_PLANNER_INPUTS.avgItemPrice));
  });

  it("charges the bulk hardware price from three units", async () => {
    const { container } = render(<LocationPlanner />, { wrapper: makeWrapper() });
    const view = within(container);
    const hardwareCost = () =>
      view.getByText("Hardware cost").closest("div")?.querySelector("dd")?.textContent;
    await waitFor(() => expect(hardwareCost()).toBe("$6,295.00"));

    fireEvent.change(slider(view, "Units at this location"), { target: { value: "3" } });

    await waitFor(() => expect(hardwareCost()).toBe("$17,985.00"));
  });

  it("multiplies revenue by the number of units but keeps revenue per unit the same", async () => {
    const { container } = render(<LocationPlanner />, { wrapper: makeWrapper() });
    const view = within(container);
    const figure = (label: string) =>
      view.getByText(label).closest("div")?.querySelector("dd")?.textContent;
    await waitFor(() => expect(figure("Gross revenue / year")).toBe("$11,542.56"));

    fireEvent.change(slider(view, "Units at this location"), { target: { value: "3" } });

    await waitFor(() => expect(figure("Gross revenue / year")).toBe("$34,627.56"));
    // A third of that, to the cent.
    expect(figure("Revenue / unit / year")).toBe("$11,542.52");
  });

  it("shows the payback the projection works out for a location that earns its keep", async () => {
    const { container } = render(<LocationPlanner />, { wrapper: makeWrapper() });
    const view = within(container);
    const { paybackMonths } = projectLocation(DEFAULT_PLANNER_INPUTS);

    expect(paybackMonths).not.toBeNull();
    expect(await view.findByText(`${paybackMonths} months`)).toBeInTheDocument();
    expect(view.queryByText(/never pays back/i)).not.toBeInTheDocument();
  });

  it("keeps the address bar in step with the assumptions so the plan can be shared", async () => {
    const { container } = render(<LocationPlanner />, { wrapper: makeWrapper() });
    const view = within(container);

    fireEvent.change(slider(view, "Daily foot traffic"), { target: { value: "150" } });

    await waitFor(() => expect(new URLSearchParams(window.location.search).get("ft")).toBe("150"));
  });

  it("only offers the fleet's averages when it has been asked to prefill", async () => {
    const { container } = render(
      <LocationPlanner prefillFromFleet={false} />,
      { wrapper: makeWrapper() },
    );
    const view = within(container);

    // The benchmarks request would have landed by now; give it a beat to be sure.
    await expect(
      view.findByRole("button", { name: /use fleet averages/i }, { timeout: 300 }),
    ).rejects.toThrow();
  });

  it("offers no fleet averages when the fleet has no sales to learn from", async () => {
    server.use(
      http.get("/api/operator/planner/benchmarks", () => HttpResponse.json({ benchmarks: null })),
    );
    const { container } = render(<LocationPlanner />, { wrapper: makeWrapper() });
    const view = within(container);

    await expect(
      view.findByRole("button", { name: /use fleet averages/i }, { timeout: 300 }),
    ).rejects.toThrow();
  });
});
