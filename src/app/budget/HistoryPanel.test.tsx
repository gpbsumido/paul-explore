import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import HistoryPanel from "./HistoryPanel";
import { STARTER_BUDGET } from "@/lib/budget/categories.data";
import type { Budget, Expense } from "@/lib/budget/types";

const NOW = new Date("2026-09-14T12:00:00.000Z");

const expense = (iso: string, cents: number, id = iso): Expense => ({
  id,
  categoryId: "food",
  amountCents: cents,
  occurredAt: iso,
  personId: "p-you",
  tags: [],
});

const budget = (expenses: Expense[]): Budget => ({ ...STARTER_BUDGET, expenses });

describe("HistoryPanel", () => {
  it("compares the current month against the previous one", () => {
    render(
      <HistoryPanel
        budget={budget([
          expense("2026-09-10T00:00:00Z", 1500, "cur"),
          expense("2026-08-10T00:00:00Z", 1000, "prev"),
        ])}
        now={NOW}
      />,
    );
    const compare = screen.getByTestId("period-comparison");
    expect(compare).toHaveTextContent("This month: $15.00 (+$5.00, +50%) vs last month $10.00");
  });

  it("shows a fall against the previous month with a minus sign", () => {
    render(
      <HistoryPanel
        budget={budget([
          expense("2026-09-10T00:00:00Z", 1000, "cur"),
          expense("2026-08-10T00:00:00Z", 2000, "prev"),
        ])}
        now={NOW}
      />,
    );
    expect(screen.getByTestId("period-comparison")).toHaveTextContent(
      "This month: $10.00 (−$10.00, −50%) vs last month $20.00",
    );
  });

  it("shows no sign when spending is the same as the month before", () => {
    render(
      <HistoryPanel
        budget={budget([
          expense("2026-09-10T00:00:00Z", 1000, "cur"),
          expense("2026-08-10T00:00:00Z", 1000, "prev"),
        ])}
        now={NOW}
      />,
    );
    expect(screen.getByTestId("period-comparison")).toHaveTextContent(
      "This month: $10.00 ($0.00, 0%) vs last month $10.00",
    );
  });

  it("shows a dash instead of a percentage when there is nothing to compare to", () => {
    render(
      <HistoryPanel
        budget={budget([expense("2026-09-10T00:00:00Z", 1000, "cur")])}
        now={NOW}
      />,
    );
    expect(screen.getByTestId("period-comparison")).toHaveTextContent(
      "This month: $10.00 (+$10.00, —) vs last month $0.00",
    );
  });

  it("names the period after the chosen granularity", () => {
    render(<HistoryPanel budget={budget([])} now={NOW} />);
    expect(screen.getByTestId("period-comparison")).toHaveTextContent(/^This month:.*vs last month/);

    fireEvent.click(screen.getByRole("button", { name: /week/i }));
    expect(screen.getByTestId("period-comparison")).toHaveTextContent(/^This week:.*vs last week/);
  });

  it("compares this week with last week when grouped by week", () => {
    render(
      <HistoryPanel
        budget={budget([
          expense("2026-09-14T08:00:00Z", 400, "cur"),
          expense("2026-09-09T08:00:00Z", 200, "prev"),
        ])}
        now={NOW}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /week/i }));
    expect(screen.getByTestId("period-comparison")).toHaveTextContent(
      "This week: $4.00 (+$2.00, +100%) vs last week $2.00",
    );
  });

  it.each([
    ["week", 8],
    ["month", 6],
    ["year", 3],
  ])("lists %s periods back over %i bars", (name, count) => {
    render(<HistoryPanel budget={budget([])} now={NOW} />);
    fireEvent.click(screen.getByRole("button", { name: new RegExp(name, "i") }));
    const list = screen.getByRole("list", { name: /history/i });
    expect(within(list).getAllByRole("listitem")).toHaveLength(count);
  });

  it("sizes each bar against the biggest period", () => {
    render(
      <HistoryPanel
        budget={budget([
          expense("2026-09-10T00:00:00Z", 2000, "cur"),
          expense("2026-08-10T00:00:00Z", 1000, "prev"),
        ])}
        now={NOW}
      />,
    );
    const rows = within(screen.getByRole("list", { name: /history/i })).getAllByRole("listitem");
    const widthOf = (row: HTMLElement) =>
      (row.querySelector("span.block") as HTMLElement).style.width;
    const widths = rows.map(widthOf);
    expect(widths).toContain("100%");
    expect(widths).toContain("50%");
  });

  it("lists a bar per period and re-buckets when the granularity changes", () => {
    render(
      <HistoryPanel
        budget={budget([
          expense("2026-09-10T00:00:00Z", 1500, "a"),
          expense("2025-05-10T00:00:00Z", 800, "b"),
        ])}
        now={NOW}
      />,
    );
    // Month view does not reach back to last year.
    expect(screen.queryByText("2025")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /year/i }));
    const list = screen.getByRole("list", { name: /history/i });
    expect(within(list).getByText("2025")).toBeInTheDocument();
    expect(within(list).getByText("2026")).toBeInTheDocument();
  });
});
