"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useOperatorInventory } from "@/hooks/useOperatorInventory";
import {
  readStoredSessionId,
  useRestockSession,
} from "@/hooks/useRestockSession";
import { useToast } from "@/contexts/ToastContext";
import {
  countStatusOf,
  draftFor,
  isLineDirty,
  summarizeDraft,
  type RestockDraft,
} from "@/lib/operator-restock";
import Bone from "../Bone";
import SlotCounter from "./SlotCounter";
import RestockReview from "./RestockReview";

interface RestockFlowProps {
  storeId: string;
  onClose: () => void;
}

type Step = "idle" | "list" | "slot" | "review";

/**
 * The restock workflow: pick a slot, count it, add or remove with a reason,
 * repeat, review, complete.
 *
 * Drafts live here and are the source of truth while the restocker works.
 * Saving a slot pushes one line to the server; nothing touches inventory until
 * complete. That split is what makes a dropped connection cost one slot rather
 * than the whole walk.
 */
export default function RestockFlow({ storeId, onClose }: RestockFlowProps) {
  const { items, loading } = useOperatorInventory(storeId);
  const { addToast } = useToast();
  const {
    session,
    isOpening,
    isCompleting,
    error,
    open,
    resume,
    saveLine,
    complete,
    discard,
  } = useRestockSession(storeId);

  const [step, setStep] = useState<Step>("idle");
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<ReadonlyMap<string, RestockDraft>>(
    () => new Map(),
  );
  const [resumable, setResumable] = useState<string | null>(null);

  const itemsById = useMemo(
    () => new Map(items.map((item) => [item.id, item])),
    [items],
  );

  // A session parked in localStorage means someone walked away mid-restock.
  useEffect(() => {
    setResumable(readStoredSessionId(storeId));
  }, [storeId]);

  // Seed a draft per slot once inventory arrives, without clobbering edits.
  useEffect(() => {
    if (items.length === 0) return;
    setDrafts((prev) => {
      if (prev.size > 0) return prev;
      return new Map(items.map((item) => [item.id, draftFor(item)]));
    });
  }, [items]);

  const startFresh = useCallback(async () => {
    const opened = await open();
    if (opened) setStep("list");
  }, [open]);

  const resumeExisting = useCallback(async () => {
    if (!resumable) return;
    const resumed = await resume(resumable);
    if (resumed) {
      setStep("list");
    } else {
      setResumable(null);
      addToast({ message: "That restock is no longer open" });
    }
  }, [resumable, resume, addToast]);

  const handleSaveSlot = useCallback(
    async (draft: RestockDraft) => {
      setDrafts((prev) => new Map(prev).set(draft.itemId, draft));
      setStep("list");
      setActiveItemId(null);

      if (isLineDirty(draft)) {
        await saveLine(draft.itemId, {
          expectedQty: draft.expectedQty,
          countedQty: draft.countedQty,
          added: draft.added,
          removed: draft.removed,
          removalReason: draft.removalReason,
        });
      }
    },
    [saveLine],
  );

  const handleComplete = useCallback(
    async (notes: string | null) => {
      const ok = await complete(notes);
      if (!ok) return;

      const summary = summarizeDraft([...drafts.values()]);
      addToast({
        message: `Restock complete — ${summary.itemsTouched} slot${summary.itemsTouched === 1 ? "" : "s"} recorded`,
      });
      setDrafts(new Map());
      setStep("idle");
      onClose();
    },
    [complete, drafts, addToast, onClose],
  );

  const draftList = useMemo(() => [...drafts.values()], [drafts]);
  const touchedCount = draftList.filter(isLineDirty).length;

  if (loading && items.length === 0) {
    return (
      <div className="space-y-3">
        <Bone style={{ height: 32, width: "60%" }} />
        <Bone style={{ height: 96, width: "100%", borderRadius: 8 }} />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="space-y-3 py-8 text-center">
        <p className="text-sm text-muted">
          There is nothing on the planogram to restock.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="min-h-11 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground"
        >
          Back to inventory
        </button>
      </div>
    );
  }

  if (step === "idle") {
    return (
      <div className="space-y-3">
        {resumable && (
          <div className="rounded-lg border border-warning-400/40 bg-warning-500/10 p-3">
            <p className="text-sm text-foreground">
              You have a restock in progress on this store.
            </p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={resumeExisting}
                className="min-h-11 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Resume restock
              </button>
              <button
                type="button"
                onClick={() => {
                  discard();
                  setResumable(null);
                }}
                className="min-h-11 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted"
              >
                Discard
              </button>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={startFresh}
          disabled={isOpening}
          className="min-h-11 w-full rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {isOpening ? "Starting…" : "Start restock"}
        </button>
        {error && (
          <p role="alert" className="text-sm text-error-500">
            {error}
          </p>
        )}
      </div>
    );
  }

  if (step === "slot" && activeItemId) {
    const item = itemsById.get(activeItemId);
    const draft = drafts.get(activeItemId);
    if (item && draft) {
      return (
        <SlotCounter
          item={item}
          draft={draft}
          onSave={handleSaveSlot}
          onCancel={() => {
            setActiveItemId(null);
            setStep("list");
          }}
        />
      );
    }
  }

  if (step === "review") {
    return (
      <RestockReview
        drafts={draftList}
        itemsById={itemsById}
        isCompleting={isCompleting}
        error={error}
        onComplete={handleComplete}
        onBack={() => setStep("list")}
      />
    );
  }

  return (
    <div className="space-y-3">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            Restocking
          </h3>
          <p className="text-xs text-muted">
            {touchedCount} of {items.length} slots done
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="min-h-11 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted"
        >
          Pause
        </button>
      </header>

      <ul className="space-y-1.5">
        {items.map((item) => {
          const draft = drafts.get(item.id);
          const done = draft ? isLineDirty(draft) : false;

          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => {
                  setActiveItemId(item.id);
                  setStep("slot");
                }}
                className="flex min-h-11 w-full items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2 text-left"
              >
                <span className="flex-1 truncate text-sm text-foreground">
                  {item.productName}
                </span>
                <span className="shrink-0 text-xs tabular-nums text-muted">
                  expects {item.currentStock}
                </span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] ${
                    done
                      ? "bg-success-500/15 text-success-600 dark:text-success-400"
                      : "bg-surface-raised text-muted"
                  }`}
                >
                  {done && draft ? countStatusOf(draft) : "Count"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={() => setStep("review")}
        disabled={touchedCount === 0}
        className="min-h-11 w-full rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        Review {touchedCount} change{touchedCount === 1 ? "" : "s"}
      </button>
    </div>
  );
}
