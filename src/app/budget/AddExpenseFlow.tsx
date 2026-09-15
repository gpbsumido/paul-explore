"use client";

import { useEffect, useRef, useState } from "react";
import { m } from "framer-motion";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Sheet from "@/components/ui/Sheet";
import { useHubReducedMotion } from "@/app/providers";
import { spring } from "@/lib/animations";
import { CATEGORIES, PRESET_TAGS, categoryById } from "@/lib/budget/categories.data";
import { formatCents, parseAmountToCents } from "@/lib/budget/format";
import type { NewExpense } from "@/lib/budget/budgetStore";

type Step = 1 | 2 | 3;

/**
 * The fast-add flow, built for the fewest taps: a bottom sheet that springs up,
 * then category, then amount, then an optional third step for the date/time and
 * tags. Date and time default to now, so the common path is category, amount,
 * save. Each step animates in gently (or plainly under reduced motion); the
 * sheet itself handles the spring, drag-to-dismiss, focus, and Escape.
 */
export default function AddExpenseFlow({
  onAdd,
}: {
  onAdd: (input: NewExpense) => void;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [categoryId, setCategoryId] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [useNow, setUseNow] = useState(true);
  const [whenLocal, setWhenLocal] = useState("");
  const [note, setNote] = useState("");
  const [vendor, setVendor] = useState("");
  const reduced = useHubReducedMotion();

  const amountRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (open && step === 2) amountRef.current?.focus();
  }, [open, step]);

  const cents = parseAmountToCents(amount);

  const close = () => {
    setOpen(false);
    setStep(1);
    setCategoryId("");
    setAmount("");
    setTags([]);
    setUseNow(true);
    setWhenLocal("");
    setNote("");
    setVendor("");
  };

  const save = () => {
    if (cents === null) return;
    onAdd({
      categoryId,
      amountCents: cents,
      occurredAt: useNow || !whenLocal ? undefined : new Date(whenLocal).toISOString(),
      tags,
      note: note.trim() || undefined,
      vendor: vendor.trim() || undefined,
    });
    close();
  };

  const toggleTag = (tag: string) =>
    setTags((current) =>
      current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag],
    );

  const stepMotion = reduced
    ? {}
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        transition: spring.smooth,
      };

  return (
    <>
      <Button size="lg" onClick={() => setOpen(true)}>
        <span aria-hidden>+ </span>Add expense
      </Button>

      <Sheet open={open} onClose={close} label="Add expense">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs font-medium text-muted">Step {step} of 3</p>
        </div>

        {step === 1 && (
          <m.div key="step1" {...stepMotion}>
            <h2 className="mb-3 text-base font-semibold text-foreground">Pick a category</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setCategoryId(c.id);
                    setStep(2);
                  }}
                  className="flex flex-col items-center gap-1 rounded-2xl border border-border bg-surface px-3 py-4 text-sm font-medium text-foreground transition hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-feature-budget)] active:scale-95"
                >
                  <span aria-hidden className="text-3xl">
                    {c.emoji}
                  </span>
                  {c.label}
                </button>
              ))}
            </div>
          </m.div>
        )}

        {step === 2 && (
          <m.div key="step2" {...stepMotion}>
            <h2 className="mb-3 text-base font-semibold text-foreground">
              <span aria-hidden>{categoryById(categoryId).emoji} </span>
              {categoryById(categoryId).label}
            </h2>
            <Input
              ref={amountRef}
              label="Amount"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && cents !== null) setStep(3);
              }}
            />
            <div className="mt-4 flex gap-2">
              <Button onClick={() => setStep(3)} disabled={cents === null}>
                Next
              </Button>
              <Button variant="ghost" onClick={() => setStep(1)}>
                Back
              </Button>
            </div>
          </m.div>
        )}

        {step === 3 && (
          <m.div key="step3" {...stepMotion}>
            <h2 className="mb-3 text-base font-semibold text-foreground">Details</h2>
            <div className="mb-3 space-y-2">
              <Input
                label="Note (optional)"
                placeholder="What for?"
                autoComplete="off"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <Input
                label="Vendor (optional)"
                placeholder="Where?"
                autoComplete="off"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={useNow}
                onChange={(e) => setUseNow(e.target.checked)}
              />
              Use current date and time
            </label>
            {!useNow && (
              <Input
                className="mt-2"
                label="Date and time"
                type="datetime-local"
                value={whenLocal}
                onChange={(e) => setWhenLocal(e.target.value)}
              />
            )}

            <fieldset className="mt-4">
              <legend className="mb-1 text-sm text-muted">Tags (optional)</legend>
              <div className="flex flex-wrap gap-2">
                {PRESET_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    aria-pressed={tags.includes(tag)}
                    onClick={() => toggleTag(tag)}
                    className={`rounded-full border px-3 py-1 text-sm transition active:scale-95 ${
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

            <div className="mt-5 flex gap-2">
              <Button onClick={save} aria-label="Save expense">
                Add {cents !== null ? formatCents(cents) : "expense"}
              </Button>
              <Button variant="ghost" onClick={() => setStep(2)}>
                Back
              </Button>
            </div>
          </m.div>
        )}
      </Sheet>
    </>
  );
}
