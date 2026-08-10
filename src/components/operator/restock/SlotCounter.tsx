"use client";

import { useId, useState } from "react";

import {
  REMOVAL_REASONS,
  REMOVAL_REASON_LABELS,
  countStatusOf,
  resultingStock,
  type RemovalReason,
  type RestockDraft,
} from "@/lib/operator-restock";
import type { InventoryItem } from "@/types/operator";

interface SlotCounterProps {
  item: InventoryItem;
  draft: RestockDraft;
  onSave: (draft: RestockDraft) => void;
  onCancel: () => void;
}

const COUNT_STATUS_LABELS: Record<string, string> = {
  "matches-expected": "Matches expected",
  correction: "Correction",
  "not-counted": "Not counted",
};

/**
 * One slot, counted.
 *
 * Stepper buttons rather than a number input on purpose: the person using this
 * is standing at a fridge with a phone in one hand, often in a cold room, and a
 * 44px button beats a keyboard every time. The running result is announced so
 * they can confirm without looking away from the shelf.
 */
export default function SlotCounter({
  item,
  draft,
  onSave,
  onCancel,
}: SlotCounterProps) {
  const [local, setLocal] = useState<RestockDraft>(draft);
  const [showReasonError, setShowReasonError] = useState(false);
  const reasonErrorId = useId();
  const reasonLegendId = useId();

  const needsReason = local.removed > 0 && local.removalReason === null;
  const result = resultingStock(local, item.capacity);
  const status = countStatusOf(local);

  const setCount = (next: number | null) => {
    setLocal((prev) => ({ ...prev, countedQty: next }));
  };

  const bump = (field: "added" | "removed", delta: number) => {
    setLocal((prev) => ({
      ...prev,
      [field]: Math.max(0, prev[field] + delta),
    }));
    if (field === "removed") setShowReasonError(false);
  };

  const handleSave = () => {
    if (needsReason) {
      setShowReasonError(true);
      return;
    }
    onSave(local);
  };

  return (
    <div className="space-y-4">
      <header>
        <h3 className="text-base font-semibold text-foreground">
          {item.productName}
        </h3>
        <p className="text-xs text-muted">
          Capacity {item.capacity} &middot; system expects {local.expectedQty}
        </p>
      </header>

      {/* Counted */}
      <section aria-labelledby="counted-label" className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <span
            id="counted-label"
            className="text-sm font-medium text-foreground"
          >
            Counted on the shelf
          </span>
          {/*
            A toggle whose label stays put and whose pressed state carries the
            meaning. Relabelling it as it flips reads as two different buttons.
          */}
          <button
            type="button"
            onClick={() =>
              setCount(local.countedQty === null ? item.currentStock : null)
            }
            aria-pressed={local.countedQty === null}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
              local.countedQty === null
                ? "border-primary-500 bg-primary-600 text-white"
                : "border-border text-muted hover:text-foreground"
            }`}
          >
            Skip count
          </button>
        </div>
        <Stepper
          label="counted quantity"
          value={local.countedQty}
          placeholder="not counted"
          onDecrement={() =>
            setCount(Math.max(0, (local.countedQty ?? item.currentStock) - 1))
          }
          onIncrement={() =>
            setCount((local.countedQty ?? item.currentStock) + 1)
          }
        />
        <p className="text-xs text-muted">
          Skipping is fine. It is recorded as not counted, so a spot-check reads
          differently from a full count.
        </p>
      </section>

      <Stepper
        label="units added"
        heading="Added"
        value={local.added}
        onDecrement={() => bump("added", -1)}
        onIncrement={() => bump("added", 1)}
      />

      <Stepper
        label="units removed"
        heading="Removed"
        value={local.removed}
        onDecrement={() => bump("removed", -1)}
        onIncrement={() => bump("removed", 1)}
      />

      {/* Reason, required once anything is removed */}
      {local.removed > 0 && (
        <fieldset
          className="space-y-2"
          aria-required="true"
          aria-describedby={showReasonError ? reasonErrorId : undefined}
        >
          <legend
            id={reasonLegendId}
            className="text-sm font-medium text-foreground"
          >
            Why was it removed?
          </legend>
          <div
            role="radiogroup"
            aria-labelledby={reasonLegendId}
            className="flex gap-2"
          >
            {REMOVAL_REASONS.map((reason) => (
              <button
                key={reason}
                type="button"
                role="radio"
                aria-checked={local.removalReason === reason}
                onClick={() => {
                  setLocal((prev) => ({
                    ...prev,
                    removalReason: reason as RemovalReason,
                  }));
                  setShowReasonError(false);
                }}
                className={`min-h-11 flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  local.removalReason === reason
                    ? "border-primary-500 bg-primary-600 text-white"
                    : "border-border text-muted hover:text-foreground"
                }`}
              >
                {REMOVAL_REASON_LABELS[reason]}
              </button>
            ))}
          </div>
          {showReasonError && (
            <p id={reasonErrorId} className="text-xs text-error-500">
              Pick a reason before saving. An unexplained removal is
              indistinguishable from theft.
            </p>
          )}
        </fieldset>
      )}

      {/* Running result */}
      <div className="rounded-lg border border-border bg-surface px-3 py-2.5">
        <p aria-live="polite" className="text-sm text-foreground">
          Shelf will hold{" "}
          <span className="font-semibold tabular-nums">{result}</span> of{" "}
          {item.capacity}
        </p>
        <p className="mt-0.5 text-xs text-muted">
          {COUNT_STATUS_LABELS[status]}
        </p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          className="min-h-11 flex-1 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Save slot
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="min-h-11 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function Stepper({
  label,
  heading,
  value,
  placeholder,
  onDecrement,
  onIncrement,
}: {
  label: string;
  heading?: string;
  value: number | null;
  placeholder?: string;
  onDecrement: () => void;
  onIncrement: () => void;
}) {
  return (
    <div className="space-y-1.5">
      {heading && (
        <span className="text-sm font-medium text-foreground">{heading}</span>
      )}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onDecrement}
          aria-label={`Decrease ${label}`}
          className="min-h-11 min-w-11 rounded-lg border border-border text-lg font-semibold text-foreground"
        >
          &minus;
        </button>
        <span
          aria-live="polite"
          className="min-w-16 text-center text-lg font-semibold tabular-nums text-foreground"
        >
          {value === null ? (
            <span className="text-sm font-normal text-muted">
              {placeholder}
            </span>
          ) : (
            value
          )}
        </span>
        <button
          type="button"
          onClick={onIncrement}
          aria-label={`Increase ${label}`}
          className="min-h-11 min-w-11 rounded-lg border border-border text-lg font-semibold text-foreground"
        >
          +
        </button>
      </div>
    </div>
  );
}
