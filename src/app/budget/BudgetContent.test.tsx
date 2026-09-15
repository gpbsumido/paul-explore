import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { axe } from "@/test/a11y";
import BudgetContent from "./BudgetContent";
import { resetBudgetStore } from "./useBudget";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));

/** Every test starts from a clean browser store and a cleared snapshot cache. */
const fresh = () => {
  window.localStorage.clear();
  resetBudgetStore();
  return render(<BudgetContent />);
};

/** Walk the three-step add flow: open, pick a category, enter an amount, save. */
const addExpense = (category: RegExp, amount: string) => {
  fireEvent.click(screen.getByRole("button", { name: /add expense/i }));
  fireEvent.click(screen.getByRole("button", { name: category }));
  fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: amount } });
  fireEvent.click(screen.getByRole("button", { name: /^next/i }));
  fireEvent.click(screen.getByRole("button", { name: /save expense/i }));
};

describe("BudgetContent", () => {
  it("shows an empty state before anything is logged", () => {
    fresh();
    expect(screen.getByText(/nothing logged yet/i)).toBeInTheDocument();
  });

  it("logs an expense through the flow and shows it in the list", () => {
    fresh();
    addExpense(/food/i, "12.34");

    const list = screen.getByRole("list", { name: /this cycle/i });
    expect(within(list).getByText("$12.34")).toBeInTheDocument();
    expect(within(list).getByText(/food/i)).toBeInTheDocument();
  });

  it("adds the amount to the last-30-day total", () => {
    fresh();
    addExpense(/food/i, "40");
    const total = screen.getByTestId("total-30");
    expect(total).toHaveTextContent("$40.00");
  });

  it("persists a logged expense across a remount", () => {
    fresh();
    addExpense(/groceries/i, "9.99");
    render(<BudgetContent />);
    expect(screen.getAllByText("$9.99").length).toBeGreaterThan(0);
  });

  it("adds a person and attributes a new expense to them", () => {
    fresh();
    fireEvent.click(screen.getByRole("button", { name: /add person/i }));
    fireEvent.change(screen.getByLabelText(/new person name/i), {
      target: { value: "Sam" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save person/i }));

    fireEvent.click(screen.getByRole("radio", { name: "Sam" }));
    addExpense(/rent/i, "100");

    const people = screen.getByRole("list", { name: /by person/i });
    expect(within(people).getByText("Sam")).toBeInTheDocument();
    expect(within(people).getByText("$100.00")).toBeInTheDocument();
  });

  it("offers a shareable invite link", () => {
    fresh();
    fireEvent.click(screen.getByRole("button", { name: /invite to share/i }));
    const link = screen.getByLabelText(/invite link/i) as HTMLInputElement;
    expect(link.value).toContain("/budget?join=");
  });

  it("has no axe violations", async () => {
    const { container } = fresh();
    expect(await axe(container)).toHaveNoViolations();
  });
});
