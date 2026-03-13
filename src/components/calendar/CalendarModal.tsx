"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Modal, Input, Button, IconButton } from "@/components/ui";
import type { Calendar } from "@/types/calendar";
import { EVENT_COLORS } from "@/lib/calendar";
import { LABEL_CLASS } from "@/components/ui/styles";
import { useGoogleCalendarStatus } from "@/hooks/useGoogleCalendarStatus";
import { queryKeys } from "@/lib/queryKeys";

// ---- Types -----------------------------------------------------------------

interface CalendarModalProps {
  /** When provided the modal opens in edit mode pre-populated with the calendar's values. */
  calendar?: Calendar;
  /**
   * Called on save with the collected fields. Must return the saved calendar so
   * the modal can trigger the connect-google call when syncMode is two_way and no
   * Google Calendar is linked yet.
   */
  onSave: (fields: {
    name: string;
    color: string;
    syncMode: Calendar["syncMode"];
  }) => Promise<Calendar>;
  /** Called when the user confirms deletion. Only passed in edit mode. */
  onDelete?: () => Promise<void>;
  onClose: () => void;
  /** True while the save mutation is in-flight. */
  isSaving?: boolean;
  /** True while the delete mutation is in-flight. */
  isDeleting?: boolean;
  /**
   * Called just before the modal closes after a connect-google attempt, so the
   * parent can display a result banner outside the modal.
   */
  onBanner?: (message: string, variant: "success" | "warning") => void;
}

// ---- Skeleton --------------------------------------------------------------

/**
 * Pulsed placeholder that matches the modal's field layout. Render this as the
 * modal body while the parent is loading data or while an async operation prevents
 * interaction.
 */
export function CalendarModalSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* name field */}
      <div className="space-y-1.5">
        <div className="h-3 w-12 rounded bg-neutral-200 dark:bg-neutral-700" />
        <div className="h-9 rounded-md bg-neutral-100 dark:bg-neutral-800" />
      </div>
      {/* color swatches */}
      <div className="space-y-1.5">
        <div className="h-3 w-10 rounded bg-neutral-200 dark:bg-neutral-700" />
        <div className="flex gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-6 w-6 rounded-full bg-neutral-200 dark:bg-neutral-700" />
          ))}
        </div>
      </div>
      {/* sync mode tabs */}
      <div className="space-y-1.5">
        <div className="h-3 w-8 rounded bg-neutral-200 dark:bg-neutral-700" />
        <div className="h-9 rounded-lg bg-neutral-100 dark:bg-neutral-800" />
      </div>
      {/* action row */}
      <div className="flex justify-end gap-2 pt-4 border-t border-border">
        <div className="h-8 w-16 rounded-md bg-neutral-100 dark:bg-neutral-800" />
        <div className="h-8 w-16 rounded-md bg-neutral-200 dark:bg-neutral-700" />
      </div>
    </div>
  );
}

// ---- Sync mode options -----------------------------------------------------

const SYNC_OPTIONS: { value: Calendar["syncMode"]; label: string }[] = [
  { value: "none", label: "Local only" },
  { value: "push", label: "Push to Google" },
  { value: "two_way", label: "Two-way" },
];

// ---- Modal -----------------------------------------------------------------

/**
 * Create/edit modal for named calendars.
 *
 * Create mode: opened without a `calendar` prop. Collects name, color, and sync
 * mode. If syncMode is two_way, calling save also triggers POST connect-google
 * to create a dedicated Google Calendar in the user's account.
 *
 * Edit mode: opened with a `calendar` prop. Shows a "Connected to [name]" badge
 * when the calendar is already linked to Google. A Disconnect button calls
 * DELETE /api/calendar/calendars/:id/google to stop the watch and unlink.
 */
export default function CalendarModal({
  calendar,
  onSave,
  onDelete,
  onClose,
  isSaving = false,
  isDeleting = false,
  onBanner,
}: CalendarModalProps) {
  const isEdit = !!calendar;
  const queryClient = useQueryClient();
  const { connected } = useGoogleCalendarStatus();

  const [name, setName] = useState(calendar?.name ?? "");
  const [color, setColor] = useState(calendar?.color ?? EVENT_COLORS[0]);
  const [syncMode, setSyncMode] = useState<Calendar["syncMode"]>(
    calendar?.syncMode ?? "none",
  );
  const [nameError, setNameError] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const isBusy = isSaving || isDeleting || disconnecting || connecting;

  // true when the calendar is linked and we're in two_way mode
  const showConnectedBadge =
    isEdit && !!calendar?.googleCalId && syncMode === "two_way";

  // true when the user picked two_way but no Google Calendar is linked yet
  const showCreateNotice = syncMode === "two_way" && !calendar?.googleCalId;

  // ---- Handlers ------------------------------------------------------------

  async function handleSave() {
    if (!name.trim()) {
      setNameError(true);
      return;
    }
    setSaveError(null);

    try {
      const saved = await onSave({ name: name.trim(), color, syncMode });

      // Trigger connect-google when two_way is chosen but no calendar is linked yet.
      // Applies to both create mode and edit mode (syncMode changed to two_way).
      if (syncMode === "two_way" && !saved.googleCalId) {
        setConnecting(true);
        try {
          const res = await fetch(
            `/api/calendar/calendars/${saved.id}/connect-google`,
            { method: "POST" },
          );
          if (!res.ok) throw new Error("connect failed");
          queryClient.invalidateQueries({
            queryKey: queryKeys.calendar.calendars(),
          });
          onBanner?.(
            isEdit
              ? "Calendar updated and synced with Google."
              : "Calendar created and synced with Google.",
            "success",
          );
          onClose();
        } catch {
          // Calendar is already saved; connect failure is non-fatal.
          onBanner?.(
            "Calendar saved but Google sync failed. You can retry by editing the calendar.",
            "warning",
          );
          onClose();
        } finally {
          setConnecting(false);
        }
      } else {
        onClose();
      }
    } catch {
      setSaveError("Couldn't save the calendar. Please try again.");
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    try {
      await onDelete();
      onClose();
    } catch {
      // the mutation surfaces its own error state
    }
  }

  /**
   * Calls DELETE /api/calendar/calendars/:id/google on the backend, which stops
   * the push channel and unlinks the Google Calendar from this row. Does not
   * delete the Google Calendar itself.
   */
  async function handleDisconnect() {
    if (!calendar) return;
    setDisconnecting(true);
    try {
      const res = await fetch(`/api/calendar/calendars/${calendar.id}/google`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Disconnect failed");
      setSyncMode("push");
      queryClient.invalidateQueries({
        queryKey: queryKeys.calendar.calendars(),
      });
    } catch {
      // no visible error state -- the badge will still show, user can try again
    } finally {
      setDisconnecting(false);
    }
  }

  // ---- Render --------------------------------------------------------------

  return (
    <Modal
      open
      onClose={onClose}
      aria-label={isEdit ? "Edit calendar" : "New calendar"}
    >
      {/* header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-foreground">
          {isEdit ? "Edit calendar" : "New calendar"}
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

      {connecting ? (
        <div>
          <CalendarModalSkeleton />
          <p className="mt-3 text-center text-xs text-muted">
            Connecting to Google Calendar…
          </p>
        </div>
      ) : null}

      <div className={connecting ? "hidden" : "space-y-4"}>
        {/* Name */}
        <Input
          label="Name"
          required
          autoComplete="off"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setNameError(false);
          }}
          placeholder="Calendar name"
          error={nameError ? "Name is required" : undefined}
          size="sm"
        />

        {/* Color swatches -- same pattern as EventModal */}
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

        {/* Sync mode -- three-option tab strip */}
        <div>
          <p className={LABEL_CLASS}>Sync</p>
          <div className="flex items-center rounded-lg border border-border p-0.5 gap-0.5">
            {SYNC_OPTIONS.map(({ value, label }) => {
              const isActive = syncMode === value;
              const isDisabled = value === "two_way" && !connected;
              return (
                <div
                  key={value}
                  className="relative flex-1"
                  title={
                    isDisabled
                      ? "Connect Google Calendar in Settings first"
                      : undefined
                  }
                >
                  <button
                    type="button"
                    disabled={isDisabled || isBusy}
                    onClick={() => setSyncMode(value)}
                    className={[
                      "w-full h-7 px-2 text-xs font-medium rounded-md transition-colors",
                      isActive
                        ? "bg-foreground text-background"
                        : isDisabled
                          ? "text-muted/40 cursor-not-allowed"
                          : "text-muted hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800",
                    ].join(" ")}
                  >
                    {label}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Connected badge + disconnect button */}
        {showConnectedBadge && (
          <div className="flex items-center justify-between gap-3 rounded-lg bg-green-500/10 px-3 py-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
              <span className="text-xs text-green-700 dark:text-green-400 truncate">
                Connected to{" "}
                {calendar!.googleCalName ?? calendar!.googleCalId}
              </span>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDisconnect}
              loading={disconnecting}
              disabled={isBusy}
            >
              Disconnect
            </Button>
          </div>
        )}

        {/* Notice shown when two_way is selected but no Google Calendar linked yet */}
        {showCreateNotice && (
          <p className="text-xs text-muted rounded-lg bg-surface border border-border px-3 py-2">
            Saving will create a Google Calendar named{" "}
            <strong className="text-foreground">
              {name.trim() || "this calendar"}
            </strong>{" "}
            in your account.
          </p>
        )}

        {saveError && (
          <p className="text-xs text-red-600 dark:text-red-400">{saveError}</p>
        )}
      </div>

      {/* action row — hidden while the connect-google POST is running */}
      <div className={connecting ? "hidden" : "flex items-center justify-between mt-5 pt-4 border-t border-border"}>
        {isEdit && onDelete ? (
          confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted">Delete this calendar?</span>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
                loading={isDeleting}
                disabled={isBusy}
              >
                Confirm
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmDelete(false)}
                disabled={isBusy}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setConfirmDelete(true)}
              disabled={isBusy}
            >
              Delete
            </Button>
          )
        ) : (
          <span />
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isBusy}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            loading={isSaving || connecting}
            disabled={isBusy}
          >
            {isSaving || connecting
              ? "Saving..."
              : isEdit
                ? "Save"
                : "Create"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
