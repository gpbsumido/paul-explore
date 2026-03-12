"use client";

import { useState } from "react";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { Modal, Input, Textarea, Button, IconButton } from "@/components/ui";
import type { Countdown } from "@/types/calendar";
import { EVENT_COLORS } from "@/lib/calendar";
import { LABEL_CLASS } from "@/components/ui/styles";

// Labels in one place so they're easy to change without hunting through JSX.
const FIELD_LABELS = {
  title: "Title",
  description: "Description",
  targetDate: "Target date",
  color: "Color",
} as const;

interface CountdownModalProps {
  /** Omit to open in create mode. Pass a countdown to open in edit mode. */
  countdown?: Countdown;
  /** Pre-fills targetDate when switching from the event modal. */
  initialDate?: Date;
  onSave: (data: Omit<Countdown, "id" | "createdAt">) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
  /** True while a create or update is in-flight. */
  isSaving: boolean;
  /** True while a delete is in-flight. */
  isDeleting: boolean;
  /** Called when the user switches to the event modal in create mode. */
  onSwitchToEvent?: () => void;
}

/**
 * Returns a human-readable string describing how far away a date is,
 * or null if the date string is empty.
 */
function getDaysLabel(targetDate: string): string | null {
  if (!targetDate) return null;
  const days = differenceInCalendarDays(new Date(`${targetDate}T00:00:00`), new Date());
  if (days === 0) return "Today!";
  if (days > 0) return `${days} day${days === 1 ? "" : "s"} away`;
  return `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago`;
}

/**
 * Modal for creating or editing a countdown. Renders in create mode when
 * no countdown prop is passed, edit mode when one is. The delete button
 * only shows in edit mode.
 */
export default function CountdownModal({
  countdown,
  initialDate,
  onSave,
  onDelete,
  onClose,
  isSaving,
  isDeleting,
  onSwitchToEvent,
}: CountdownModalProps) {
  const isEdit = !!countdown;

  const [title, setTitle] = useState(countdown?.title ?? "");
  const [description, setDescription] = useState(countdown?.description ?? "");
  const [targetDate, setTargetDate] = useState(
    countdown?.targetDate ??
      (initialDate ? format(initialDate, "yyyy-MM-dd") : ""),
  );

  const [color, setColor] = useState(countdown?.color ?? EVENT_COLORS[0]);
  const [titleError, setTitleError] = useState(false);
  const [dateError, setDateError] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const daysLabel = getDaysLabel(targetDate);

  async function handleSave() {
    let hasError = false;
    if (!title.trim()) {
      setTitleError(true);
      hasError = true;
    }
    if (!targetDate) {
      setDateError(true);
      hasError = true;
    }
    if (hasError) return;

    setSaveError(null);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || undefined,
        targetDate,
        color,
      });
      onClose();
    } catch {
      setSaveError("Couldn't save the countdown. Please try again.");
    }
  }

  async function handleDelete() {
    if (!countdown) return;
    try {
      await onDelete(countdown.id);
      onClose();
    } catch {
      // isDeleting resets when the mutation settles
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      aria-label={isEdit ? "Edit countdown" : "New countdown"}
      className="overflow-y-auto max-h-[90vh] sm:max-w-md"
    >
      {/* header */}
      <div className="flex items-center justify-between mb-5">
        {isEdit || !onSwitchToEvent ? (
          <h2 className="text-base font-semibold text-foreground">
            {isEdit ? "Edit countdown" : "New countdown"}
          </h2>
        ) : (
          <div className="flex items-center rounded-lg border border-border p-0.5 gap-0.5">
            <button
              type="button"
              onClick={onSwitchToEvent}
              className="h-7 px-3 text-xs font-medium rounded-md text-muted hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Event
            </button>
            <button
              type="button"
              className="h-7 px-3 text-xs font-medium rounded-md bg-foreground text-background"
            >
              Countdown
            </button>
          </div>
        )}
        <IconButton aria-label="Close" size="sm" onClick={onClose}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M1 1l10 10M11 1L1 11"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </IconButton>
      </div>

      <div className="space-y-4">
        <Input
          label={FIELD_LABELS.title}
          required
          autoComplete="off"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setTitleError(false);
          }}
          placeholder="Countdown title"
          error={titleError ? "Title is required" : undefined}
          size="sm"
        />

        <Textarea
          label={FIELD_LABELS.description}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
          rows={2}
        />

        <div>
          <Input
            label={FIELD_LABELS.targetDate}
            type="date"
            required
            value={targetDate}
            onChange={(e) => {
              setTargetDate(e.target.value);
              setDateError(false);
            }}
            error={dateError ? "Target date is required" : undefined}
            size="sm"
          />
          {/* live preview so the user knows what they're picking right away */}
          {daysLabel && <p className="mt-1 text-xs text-muted">{daysLabel}</p>}
        </div>

        {/* color swatches, same pattern as EventModal */}
        <div>
          <p className={LABEL_CLASS}>{FIELD_LABELS.color}</p>
          <div className="flex items-center gap-2 flex-wrap">
            {EVENT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="h-6 w-6 rounded-full inline-flex items-center justify-center shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
                style={{ backgroundColor: c }}
                aria-label={`Color ${c}`}
                aria-pressed={color === c}
              >
                {color === c && (
                  <svg
                    width="10"
                    height="8"
                    viewBox="0 0 10 8"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M1 4l2.5 2.5L9 1"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {saveError && (
        <p className="mt-3 text-xs text-red-600 dark:text-red-400">
          {saveError}
        </p>
      )}

      {/* action row */}
      <div className="flex items-center justify-between mt-5 pt-4 border-t border-border">
        {isEdit ? (
          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting || isSaving}
          >
            {isDeleting ? "Deleting…" : "Delete"}
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSaving || isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={isSaving || isDeleting}
          >
            {isSaving ? "Saving…" : isEdit ? "Save" : "Create"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
