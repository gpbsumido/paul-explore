import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import EditExpenseSheet from "./EditExpenseSheet";
import type { Expense, Person } from "@/lib/budget/types";

const expense: Expense = {
  id: "e-1",
  categoryId: "food",
  amountCents: 1000,
  occurredAt: "2026-09-14T12:00:00.000Z",
  personId: "p-you",
  tags: ["necessary"],
};

const people: Person[] = [
  { id: "p-you", name: "You" },
  { id: "p-sam", name: "Sam" },
];

const setup = (over: Partial<Parameters<typeof EditExpenseSheet>[0]> = {}) => {
  const onSave = vi.fn();
  const onDelete = vi.fn();
  render(
    <EditExpenseSheet
      open
      expense={expense}
      people={people}
      onSave={onSave}
      onDelete={onDelete}
      onClose={() => {}}
      {...over}
    />,
  );
  return { onSave, onDelete };
};

describe("EditExpenseSheet", () => {
  it("prefills the amount from the item", () => {
    setup();
    expect(screen.getByLabelText(/amount/i)).toHaveValue("10.00");
  });

  it("saves an edited amount", () => {
    const { onSave } = setup();
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: "25.50" } });
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ amountCents: 2550 }));
  });

  it("re-tags the item", () => {
    const { onSave } = setup();
    fireEvent.click(screen.getByRole("button", { name: /unnecessary/i }));
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    const patch = onSave.mock.calls[0][0];
    expect(patch.tags).toContain("unnecessary");
    expect(patch.tags).toContain("necessary");
  });

  it("deletes the item", () => {
    const { onDelete } = setup();
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    expect(onDelete).toHaveBeenCalled();
  });

  it("splits evenly across two people", () => {
    const { onSave } = setup();
    fireEvent.click(screen.getByRole("checkbox", { name: /include sam/i }));
    fireEvent.click(screen.getByRole("button", { name: /split evenly/i }));
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    const patch = onSave.mock.calls[0][0];
    expect(patch.splits).toEqual([
      { personId: "p-you", amountCents: 500 },
      { personId: "p-sam", amountCents: 500 },
    ]);
  });
});
