import { describe, it, expect, beforeEach } from "vitest";
import { render, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { server } from "@/test/server";
import FinanceReport from "@/components/operator/FinanceReport";

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

function financePayload() {
  return {
    weeks: [
      {
        weekStart: "2026-07-28T12:00:00.000Z",
        grossRevenue: 1000,
        transactionCount: 200,
        transactionFees: 60,
        platformFees: 14,
        netPayout: 926,
      },
      {
        weekStart: "2026-07-21T12:00:00.000Z",
        grossRevenue: 800,
        transactionCount: 160,
        transactionFees: 48,
        platformFees: 14,
        netPayout: 738,
      },
    ],
    totals: {
      grossRevenue: 1800,
      transactionCount: 360,
      transactionFees: 108,
      platformFees: 28,
      netPayout: 1664,
    },
    fees: { transactionRate: 0.04, transactionFlat: 0.1, platformPerUnitMonthly: 60 },
  };
}

beforeEach(() => {
  server.use(
    http.get("/api/operator/finance", () =>
      HttpResponse.json(financePayload()),
    ),
  );
});

describe("FinanceReport", () => {
  it("leads with the net payout total", async () => {
    const { container } = render(<FinanceReport />, { wrapper: makeWrapper() });
    const view = within(container);
    expect(await view.findByText("$1,664.00")).toBeInTheDocument();
  });

  it("states the fee model transparently", async () => {
    const { container } = render(<FinanceReport />, { wrapper: makeWrapper() });
    const view = within(container);
    expect(
      await view.findByText(/4% \+ \$0\.10 per transaction/i),
    ).toBeInTheDocument();
  });

  it("lists the weekly payouts newest first, combining both fee lines", async () => {
    const { container } = render(<FinanceReport />, { wrapper: makeWrapper() });
    const view = within(container);
    await view.findByText("$926.00");
    const rows = view.getAllByRole("row");
    // First fee cell: transaction 60 + platform 14 = $74.00.
    expect(within(rows[1]).getByText("$74.00")).toBeInTheDocument();
    expect(within(rows[1]).getByText("$926.00")).toBeInTheDocument();
  });

  it("renders the payouts as an accessible table", async () => {
    const { container } = render(<FinanceReport />, { wrapper: makeWrapper() });
    const view = within(container);
    await view.findByText("$926.00");
    expect(
      view.getByRole("columnheader", { name: "Net payout" }),
    ).toBeInTheDocument();
  });
});
