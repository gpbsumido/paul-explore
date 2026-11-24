import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

describe("FinanceReport totals and exports", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("shows gross revenue and the combined fees as their own figures", async () => {
    const { container } = render(<FinanceReport />, { wrapper: makeWrapper() });
    const view = within(container);

    const gross = (await view.findByText("Gross revenue")).parentElement as HTMLElement;
    expect(within(gross).getByText("$1,800.00")).toBeInTheDocument();
    // 108 transaction fees + 28 platform fees
    const fees = view.getByText("transaction + platform").parentElement as HTMLElement;
    expect(within(fees).getByText("$136.00")).toBeInTheDocument();
  });

  it("styles a loss as a loss rather than good news", async () => {
    server.use(
      http.get("/api/operator/finance", () =>
        HttpResponse.json({
          ...financePayload(),
          totals: { ...financePayload().totals, netPayout: -120 },
        }),
      ),
    );
    const { container } = render(<FinanceReport />, { wrapper: makeWrapper() });
    const view = within(container);

    const headline = (await view.findByText(/net payout \(8 weeks\)/i)).parentElement as HTMLElement;

    expect(within(headline).getByText("-$120.00")).toHaveClass("text-error-700");
    expect(headline).not.toHaveClass("bg-success-50");
  });

  it("says the finance data failed to load, with a retry, instead of showing an empty report", async () => {
    let requests = 0;
    server.use(
      http.get("/api/operator/finance", () => {
        requests += 1;
        return requests === 1
          ? HttpResponse.json({ error: "down" }, { status: 500 })
          : HttpResponse.json(financePayload());
      }),
    );
    const user = userEvent.setup();
    const { container } = render(<FinanceReport />, { wrapper: makeWrapper() });
    const view = within(container);

    expect(await view.findByText(/could not load finance/i)).toBeInTheDocument();
    await user.click(view.getByRole("button", { name: /try again/i }));

    expect(await view.findByText("$1,664.00")).toBeInTheDocument();
  });

  it("downloads the weekly payouts as a CSV with every column", async () => {
    const user = userEvent.setup();
    const { container } = render(<FinanceReport />, { wrapper: makeWrapper() });
    const download = await within(container).findByRole("button", { name: "Download CSV" });

    // Stubbed only now: swapping URL out earlier would break the fetch above.
    const blobs: Blob[] = [];
    const downloads: string[] = [];
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: (blob: Blob) => {
        blobs.push(blob);
        return "blob:finance";
      },
      revokeObjectURL: vi.fn(),
    });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      downloads.push(this.download);
    });
    await user.click(download);

    expect(downloads).toEqual(["fleet-finance-weekly.csv"]);
    const lines = (await blobs[0].text()).split("\r\n");
    expect(lines[0]).toBe("Week of,Gross revenue,Transactions,Transaction fees,Platform fees,Net payout");
    expect(lines).toHaveLength(3);
    // The week label is local-date text, so only the numbers are pinned.
    expect(lines[1]).toMatch(/,1000,200,60,14,926$/);
    expect(lines[2]).toMatch(/,800,160,48,14,738$/);
  });
});
