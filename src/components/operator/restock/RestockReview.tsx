"use client";

import { useState } from "react";

import {
  countStatusOf,
  isLineDirty,
  resultingStock,
  summarizeDraft,
  type RestockDraft,
} from "@/lib/operator-restock";
import type { InventoryItem } from "@/types/operator";

interface RestockReviewProps {
  drafts: readonly RestockDraft[];
  itemsById: ReadonlyMap<string, InventoryItem>;
  isCompleting: boolean;
  error: string | null;
  onComplete: (notes: string | null) => void;
  onBack: () => void;
}

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  correction: {
    label: "Correction",
    className: "bg-warning-500/15 text-warning-700 dark:text-warning-400",
  },
  "not-counted": {
    label: "Not counted",
    className: "bg-surface-raised text-muted",
  },
  "matches-expected": {
    label: "Matches expected",
    className: "bg-success-500/15 text-success-600 dark:text-success-400",
  },
};

/**
 * The last step: everything that changed, in one screen, before it is applied.
 *
 * Corrections and skipped counts are called out per line rather than buried,
 * because "the shelf disagreed with the system" is the finding an operator most
 * needs to see, and "nobody counted this" is the caveat on the rest.
 */
export default function RestockReview({
  drafts,
  itemsById,
  isCompleting,
  error,
  onComplete,
  onBack,
}: RestockReviewProps) {
  const [notes, setNotes] = useState("");
  const touched = drafts.filter(isLineDirty);
  const summary = summarizeDraft(drafts);

  return (
    <div className="space-y-4">
      <header>
        <h3 className="text-base font-semibold text-foreground">
          Review {touched.length} change{touched.length === 1 ? "" : "s"}
        </h3>
        <p className="text-xs text-muted">
          Nothing has been applied yet. Stock changes when you complete.
        </p>
      </header>

      {touched.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted">
          No slots were counted or changed.
        </p>
      ) : (
        <table className="w-full text-sm">
          <caption className="sr-only">
            Every slot changed in this restock, with its resulting stock
          </caption>
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-muted">
              <th scope="col" className="pb-1.5 font-medium">
                Product
              </th>
              <th scope="col" className="pb-1.5 font-medium">
                Change
              </th>
              <th scope="col" className="pb-1.5 text-right font-medium">
                Result
              </th>
            </tr>
          </thead>
          <tbody>
            {touched.map((draft) => {
              const item = itemsById.get(draft.itemId);
              if (!item) return null;
              const badge = STATUS_BADGES[countStatusOf(draft)];

              return (
                <tr key={draft.itemId} className="border-t border-border">
                  <td className="py-2 pr-2">
                    <span className="block text-foreground">
                      {item.productName}
                    </span>
                    <span
                      className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[11px] ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </td>
                  <td className="py-2 pr-2 tabular-nums text-muted">
                    {draft.added > 0 && <span>+{draft.added} </span>}
                    {draft.removed > 0 && (
                      <span>
                        &minus;{draft.removed}
                        {draft.removalReason ? ` (${draft.removalReason})` : ""}
                      </span>
                    )}
                    {draft.added === 0 && draft.removed === 0 && (
                      <span>count only</span>
                    )}
                  </td>
                  <td className="py-2 text-right tabular-nums font-medium text-foreground">
                    {resultingStock(draft, item.capacity)}/{item.capacity}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {summary.removed > 0 && (
        <p className="rounded-lg bg-surface-raised px-3 py-2 text-xs text-muted">
          {summary.removed} unit{summary.removed === 1 ? "" : "s"} came off the
          shelves:{" "}
          {Object.entries(summary.removedByReason)
            .map(([reason, count]) => `${count} ${reason}`)
            .join(", ")}
          .
        </p>
      )}

      <div className="space-y-1.5">
        <label
          htmlFor="restock-notes"
          className="block text-sm font-medium text-foreground"
        >
          Notes (optional)
        </label>
        <textarea
          id="restock-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Anything worth telling the next person"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-error-500">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          disabled={isCompleting || touched.length === 0}
          onClick={() => onComplete(notes.trim() === "" ? null : notes.trim())}
          className="min-h-11 flex-1 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {isCompleting ? "Completing…" : "Complete restock"}
        </button>
        <button
          type="button"
          onClick={onBack}
          className="min-h-11 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground"
        >
          Back
        </button>
      </div>
    </div>
  );
}
