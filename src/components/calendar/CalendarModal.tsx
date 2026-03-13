"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Modal, Input, Button, IconButton } from "@/components/ui";
import type { Calendar } from "@/types/calendar";
import { EVENT_COLORS } from "@/lib/calendar";
import { LABEL_CLASS } from "@/components/ui/styles";
import { useGoogleCalendarStatus } from "@/hooks/useGoogleCalendarStatus";
import { useCalendars, useCalendarMembers } from "@/hooks/useCalendars";
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
            <div
              key={i}
              className="h-6 w-6 rounded-full bg-neutral-200 dark:bg-neutral-700"
            />
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

// ---- SharingTabSkeleton ----------------------------------------------------

function SharingTabSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center justify-between gap-3">
          <div className="h-3 w-36 rounded bg-neutral-200 dark:bg-neutral-700" />
          <div className="h-5 w-14 rounded-full bg-neutral-100 dark:bg-neutral-800" />
        </div>
      ))}
    </div>
  );
}

// ---- SharingTab ------------------------------------------------------------

function SharingTab({
  calendarId,
  calendarRole,
  ownerEmail,
}: {
  calendarId: string;
  calendarRole: "owner" | "editor" | "viewer";
  ownerEmail?: string;
}) {
  const { members, isLoading } = useCalendarMembers(calendarId);
  const { inviteMember, updateMemberRole, removeMember } = useCalendars();

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"editor" | "viewer">("editor");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);
  const [removeWarning, setRemoveWarning] = useState<string | null>(null);

  async function handleInvite() {
    if (!inviteEmail.trim()) {
      setInviteError("Email is required");
      return;
    }
    setInviteError(null);
    setInviting(true);
    try {
      await inviteMember(calendarId, inviteEmail.trim(), inviteRole);
      setInviteEmail("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setInviteError(msg || "Invite failed. Please try again.");
    } finally {
      setInviting(false);
    }
  }

  async function handleRemove(memberSub: string) {
    try {
      const result = await removeMember(calendarId, memberSub);
      if (!result.googleAclRemoved) {
        setRemoveWarning(
          "Removed from this calendar. Their Google Calendar access may still be active — they can remove it manually from their Google Calendar settings.",
        );
        setTimeout(() => setRemoveWarning(null), 8000);
      }
    } catch {
      // mutation surfaces error in members list
    }
  }

  const roleBadgeClass = (role: string) => {
    if (role === "owner")
      return "px-2 py-0.5 text-xs rounded-full bg-neutral-100 dark:bg-neutral-800 text-muted";
    if (role === "editor")
      return "px-2 py-0.5 text-xs rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400";
    return "px-2 py-0.5 text-xs rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400";
  };

  return (
    <div className="space-y-4">
      {calendarRole !== "owner" && (
        <p className="text-xs text-muted">
          Shared by {ownerEmail ?? "calendar owner"}
        </p>
      )}

      {isLoading ? (
        <SharingTabSkeleton />
      ) : (
        <ul className="space-y-2">
          {members.map((m) => (
            <li key={m.userSub} className="flex items-center gap-2 min-w-0">
              <span className="flex-1 text-xs truncate">{m.email}</span>
              {calendarRole === "owner" && m.role !== "owner" ? (
                <>
                  <div className="flex items-center rounded border border-border overflow-hidden shrink-0">
                    {(["editor", "viewer"] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() =>
                          updateMemberRole(calendarId, m.userSub, r)
                        }
                        className={[
                          "h-6 px-2 text-xs transition-colors",
                          m.role === r
                            ? "bg-foreground text-background"
                            : "text-muted hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800",
                        ].join(" ")}
                      >
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => handleRemove(m.userSub)}
                    aria-label={`Remove ${m.email}`}
                    className="shrink-0 text-red-500 hover:text-red-700 transition-colors"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M2 3h8M5 3V2h2v1M4 3v7h4V3H4z"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </>
              ) : (
                <span className={roleBadgeClass(m.role)}>{m.role}</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {removeWarning && (
        <p className="text-xs text-amber-700 dark:text-amber-400 rounded-lg bg-amber-500/10 px-3 py-2">
          {removeWarning}
        </p>
      )}

      {calendarRole === "owner" && (
        <div className="pt-3 border-t border-border space-y-2">
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Invite by email"
              value={inviteEmail}
              onChange={(e) => {
                setInviteEmail(e.target.value);
                setInviteError(null);
              }}
              className="flex-1 h-8 px-2 text-xs rounded-md border border-border bg-background text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-foreground/20"
            />
            <div className="flex items-center rounded border border-border overflow-hidden shrink-0">
              {(["editor", "viewer"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setInviteRole(r)}
                  className={[
                    "h-8 px-2 text-xs transition-colors",
                    inviteRole === r
                      ? "bg-foreground text-background"
                      : "text-muted hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800",
                  ].join(" ")}
                >
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
            <Button
              size="sm"
              variant="primary"
              onClick={handleInvite}
              loading={inviting}
            >
              Invite
            </Button>
          </div>
          {inviteError && (
            <p className="text-xs text-red-600 dark:text-red-400">
              {inviteError}
            </p>
          )}
        </div>
      )}
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
 * Also shows a Sharing tab so the owner can invite members by email.
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
  const isOwner = !calendar || calendar.role === "owner";
  const queryClient = useQueryClient();
  const { connected } = useGoogleCalendarStatus();

  // non-owners go straight to the sharing tab — they can't edit calendar details
  const [tab, setTab] = useState<"details" | "sharing">(isOwner ? "details" : "sharing");

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

  const showConnectedBadge =
    isEdit && !!calendar?.googleCalId && syncMode === "two_way";
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
      // badge stays visible, user can try again
    } finally {
      setDisconnecting(false);
    }
  }

  // ---- Render --------------------------------------------------------------

  return (
    <Modal
      open
      onClose={() => {
        setTab("details");
        onClose();
      }}
      aria-label={isEdit ? "Edit calendar" : "New calendar"}
    >
      {/* header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-foreground">
          {isEdit ? "Edit calendar" : "New calendar"}
        </h2>
        <IconButton
          aria-label="Close"
          size="sm"
          onClick={() => {
            setTab("details");
            onClose();
          }}
        >
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

      {/* tab strip — edit mode only */}
      {isEdit && !connecting && (
        <div
          role="tablist"
          className="flex gap-0.5 rounded-lg border border-border p-0.5 mb-4"
        >
          {(["details", "sharing"] as const).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={[
                "flex-1 h-7 text-xs font-medium rounded-md transition-colors",
                tab === t
                  ? "bg-foreground text-background"
                  : "text-muted hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800",
              ].join(" ")}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* connecting overlay */}
      {connecting ? (
        <div>
          <CalendarModalSkeleton />
          <p className="mt-3 text-center text-xs text-muted">
            Connecting to Google Calendar…
          </p>
        </div>
      ) : null}

      {/* details tab */}
      {tab === "details" && (
        <div className={connecting ? "hidden" : "space-y-4"}>
          {!isOwner && (
            <p className="text-xs text-muted rounded-lg bg-surface border border-border px-3 py-2">
              Only the calendar owner can edit these settings.
            </p>
          )}
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
            disabled={!isOwner}
          />

          <div>
            <p className={LABEL_CLASS}>Color</p>
            <div className="flex items-center gap-2 flex-wrap">
              {EVENT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  disabled={!isOwner}
                  onClick={() => isOwner && setColor(c)}
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
                      disabled={isDisabled || isBusy || !isOwner}
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
            <p className="text-xs text-red-600 dark:text-red-400">
              {saveError}
            </p>
          )}
        </div>
      )}

      {/* sharing tab */}
      {tab === "sharing" && isEdit && (
        <SharingTab
          calendarId={calendar.id}
          calendarRole={calendar.role}
          ownerEmail={calendar.ownerEmail}
        />
      )}

      {/* action row */}
      <div
        className={
          connecting
            ? "hidden"
            : "flex items-center justify-between mt-5 pt-4 border-t border-border"
        }
      >
        {tab === "details" && isEdit && onDelete ? (
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
            onClick={() => {
              setTab("details");
              onClose();
            }}
            disabled={isBusy}
          >
            {tab === "sharing" ? "Close" : "Cancel"}
          </Button>
          {tab === "details" && isOwner && (
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
          )}
        </div>
      </div>
    </Modal>
  );
}
