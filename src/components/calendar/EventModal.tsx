"use client";

import { useState, useId } from "react";
import { format, addHours } from "date-fns";
import { Modal, Input, Textarea, Button, IconButton } from "@/components/ui";
import type { CalendarEvent } from "@/types/calendar";
import { EVENT_COLORS, toInputValue } from "@/lib/calendar";
import { LABEL_CLASS } from "@/components/ui/styles";

interface EventModalProps {
  initialDate: Date;
  event?: CalendarEvent;
  onSave: (event: CalendarEvent) => void;
  onDelete?: (id: string) => void;
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
  const [startDate, setStartDate] = useState(event ? toInputValue(event.startDate) : defaultStart);
  const [endDate, setEndDate] = useState(event ? toInputValue(event.endDate) : defaultEnd);
  const [allDay, setAllDay] = useState(event?.allDay ?? false);
  const [color, setColor] = useState(event?.color ?? EVENT_COLORS[0]);
  const [titleError, setTitleError] = useState(false);

  function handleSave() {
    if (!title.trim()) {
      setTitleError(true);
      return;
    }
    onSave({
      id: event?.id ?? crypto.randomUUID(),
      title: title.trim(),
      description: description.trim() || undefined,
      startDate: allDay ? `${startDate.split("T")[0]}T00:00` : startDate,
      endDate: allDay ? `${endDate.split("T")[0]}T23:59` : endDate,
      allDay,
      color,
    });
    onClose();
  }

  function handleDelete() {
    if (event && onDelete) {
      onDelete(event.id);
      onClose();
    }
  }

  return (
    <Modal open onClose={onClose} aria-label={isEdit ? "Edit event" : "New event"}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-foreground">
          {isEdit ? "Edit event" : "New event"}
        </h2>
        <IconButton aria-label="Close" size="sm" onClick={onClose}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
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
          <label htmlFor={`${uid}-allday`} className="text-sm text-foreground cursor-pointer">
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
      <div className="flex items-center justify-between mt-5">
        {isEdit && onDelete ? (
          <Button variant="danger" size="sm" onClick={handleDelete}>
            Delete
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave}>
            {isEdit ? "Save" : "Create"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
