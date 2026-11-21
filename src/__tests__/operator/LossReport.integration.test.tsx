import { describe, it, expect, beforeEach } from "vitest";
import { render, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { server } from "@/test/server";
import LossReport from "@/components/operator/LossReport";
import type { ShrinkSummary } from "@/lib/operator-shrink";

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

const EMPTY: ShrinkSummary = {
  unexplainedUnits: 0,
  unexplainedValue: 0,
  explainedUnits: 0,
  explainedValue: 0,
  explainedByReason: {},
  countedLines: 0,
  notCountedLines: 0,
};

function fleet() {
  return {
    stores: [
      {
        storeId: "s2",
        storeName: "Busy Gym",
        ...EMPTY,
        unexplainedUnits: 6,
        unexplainedValue: 18,
        countedLines: 5,
      },
      {
        storeId: "s1",
        storeName: "Quiet Lobby",
        ...EMPTY,
        unexplainedUnits: 1,
        unexplainedValue: 2,
        countedLines: 4,
      },
    ],
    totals: {
      ...EMPTY,
      unexplainedUnits: 7,
      unexplainedValue: 20,
      explainedUnits: 5,
      explainedValue: 12.5,
      explainedByReason: { expired: 3, damaged: 2 },
      countedLines: 9,
      notCountedLines: 3,
    },
  };
}

beforeEach(() => {
  server.use(
    http.get("/api/operator/shrink-summary", () => HttpResponse.json(fleet())),
  );
});

describe("LossReport", () => {
  it("leads with the fleet's unexplained shrink", async () => {
    const { container } = render(<LossReport />, { wrapper: makeWrapper() });
    const view = within(container);

    expect(await view.findByText("$20.00")).toBeInTheDocument();
    expect(view.getByText(/7 units, no reason logged/i)).toBeInTheDocument();
  });

  it("breaks explained loss down by reason", async () => {
    const { container } = render(<LossReport />, { wrapper: makeWrapper() });
    const view = within(container);

    expect(await view.findByText(/3 expired, 2 damaged/i)).toBeInTheDocument();
  });

  it("lists the stores in the order the server ranked them, worst first", async () => {
    const { container } = render(<LossReport />, { wrapper: makeWrapper() });
    const view = within(container);

    await view.findByText("Busy Gym");
    const rows = view.getAllByRole("row");
    // rows[0] is the header; the first data row is the worst store.
    expect(within(rows[1]).getByText("Busy Gym")).toBeInTheDocument();
  });

  it("says there's nothing to reconcile when no counts exist", async () => {
    server.use(
      http.get("/api/operator/shrink-summary", () =>
        HttpResponse.json({ stores: [], totals: EMPTY }),
      ),
    );
    const { container } = render(<LossReport />, { wrapper: makeWrapper() });
    expect(
      await within(container).findByText(/nothing to reconcile/i),
    ).toBeInTheDocument();
  });

  it("breaks explained loss down by reason, biggest first", async () => {
    server.use(
      http.get("/api/operator/shrink-summary", () =>
        HttpResponse.json({
          ...fleet(),
          totals: { ...fleet().totals, explainedByReason: { damaged: 2, expired: 3 } },
        }),
      ),
    );
    const { container } = render(<LossReport />, { wrapper: makeWrapper() });

    expect(await within(container).findByText("3 expired, 2 damaged")).toBeInTheDocument();
  });

  it("falls back to a plain unit count when no reason was logged for the explained loss", async () => {
    server.use(
      http.get("/api/operator/shrink-summary", () =>
        HttpResponse.json({
          ...fleet(),
          totals: { ...fleet().totals, explainedByReason: {}, explainedUnits: 4 },
        }),
      ),
    );
    const { container } = render(<LossReport />, { wrapper: makeWrapper() });

    expect(await within(container).findByText("4 units")).toBeInTheDocument();
  });

  it("is honest about how much of the fleet was actually counted", async () => {
    const { container } = render(<LossReport />, { wrapper: makeWrapper() });

    // 9 counted, 3 skipped
    expect(
      await within(container).findByText("75% of slots were counted (3 skipped)"),
    ).toBeInTheDocument();
  });

  it("links each store to its restock history", async () => {
    const { container } = render(<LossReport />, { wrapper: makeWrapper() });

    expect(await within(container).findByRole("link", { name: "Busy Gym" })).toHaveAttribute(
      "href",
      "/operator/stores/s2?tab=restock-history",
    );
  });

  it("only paints a store's shrink as a problem when there is some", async () => {
    server.use(
      http.get("/api/operator/shrink-summary", () =>
        HttpResponse.json({
          ...fleet(),
          stores: [
            { storeId: "s1", storeName: "Spotless", ...EMPTY, countedLines: 4 },
            ...fleet().stores,
          ],
        }),
      ),
    );
    const { container } = render(<LossReport />, { wrapper: makeWrapper() });
    const view = within(container);
    await view.findByText("Spotless");

    const cell = (name: string) =>
      within(view.getByRole("link", { name }).closest("tr") as HTMLElement).getAllByText(/\$/)[0];
    expect(cell("Busy Gym")).toHaveClass("text-error-700");
    expect(cell("Spotless")).not.toHaveClass("text-error-700");
  });

  it("says the report failed to load, with a retry, rather than reporting no shrink", async () => {
    let requests = 0;
    server.use(
      http.get("/api/operator/shrink-summary", () => {
        requests += 1;
        return requests === 1
          ? HttpResponse.json({ error: "down" }, { status: 500 })
          : HttpResponse.json(fleet());
      }),
    );
    const user = userEvent.setup();
    const { container } = render(<LossReport />, { wrapper: makeWrapper() });
    const view = within(container);

    expect(await view.findByText(/could not load the loss report/i)).toBeInTheDocument();
    await user.click(view.getByRole("button", { name: /try again/i }));

    expect(await view.findByText("$20.00")).toBeInTheDocument();
  });

  it("offers a way to start a count when none exist", async () => {
    server.use(
      http.get("/api/operator/shrink-summary", () => HttpResponse.json({ stores: [], totals: EMPTY })),
    );
    const { container } = render(<LossReport />, { wrapper: makeWrapper() });

    expect(
      await within(container).findByRole("link", { name: "Pick a store to count" }),
    ).toHaveAttribute("href", "/operator");
  });
});
