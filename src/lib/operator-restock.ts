// ---------------------------------------------------------------------------
// Restock drafts: the client half of an auditable restock session
//
// A restock used to be one button that set every slot to capacity. That could
// not express the two things that actually cost an operator money -- stock that
// walked out as expiry or damage, and a shelf that disagreed with the system.
//
// The arithmetic here is deliberately a mirror of the API's restock.ts rather
// than a shared package. Two tested copies of thirty lines beat coupling a Next
// app's deploy to an Express service's, and a test pins that they agree.
// ---------------------------------------------------------------------------

import type { InventoryItem } from "@/types/operator";

export const REMOVAL_REASONS = ["expired", "damaged", "other"] as const;
export type RemovalReason = (typeof REMOVAL_REASONS)[number];

export const REMOVAL_REASON_LABELS: Record<RemovalReason, string> = {
  expired: "Expired",
  damaged: "Damaged",
  other: "Other",
};

export type CountStatus = "matches-expected" | "correction" | "not-counted";

/** One slot's in-progress edits. */
export type RestockDraft = {
  itemId: string;
  expectedQty: number;
  /** Null means the restocker deliberately skipped counting this slot. */
  countedQty: number | null;
  added: number;
  removed: number;
  removalReason: string | null;
};

export type DraftSummary = {
  itemsTouched: number;
  added: number;
  removed: number;
  corrections: number;
  notCounted: number;
  removedByReason: Record<string, number>;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** A fresh draft seeded from what the system currently believes is on the shelf. */
export function draftFor(item: InventoryItem): RestockDraft {
  return {
    itemId: item.id,
    expectedQty: item.currentStock,
    countedQty: null,
    added: 0,
    removed: 0,
    removalReason: null,
  };
}

/**
 * What the slot holds once this draft is applied.
 *
 * Null check rather than a falsy check: a counted zero is an empty shelf that
 * someone verified, which is not the same as no answer.
 */
export function resultingStock(
  draft: Pick<RestockDraft, "expectedQty" | "countedQty" | "added" | "removed">,
  capacity: number,
): number {
  const base = draft.countedQty ?? draft.expectedQty;
  return clamp(base + draft.added - draft.removed, 0, Math.max(capacity, 0));
}

/** How this slot's count relates to what the system expected. */
export function countStatusOf(
  draft: Pick<RestockDraft, "expectedQty" | "countedQty">,
): CountStatus {
  if (draft.countedQty === null) {
    return "not-counted";
  }
  return draft.countedQty === draft.expectedQty
    ? "matches-expected"
    : "correction";
}

/**
 * Whether this slot is worth sending to the server.
 *
 * A confirmed count that matched counts as dirty: "someone looked and it was
 * right" is information the audit trail wants, and it is what separates a
 * spot-checked shelf from an unchecked one.
 */
export function isLineDirty(draft: RestockDraft): boolean {
  return (
    draft.countedQty !== null || draft.added > 0 || draft.removed > 0
  );
}

/**
 * The activity-feed line for a completed session.
 *
 * Names the removal reasons deliberately. "Restocked 6 items" tells an operator
 * nothing; "-5 (3 expired, 2 damaged)" is the sentence they need when they are
 * working out where the margin went.
 */
export function describeDraft(summary: DraftSummary): string {
  if (summary.itemsTouched === 0) return "Restock completed with no changes";

  const parts: string[] = [
    `Restocked ${summary.itemsTouched} item${summary.itemsTouched === 1 ? "" : "s"}`,
  ];

  if (summary.added > 0) parts.push(`+${summary.added}`);

  if (summary.removed > 0) {
    const reasons = Object.entries(summary.removedByReason)
      .map(([reason, count]) => `${count} ${reason}`)
      .join(", ");
    parts.push(
      reasons ? `-${summary.removed} (${reasons})` : `-${summary.removed}`,
    );
  }

  if (summary.corrections > 0) {
    parts.push(
      `${summary.corrections} correction${summary.corrections === 1 ? "" : "s"}`,
    );
  }

  if (summary.notCounted > 0) parts.push(`${summary.notCounted} not counted`);

  return parts.join(", ");
}

/** Rolls the touched drafts up into the numbers the review step shows. */
export function summarizeDraft(
  drafts: readonly RestockDraft[],
): DraftSummary {
  const touched = drafts.filter(isLineDirty);
  const removedByReason: Record<string, number> = {};

  let added = 0;
  let removed = 0;
  let corrections = 0;
  let notCounted = 0;

  for (const draft of touched) {
    added += draft.added;
    removed += draft.removed;

    const status = countStatusOf(draft);
    if (status === "correction") corrections += 1;
    if (status === "not-counted") notCounted += 1;

    if (draft.removed > 0 && draft.removalReason) {
      removedByReason[draft.removalReason] =
        (removedByReason[draft.removalReason] ?? 0) + draft.removed;
    }
  }

  return {
    itemsTouched: touched.length,
    added,
    removed,
    corrections,
    notCounted,
    removedByReason,
  };
}
