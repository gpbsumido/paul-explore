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
    expect(compare).toHaveTextContent("$5.00");
    expect(compare).toHaveTextContent("50%");
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
