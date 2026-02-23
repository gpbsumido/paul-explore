"use client";

import { useState, useId } from "react";
import { format, formatISO, addHours, parseISO } from "date-fns";
import { Modal, Input, Textarea, Button, IconButton } from "@/components/ui";
import type { CalendarEvent } from "@/types/calendar";
import { EVENT_COLORS, toInputValue } from "@/lib/calendar";
import { LABEL_CLASS } from "@/components/ui/styles";

interface EventModalProps {
  initialDate: Date;
  event?: CalendarEvent;
  onSave: (event: CalendarEvent) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onClose: () => void;
}

export default function EventModal({
  initialDate,
  event,
  onSave,
  onDelete,
  onClose,
}: EventModalProps) {
  const uid = useId();
  const isEdit = !!event;

  const defaultStart = format(initialDate, "yyyy-MM-dd'T'HH:mm");
  const defaultEnd = format(addHours(initialDate, 1), "yyyy-MM-dd'T'HH:mm");

  const [title, setTitle] = useState(event?.title ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [startDate, setStartDate] = useState(
    event ? toInputValue(event.startDate) : defaultStart,
  );
  const [endDate, setEndDate] = useState(
    event ? toInputValue(event.endDate) : defaultEnd,
  );
  const [allDay, setAllDay] = useState(event?.allDay ?? false);
  const [color, setColor] = useState(event?.color ?? EVENT_COLORS[0]);
  const [titleError, setTitleError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleSave() {
    if (!title.trim()) {
      setTitleError(true);
      return;
    }
    setSaving(true);
    setSaveError(null);
    // convert the naive datetime-local strings (no tz) to ISO with local offset
    // e.g. "2026-02-24T00:00" → "2026-02-24T00:00:00-05:00" so it's in UTC in db
    const toISO = (s: string) => formatISO(parseISO(s));

    try {
      await onSave({
        id: event?.id ?? crypto.randomUUID(),
        title: title.trim(),
        description: description.trim() || undefined,
        startDate: toISO(
          allDay ? `${startDate.split("T")[0]}T00:00` : startDate,
        ),
        endDate: toISO(allDay ? `${endDate.split("T")[0]}T23:59` : endDate),
        allDay,
        color,
      });
      onClose();
    } catch {
      setSaveError("Couldn't save the event. Please try again.");
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!event || !onDelete) return;
    setDeleting(true);
    try {
      await onDelete(event.id);
      onClose();
    } catch {
      setDeleting(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      aria-label={isEdit ? "Edit event" : "New event"}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-foreground">
          {isEdit ? "Edit event" : "New event"}
        </h2>
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

      <div className="space-y-3">
        {/* Title */}
        <Input
          label="Title"
          required
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setTitleError(false);
          }}
          placeholder="Event title"
          error={titleError ? "Title is required" : undefined}
          size="sm"
        />

        {/* Description */}
        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
          rows={2}
        />

        {/* All-day */}
        <div className="flex items-center gap-2">
          <input
            id={`${uid}-allday`}
            type="checkbox"
            checked={allDay}
            onChange={(e) => setAllDay(e.target.checked)}
            className="cursor-pointer"
          />
          <label
            htmlFor={`${uid}-allday`}
            className="text-sm text-foreground cursor-pointer"
          >
            All day
          </label>
        </div>

        {/* Start / End */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Start"
            type={allDay ? "date" : "datetime-local"}
            value={allDay ? startDate.split("T")[0] : startDate}
            onChange={(e) =>
              setStartDate(allDay ? `${e.target.value}T00:00` : e.target.value)
            }
            size="sm"
          />
          <Input
            label="End"
            type={allDay ? "date" : "datetime-local"}
            value={allDay ? endDate.split("T")[0] : endDate}
            onChange={(e) =>
              setEndDate(allDay ? `${e.target.value}T23:59` : e.target.value)
            }
            size="sm"
          />
        </div>

        {/* Color */}
        <div>
          <p className={LABEL_CLASS}>Color</p>
          <div className="flex items-center gap-2">
            {EVENT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={[
                  "h-6 w-6 rounded-full transition-all",
                  color === c ? "ring-2 ring-foreground ring-offset-1" : "",
                ].join(" ")}
                style={{ backgroundColor: c }}
                aria-label={`Color ${c}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      {saveError && (
        <p className="mt-3 text-xs text-red-600 dark:text-red-400">
          {saveError}
        </p>
      )}
      <div className="flex items-center justify-between mt-5">
        {isEdit && onDelete ? (
          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            disabled={deleting || saving}
          >
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={saving || deleting}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={saving || deleting}
          >
            {saving ? "Saving…" : isEdit ? "Save" : "Create"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
