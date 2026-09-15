"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Sheet from "@/components/ui/Sheet";
import { CATEGORIES, PRESET_TAGS } from "@/lib/budget/categories.data";
import { formatCents, parseAmountToCents } from "@/lib/budget/format";
import { evenSplit, splitsTotal } from "@/lib/budget/splitting";
import type { ExpensePatch } from "@/lib/budget/budgetStore";
import type { Expense, Person, Split } from "@/lib/budget/types";

const toLocalInput = (iso: string): string => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
};

const dollars = (cents: number) => (cents / 100).toFixed(2);
const splitCents = (v: string) => {
  const n = Math.round(Number(v) * 100);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

/**
 * Edit a logged item after the fact: its category, amount, when, tags, and who
 * it is attributed to — including splitting it across several people. Reuses the
 * add flow's sheet and design-system fields; the split editor is the one new
 * piece. Save hands back a patch; Delete removes the item.
 */
export default function EditExpenseSheet({
  open,
  expense,
  people,
  onSave,
  onDelete,
  onClose,
}: {
  open: boolean;
  expense: Expense;
  people: Person[];
  onSave: (patch: ExpensePatch) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [categoryId, setCategoryId] = useState(expense.categoryId);
  const [amount, setAmount] = useState(dollars(expense.amountCents));
  const [whenLocal, setWhenLocal] = useState(toLocalInput(expense.occurredAt));
  const [tags, setTags] = useState<string[]>(expense.tags);
  const [note, setNote] = useState(expense.note ?? "");
  const [vendor, setVendor] = useState(expense.vendor ?? "");
  const ownerId = expense.personId;
  const [included, setIncluded] = useState<string[]>(
    expense.splits?.length ? expense.splits.map((s) => s.personId) : [expense.personId],
  );
  const [splitAmounts, setSplitAmounts] = useState<Record<string, string>>(
    Object.fromEntries((expense.splits ?? []).map((s) => [s.personId, dollars(s.amountCents)])),
  );

  const cents = parseAmountToCents(amount);
  const isSplit = included.length > 1;
  const splits: Split[] = included.map((personId) => ({
    personId,
    amountCents: splitCents(splitAmounts[personId] ?? "0"),
  }));
  const remaining = (cents ?? 0) - splitsTotal(splits);
  const canSave = cents !== null && (!isSplit || remaining === 0);

  const toggleTag = (tag: string) =>
    setTags((c) => (c.includes(tag) ? c.filter((t) => t !== tag) : [...c, tag]));

  const toggleIncluded = (id: string) =>
    setIncluded((c) => (c.includes(id) ? c.filter((p) => p !== id) : [...c, id]));

  const splitEvenly = () => {
    if (cents === null) return;
    const even = evenSplit(cents, included);
    setSplitAmounts(Object.fromEntries(even.map((s) => [s.personId, dollars(s.amountCents)])));
  };

  const save = () => {
    if (cents === null) return;
    onSave({
      categoryId,
      amountCents: cents,
      occurredAt: new Date(whenLocal).toISOString(),
      tags,
      note: note.trim() || undefined,
      vendor: vendor.trim() || undefined,
      personId: isSplit ? ownerId : included[0] ?? ownerId,
      splits: isSplit ? splits : undefined,
    });
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} label="Edit expense">
      <h2 className="mb-3 text-base font-semibold text-foreground">Edit expense</h2>

      <div className="space-y-3">
        <Select
          label="Category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </Select>

        <Input
          label="Amount"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <Input
          label="Date and time"
          type="datetime-local"
          value={whenLocal}
          onChange={(e) => setWhenLocal(e.target.value)}
        />

        <Input
          label="Note"
          placeholder="What for?"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <Input
          label="Vendor"
          placeholder="Where?"
          value={vendor}
          onChange={(e) => setVendor(e.target.value)}
        />
      </div>

      <fieldset className="mt-4">
        <legend className="mb-1 text-sm text-muted">Tags</legend>
        <div className="flex flex-wrap gap-2">
          {PRESET_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              aria-pressed={tags.includes(tag)}
              onClick={() => toggleTag(tag)}
              className={`rounded-full border px-3 py-1 text-sm transition ${
                tags.includes(tag)
                  ? "border-transparent bg-[var(--color-feature-budget)] text-background"
                  : "border-border text-foreground hover:bg-surface"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-4">
        <legend className="mb-1 text-sm text-muted">Split</legend>
        <div className="space-y-2">
          {people.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-2">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={included.includes(p.id)}
                  onChange={() => toggleIncluded(p.id)}
                />
                Include {p.name}
              </label>
              {isSplit && included.includes(p.id) && (
                <Input
                  label={`${p.name} amount`}
                  hideLabel
                  inputMode="decimal"
                  className="w-24"
                  value={splitAmounts[p.id] ?? ""}
                  onChange={(e) =>
                    setSplitAmounts((c) => ({ ...c, [p.id]: e.target.value }))
                  }
                />
              )}
            </div>
          ))}
        </div>
        {isSplit && (
          <div className="mt-2 flex items-center gap-3">
            <Button size="xs" variant="outline" onClick={splitEvenly}>
              Split evenly
            </Button>
            {remaining !== 0 && (
              <span className="text-xs text-error-600 dark:text-error-400">
                {formatCents(Math.abs(remaining))} {remaining > 0 ? "unallocated" : "over"}
              </span>
            )}
          </div>
        )}
      </fieldset>

      <div className="mt-5 flex items-center justify-between">
        <Button onClick={save} disabled={!canSave}>
          Save changes
        </Button>
        <Button variant="danger" onClick={onDelete}>
          Delete
        </Button>
      </div>
    </Sheet>
  );
}
