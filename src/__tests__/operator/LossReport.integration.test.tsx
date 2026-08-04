import { describe, it, expect, beforeEach } from "vitest";
import { render, within } from "@testing-library/react";
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

  it("ranks the worst store first", async () => {
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
});
