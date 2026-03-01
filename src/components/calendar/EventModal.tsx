"use client";

import { useState, useEffect, useId, type ReactNode } from "react";
import { format, formatISO, addHours, parseISO } from "date-fns";
import { Modal, Input, Textarea, Button, IconButton } from "@/components/ui";
import type { CalendarEvent, DraftCard } from "@/types/calendar";
import type { CardResume } from "@/lib/tcg";
import {
  EVENT_COLORS,
  toInputValue,
  fetchEventCards,
  addCardToEvent,
  updateEventCard,
  removeCardFromEvent,
} from "@/lib/calendar";
import { LABEL_CLASS } from "@/components/ui/styles";
import CardSearch from "./CardSearch";
import AttachedCardsList from "./AttachedCardsList";

interface EventModalProps {
  initialDate: Date;
  event?: CalendarEvent;
  onSave: (event: CalendarEvent) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onClose: () => void;
  /** True while a create or update mutation is in-flight. Drives button state. */
  isSaving?: boolean;
  /** True while a delete mutation is in-flight. Drives button state. */
  isDeleting?: boolean;
}

/** Section header with a trailing rule — keeps the two columns visually organized. */
function SectionHeader({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted/50 whitespace-nowrap">
        {children}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

export default function EventModal({
  initialDate,
  event,
  onSave,
  onDelete,
  onClose,
  isSaving = false,
  isDeleting = false,
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
  const [saveError, setSaveError] = useState<string | null>(null);

  // end < start is derived — no extra state needed
  const endBeforeStart = endDate < startDate;

  // ---------------------------------------------------------------------------
  // Cards state
  // ---------------------------------------------------------------------------
  const [cards, setCards] = useState<DraftCard[]>([]);
  // ids of already-persisted cards that the user removed this session
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());

  // load attached cards when opening an existing event
  useEffect(() => {
    if (!event?.id) return;
    fetchEventCards(event.id)
      .then((fetched) => setCards(fetched.map((c) => ({ ...c }))))
      .catch(() => {
        // non-fatal — cards section just starts empty if the fetch fails
      });
  }, [event?.id]);

  /** Stage a card locally. Actual write happens on save so we can batch it with the event. */
  function handleCardSelected(card: CardResume) {
    // silently skip if the same card is already in the list
    if (cards.some((c) => c.cardId === card.id)) return;

    const draft: DraftCard = {
      id: crypto.randomUUID(), // temp key — replaced by server id after save
      eventId: event?.id ?? "",
      cardId: card.id,
      cardName: card.name,
      cardImageUrl: card.image,
      quantity: 1,
      createdAt: new Date().toISOString(),
      pending: true,
    };
    setCards((prev) => [...prev, draft]);
  }

  function handleQuantityChange(entryId: string, quantity: number) {
    setCards((prev) =>
      prev.map((c) => (c.id === entryId ? { ...c, quantity } : c)),
    );
  }

  function handleNotesChange(entryId: string, notes: string) {
    setCards((prev) =>
      prev.map((c) => (c.id === entryId ? { ...c, notes } : c)),
    );
  }

  /** Remove a card from the list. Persisted cards are queued for deletion on save. */
  function handleRemove(entryId: string) {
    const card = cards.find((c) => c.id === entryId);
    if (!card) return;
    if (!card.pending) {
      setRemovedIds((prev) => new Set([...prev, entryId]));
    }
    setCards((prev) => prev.filter((c) => c.id !== entryId));
  }

  // ---------------------------------------------------------------------------
  // Save / delete
  // ---------------------------------------------------------------------------

  /**
   * Persists the event then syncs card changes against it.
   * Order matters: event must exist before we can write cards to it,
   * which is why card ops happen after `onSave` resolves.
   */
  async function handleSave() {
    if (!title.trim()) {
      setTitleError(true);
      return;
    }
    setSaveError(null);

    // datetime-local inputs produce naive strings (no tz); add local offset
    // so Postgres stores the right UTC moment instead of treating it as UTC midnight
    const toISO = (s: string) => formatISO(parseISO(s));

    try {
      const savedEvent: CalendarEvent = {
        id: event?.id ?? crypto.randomUUID(),
        title: title.trim(),
        description: description.trim() || undefined,
        startDate: toISO(
          allDay ? `${startDate.split("T")[0]}T00:00` : startDate,
        ),
        endDate: toISO(allDay ? `${endDate.split("T")[0]}T23:59` : endDate),
        allDay,
        color,
      };
      await onSave(savedEvent);

      const eventId = savedEvent.id;

      // delete removed cards first so we don't hit any uniqueness issues
      await Promise.all(
        [...removedIds].map((id) =>
          removeCardFromEvent(eventId, id).catch(() => null),
        ),
      );

      // add pending cards and update in-place edits in parallel
      await Promise.all(
        cards.map(async (c) => {
          if (c.pending) {
            return addCardToEvent(eventId, {
              cardId: c.cardId,
              cardName: c.cardName,
              cardSetId: c.cardSetId,
              cardSetName: c.cardSetName,
              cardImageUrl: c.cardImageUrl,
              quantity: c.quantity,
              notes: c.notes,
            }).catch(() => null);
          }
          return updateEventCard(eventId, c.id, {
            quantity: c.quantity,
            notes: c.notes,
          }).catch(() => null);
        }),
      );

      onClose();
    } catch {
      setSaveError("Couldn't save the event. Please try again.");
    }
  }

  async function handleDelete() {
    if (!event || !onDelete) return;
    try {
      await onDelete(event.id);
      onClose();
    } catch {
      // isDeleting resets automatically when the mutation settles
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      aria-label={isEdit ? "Edit event" : "New event"}
      className="overflow-y-auto max-h-[90vh] sm:max-w-2xl"
    >
      {/* header */}
      <div className="flex items-center justify-between mb-5">
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

      {/* two-column body — stacks on mobile, side by side on sm+ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
        {/* ── left column: event details ── */}
        <div className="space-y-3">
          <SectionHeader>Details</SectionHeader>

          <Input
            label="Title"
            required
            autoComplete="off"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setTitleError(false);
            }}
            placeholder="Event title"
            error={titleError ? "Title is required" : undefined}
            size="sm"
          />

          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
            rows={2}
          />

          {/* All-day toggle */}
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

          {/* Start / End — paired in one row */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start"
              type={allDay ? "date" : "datetime-local"}
              value={allDay ? startDate.split("T")[0] : startDate}
              onChange={(e) =>
                setStartDate(
                  allDay ? `${e.target.value}T00:00` : e.target.value,
                )
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

          {/* end-before-start warning — derived, no extra state */}
          {endBeforeStart && (
            <p className="-mt-1 text-xs text-amber-600 dark:text-amber-400">
              End is before start — check your dates
            </p>
          )}

          {/* Color swatches — circles with a checkmark on the selected one */}
          <div>
            <p className={LABEL_CLASS}>Color</p>
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

        {/* ── right column: attached cards ── */}
        <div className="space-y-3">
          <SectionHeader>Cards</SectionHeader>
          {/* search first so the empty-state hint "above" makes sense */}
          <CardSearch onSelectCard={handleCardSelected} />
          <AttachedCardsList
            cards={cards}
            onQuantityChange={handleQuantityChange}
            onNotesChange={handleNotesChange}
            onRemove={handleRemove}
          />
        </div>
      </div>

      {saveError && (
        <p className="mt-3 text-xs text-red-600 dark:text-red-400">
          {saveError}
        </p>
      )}

      {/* action row — separated from the form by a rule */}
      <div className="flex items-center justify-between mt-5 pt-4 border-t border-border">
        {isEdit && onDelete ? (
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
