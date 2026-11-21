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

  it("adds a tag to the ones the item already has", () => {
    const { onSave } = setup();
    fireEvent.click(screen.getByRole("button", { name: /unnecessary/i }));
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    const patch = onSave.mock.calls[0][0];
    expect(patch.tags).toEqual(["necessary", "unnecessary"]);
  });

  it("removes a tag when it is tapped again", () => {
    const { onSave } = setup();
    fireEvent.click(screen.getByRole("button", { name: /^necessary$/i }));
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    expect(onSave.mock.calls[0][0].tags).toEqual([]);
  });

  it("keeps the item with its owner and unsplit when nobody else is included", () => {
    const { onSave } = setup();
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    const patch = onSave.mock.calls[0][0];
    expect(patch.personId).toBe("p-you");
    expect(patch.splits).toBeUndefined();
  });

  it("hands the item to someone else when only they are included", () => {
    const { onSave } = setup();
    fireEvent.click(screen.getByRole("checkbox", { name: /include sam/i }));
    fireEvent.click(screen.getByRole("checkbox", { name: /include you/i }));
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    const patch = onSave.mock.calls[0][0];
    expect(patch.personId).toBe("p-sam");
    expect(patch.splits).toBeUndefined();
  });

  it("saves the category, note and vendor that were changed", () => {
    const { onSave } = setup();
    fireEvent.change(screen.getByLabelText(/category/i), { target: { value: "groceries" } });
    fireEvent.change(screen.getByLabelText(/note/i), { target: { value: "  weekly shop " } });
    fireEvent.change(screen.getByLabelText(/vendor/i), { target: { value: "Costco" } });
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ categoryId: "groceries", note: "weekly shop", vendor: "Costco" }),
    );
  });

  it("leaves the note and vendor out when they are blank", () => {
    const { onSave } = setup({ expense: { ...expense, note: "old", vendor: "Old Co" } });
    fireEvent.change(screen.getByLabelText(/note/i), { target: { value: "   " } });
    fireEvent.change(screen.getByLabelText(/vendor/i), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    const patch = onSave.mock.calls[0][0];
    expect(patch.note).toBeUndefined();
    expect(patch.vendor).toBeUndefined();
  });

  it("keeps the moment the item happened unless the date is changed", () => {
    const { onSave } = setup();
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    expect(onSave.mock.calls[0][0].occurredAt).toBe(expense.occurredAt);

    fireEvent.change(screen.getByLabelText(/date and time/i), {
      target: { value: "2026-10-01T09:30" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    expect(onSave.mock.calls[1][0].occurredAt).toBe(new Date("2026-10-01T09:30").toISOString());
  });

  it("closes the sheet after saving", () => {
    const onClose = vi.fn();
    setup({ onClose });
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("will not save an amount that is not a number", () => {
    const { onSave } = setup();
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: "abc" } });
    expect(screen.getByRole("button", { name: /save changes/i })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    expect(onSave).not.toHaveBeenCalled();
  });

  it("will not save a split that does not add up, and says how far off it is", () => {
    const { onSave } = setup();
    fireEvent.click(screen.getByRole("checkbox", { name: /include sam/i }));
    fireEvent.change(screen.getByLabelText(/you amount/i), { target: { value: "4.00" } });
    fireEvent.change(screen.getByLabelText(/sam amount/i), { target: { value: "5.00" } });

    expect(screen.getByText("$1.00 unallocated")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save changes/i })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    expect(onSave).not.toHaveBeenCalled();
  });

  it("says when a split is over the total, and saves once it adds up", () => {
    const { onSave } = setup();
    fireEvent.click(screen.getByRole("checkbox", { name: /include sam/i }));
    fireEvent.change(screen.getByLabelText(/you amount/i), { target: { value: "7.00" } });
    fireEvent.change(screen.getByLabelText(/sam amount/i), { target: { value: "5.00" } });
    expect(screen.getByText("$2.00 over")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/you amount/i), { target: { value: "5.00" } });
    expect(screen.queryByText(/over|unallocated/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    expect(onSave.mock.calls[0][0].splits).toEqual([
      { personId: "p-you", amountCents: 500 },
      { personId: "p-sam", amountCents: 500 },
    ]);
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
