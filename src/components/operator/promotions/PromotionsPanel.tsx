"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useOperatorStore } from "@/hooks/useOperatorStore";
import { useToast } from "@/contexts/ToastContext";
import {
  DISCOUNT_PRESETS,
  activePromotions,
  describePromotion,
  promotionStatus,
} from "@/lib/operator-promotions";
import { promotionSchema } from "@/lib/operator-schemas";
import { storeTimeZone, zoneLabel } from "@/lib/operator-timezone";
import type { InventoryItem, Promotion } from "@/types/operator";
import TimeZoneNote from "../TimeZoneNote";

interface PromotionsPanelProps {
  storeId: string;
  items: readonly InventoryItem[];
  /** Pre-fills the form from whatever the calculator above is modelling. */
  modelledPercent: number;
  modelledProduct: string | null;
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-success-500/15 text-success-600 dark:text-success-400",
  scheduled: "bg-primary-500/15 text-primary-600 dark:text-primary-400",
  ended: "bg-surface-raised text-muted",
};

function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Turns the calculator above into something that actually runs.
 *
 * The calculator models; this schedules and then reports back. The reporting is
 * the half that was missing: a prediction nobody ever checks is just an opinion.
 */
export default function PromotionsPanel({
  storeId,
  items,
  modelledPercent,
  modelledProduct,
}: PromotionsPanelProps) {
  const { store } = useOperatorStore(storeId);
  const { addToast } = useToast();

  const [promotions, setPromotions] = useState<readonly Promotion[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const timeZone = useMemo(() => storeTimeZone(store), [store]);

  const [percent, setPercent] = useState(modelledPercent || 10);
  const [productName, setProductName] = useState<string | null>(modelledProduct);
  const [startsAt, setStartsAt] = useState(() => toLocalInputValue(new Date()));
  const [endsAt, setEndsAt] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/operator/stores/${storeId}/promotions`);
      if (!res.ok) throw new Error("failed");
      const json = await res.json();
      setPromotions(promotionSchema.array().parse(json.promotions));
    } catch {
      setError("Could not load promotions.");
    }
  }, [storeId]);

  useEffect(() => {
    void load();
  }, [load]);

  const live = useMemo(() => activePromotions(promotions), [promotions]);

  const handleSchedule = useCallback(async () => {
    if (endsAt !== "" && Date.parse(endsAt) <= Date.parse(startsAt)) {
      setError("The end must be after the start.");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/operator/stores/${storeId}/promotions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName,
          percent,
          startsAt: new Date(startsAt).toISOString(),
          endsAt: endsAt === "" ? null : new Date(endsAt).toISOString(),
        }),
      });
      if (!res.ok) throw new Error("rejected");

      addToast({ message: `Scheduled ${percent}% off ${productName ?? "everything"}` });
      setShowForm(false);
      await load();
    } catch {
      setError("Could not schedule that promotion.");
    } finally {
      setIsSaving(false);
    }
  }, [storeId, productName, percent, startsAt, endsAt, addToast, load]);

  const handleEnd = useCallback(
    async (promotionId: string) => {
      try {
        const res = await fetch(
          `/api/operator/promotions/${promotionId}/end`,
          { method: "PATCH" },
        );
        if (!res.ok) throw new Error("failed");
        addToast({ message: "Promotion ended" });
        await load();
      } catch {
        setError("Could not end that promotion.");
      }
    },
    [addToast, load],
  );

  return (
    <section
      aria-labelledby="promotions-heading"
      className="space-y-3 rounded-lg border border-border bg-surface p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3
            id="promotions-heading"
            className="text-sm font-semibold text-foreground"
          >
            Scheduled promotions
          </h3>
          <p className="text-xs text-muted">
            The calculator above predicts. These actually run, and report back.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          aria-expanded={showForm}
          className="min-h-11 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white"
        >
          {showForm ? "Cancel" : "Schedule this"}
        </button>
      </div>

      {error && (
        <p role="alert" className="text-sm text-error-500">
          {error}
        </p>
      )}

      {showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSchedule();
          }}
          className="space-y-3 rounded-lg border border-border p-3"
        >
          <fieldset>
            <legend className="text-xs font-medium text-foreground">
              Applies to
            </legend>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <button
                type="button"
                aria-pressed={productName === null}
                onClick={() => setProductName(null)}
                className={`min-h-11 rounded-lg border px-3 py-1.5 text-xs font-medium ${
                  productName === null
                    ? "border-primary-500 bg-primary-600 text-white"
                    : "border-border text-muted"
                }`}
              >
                Whole store
              </button>
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={productName === item.productName}
                  onClick={() => setProductName(item.productName)}
                  className={`min-h-11 rounded-lg border px-3 py-1.5 text-xs font-medium ${
                    productName === item.productName
                      ? "border-primary-500 bg-primary-600 text-white"
                      : "border-border text-muted"
                  }`}
                >
                  {item.productName}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-xs font-medium text-foreground">
              Discount
            </legend>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {DISCOUNT_PRESETS.map((step) => (
                <button
                  key={step}
                  type="button"
                  aria-pressed={percent === step}
                  onClick={() => setPercent(step)}
                  className={`min-h-11 rounded-lg border px-3 py-1.5 text-xs font-medium tabular-nums ${
                    percent === step
                      ? "border-primary-500 bg-primary-600 text-white"
                      : "border-border text-muted"
                  }`}
                >
                  {step}%
                </button>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="promo-starts"
                className="block text-xs font-medium text-foreground"
              >
                Starts
              </label>
              <input
                id="promo-starts"
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div>
              <label
                htmlFor="promo-ends"
                className="block text-xs font-medium text-foreground"
              >
                Ends (blank = open-ended)
              </label>
              <input
                id="promo-ends"
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
              />
            </div>
          </div>

          {/* A promotion that starts "at midnight" has to say whose midnight. */}
          <TimeZoneNote timeZone={timeZone} />

          <button
            type="submit"
            disabled={isSaving}
            className="min-h-11 w-full rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isSaving ? "Scheduling…" : `Schedule ${percent}% off`}
          </button>
        </form>
      )}

      {promotions.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted">
          Nothing scheduled yet. Model a discount above, then schedule it.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {promotions.map((promo) => {
            const status = promotionStatus(promo);
            return (
              <li
                key={promo.id}
                className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm"
              >
                <span className="flex-1 truncate text-foreground">
                  {describePromotion(promo)}
                </span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] ${STATUS_STYLES[status]}`}
                >
                  {status}
                </span>
                {status !== "ended" && (
                  <button
                    type="button"
                    onClick={() => handleEnd(promo.id)}
                    className="shrink-0 rounded-lg border border-border px-2.5 py-1 text-xs text-muted hover:text-foreground"
                  >
                    End
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {live.length > 0 && (
        <p className="text-xs text-muted">
          {live.length} running now, measured in {zoneLabel(timeZone)}. What a
          promotion did is reported as a before-and-after against the equal
          period before it, which is a comparison and not proof it caused the
          change.
        </p>
      )}
    </section>
  );
}
