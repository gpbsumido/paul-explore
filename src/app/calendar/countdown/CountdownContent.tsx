"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui";
import { useCountdowns } from "@/hooks/useCountdowns";
import type { Countdown, CountdownModalState } from "@/types/calendar";
import CountdownCard from "./CountdownCard";

// CountdownModal is only needed when the user opens it, so lazy-load it to
// keep the initial bundle lean. No loading fallback needed since it's triggered
// by a user action, not visible on first paint.
const CountdownModal = dynamic(
  () => import("@/components/calendar/CountdownModal"),
  { loading: () => null },
);

interface CountdownContentProps {
  initialCountdowns?: Countdown[];
}

export default function CountdownContent({
  initialCountdowns,
}: CountdownContentProps) {
  const {
    countdowns,
    createCountdown,
    isCreating,
    updateCountdown,
    isUpdating,
    deleteCountdown,
    isDeleting,
  } = useCountdowns({ initialCountdowns });

  const [modal, setModal] = useState<CountdownModalState>({ open: false });

  // keep the list sorted by target date regardless of insertion order;
  // optimistic creates append to the end so we need to re-sort client-side
  const sorted = useMemo(
    () =>
      [...countdowns].sort((a, b) => a.targetDate.localeCompare(b.targetDate)),
    [countdowns],
  );

  async function handleSave(data: Omit<Countdown, "id" | "createdAt">) {
    if (modal.open && modal.editingCountdown) {
      await updateCountdown(modal.editingCountdown.id, data);
    } else {
      await createCountdown(data);
    }
  }

  async function handleDelete(id: string) {
    await deleteCountdown(id);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      {/* page heading + new button */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          Countdowns
        </h1>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setModal({ open: true })}
        >
          New countdown
        </Button>
      </div>

      {/* list */}
      {sorted.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted">
          No countdowns yet. Pick a date and add one.
        </p>
      ) : (
        <ul className="space-y-3">
          {sorted.map((countdown) => (
            <li key={countdown.id}>
              <CountdownCard
                countdown={countdown}
                onClick={() =>
                  setModal({ open: true, editingCountdown: countdown })
                }
              />
            </li>
          ))}
        </ul>
      )}

      {modal.open && (
        <CountdownModal
          countdown={modal.editingCountdown}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setModal({ open: false })}
          isSaving={isCreating || isUpdating}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}
