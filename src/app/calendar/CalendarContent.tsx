"use client";

import { useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  parseISO,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";
import CalendarHeader from "@/components/calendar/CalendarHeader";
import CalendarGrid from "@/components/calendar/CalendarGrid";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useCountdowns } from "@/hooks/useCountdowns";
import { useCalendars } from "@/hooks/useCalendars";
import type {
  CalendarView,
  CalendarEvent,
  ModalState,
  Countdown,
  CountdownModalState,
} from "@/types/calendar";
import { DaySkeleton, WeekSkeleton, YearSkeleton } from "./CalendarSkeletons";

// CalendarGrid is the LCP element so it stays as a static import.
// Everything else only loads after the user switches views or opens a modal,
// so lazily loading them keeps the initial bundle lean.
// Each dynamic() gets a loading fallback whose dimensions match the real view
// so there's no layout shift while the JS chunk downloads.
const DayView = dynamic(() => import("@/components/calendar/DayView"), {
  loading: () => <DaySkeleton />,
});
const WeekView = dynamic(() => import("@/components/calendar/WeekView"), {
  loading: () => <WeekSkeleton />,
});
const YearView = dynamic(() => import("@/components/calendar/YearView"), {
  loading: () => <YearSkeleton />,
});
const EventModal = dynamic(() => import("@/components/calendar/EventModal"), {
  loading: () => null,
});
const CountdownModal = dynamic(
  () => import("@/components/calendar/CountdownModal"),
  { loading: () => null },
);

interface CalendarContentProps {
  /** SSR seed data for the current month. Skips the initial client-side fetch
   *  when provided, so the calendar grid renders without a loading state. */
  initialEvents?: CalendarEvent[];
}

export default function CalendarContent({
  initialEvents,
}: CalendarContentProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [view, setView] = useState<CalendarView>("month");
  const [modal, setModal] = useState<ModalState>({ open: false });
  const [countdownModal, setCountdownModal] = useState<CountdownModalState>({
    open: false,
  });
  const [selectedCalendarId, setSelectedCalendarId] = useState<string | null>(null);

  const { calendars } = useCalendars();

  // null means "use first calendar". Derive the effective id so no effect is
  // needed — the first render after calendars load will pick up the right value.
  const effectiveCalendarId = selectedCalendarId ?? calendars[0]?.id ?? null;

  // calculate fetch window
  const { start, end } = useMemo(() => {
    switch (view) {
      case "day":
        return {
          start: startOfDay(currentDate).toISOString(),
          end: endOfDay(currentDate).toISOString(),
        };
      case "week":
        return {
          start: startOfWeek(currentDate).toISOString(),
          end: endOfWeek(currentDate).toISOString(),
        };
      case "month":
        return {
          start: startOfWeek(startOfMonth(currentDate)).toISOString(),
          end: endOfWeek(endOfMonth(currentDate)).toISOString(),
        };
      case "year":
        return {
          start: startOfYear(currentDate).toISOString(),
          end: endOfYear(currentDate).toISOString(),
        };
    }
  }, [currentDate, view]);

  const calendarEvents = useCalendarEvents({ start, end, calendarId: effectiveCalendarId, initialEvents });

  // Countdowns don't need a date window — they're all fetched at once and
  // filtered client-side per day. No SSR seed needed here because the
  // /calendar/countdown page handles the server-side data loading.
  const {
    countdowns,
    createCountdown,
    isCreating: isCreatingCountdown,
    updateCountdown,
    isUpdating: isUpdatingCountdown,
    deleteCountdown,
    isDeleting: isDeletingCountdown,
  } = useCountdowns();

  // Stable reference for the events array so the memoized view components don't
  // re-render just because calendarEvents returned a new object wrapper.
  const visibleEvents = useMemo(
    () => calendarEvents.events,
    [calendarEvents.events],
  );

  function handleNavigate(direction: -1 | 1) {
    setCurrentDate((prev) => {
      switch (view) {
        case "day":
          return addDays(prev, direction);
        case "week":
          return addWeeks(prev, direction);
        case "month":
          return addMonths(prev, direction);
        case "year":
          return addYears(prev, direction);
      }
    });
  }

  function handleToday() {
    setCurrentDate(new Date());
  }

  // useCallback keeps these stable across re-renders so the memoized view
  // components don't see new prop references every time modal state changes
  const handleMonthClick = useCallback((date: Date) => {
    setCurrentDate(date);
    setView("month");
  }, []);

  const openCreateModal = useCallback((date: Date) => {
    setModal({ open: true, initialDate: date });
  }, []);

  const openEditModal = useCallback((event: CalendarEvent) => {
    setModal({
      open: true,
      initialDate: parseISO(event.startDate),
      editingEvent: event,
    });
  }, []);

  const openNewCountdownModal = useCallback((initialDate?: Date) => {
    setCountdownModal({ open: true, initialDate });
  }, []);

  const openCountdownModal = useCallback((countdown: Countdown) => {
    setCountdownModal({ open: true, editingCountdown: countdown });
  }, []);

  async function handleSave(eventData: CalendarEvent) {
    if (modal.open && modal.editingEvent) {
      const { id, ...fields } = eventData;
      await calendarEvents.updateEvent(id, fields);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _id, ...fields } = eventData;
      await calendarEvents.createEvent(fields);
    }
  }

  async function handleDelete(id: string) {
    await calendarEvents.deleteEvent(id);
  }

  async function handleCountdownSave(
    data: Omit<Countdown, "id" | "createdAt">,
  ) {
    if (countdownModal.open && countdownModal.editingCountdown) {
      await updateCountdown(countdownModal.editingCountdown.id, data);
    } else {
      await createCountdown(data);
    }
  }

  async function handleCountdownDelete(id: string) {
    await deleteCountdown(id);
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
      <CalendarHeader
        currentDate={currentDate}
        view={view}
        onNavigate={handleNavigate}
        onViewChange={setView}
        onToday={handleToday}
        onNewCountdown={() => openNewCountdownModal()}
        selectedCalendarId={effectiveCalendarId}
        onSelectCalendar={setSelectedCalendarId}
      />

      {calendarEvents.error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
          {calendarEvents.error}
        </div>
      )}

      <div
        className={
          calendarEvents.loading ? "opacity-60 pointer-events-none" : undefined
        }
      >
        {view === "day" && (
          <DayView
            currentDate={currentDate}
            events={visibleEvents}
            countdowns={countdowns}
            onSlotClick={openCreateModal}
            onChipClick={openEditModal}
            onCountdownClick={openCountdownModal}
          />
        )}
        {view === "week" && (
          <WeekView
            currentDate={currentDate}
            events={visibleEvents}
            countdowns={countdowns}
            onSlotClick={openCreateModal}
            onChipClick={openEditModal}
            onCountdownClick={openCountdownModal}
          />
        )}
        {view === "month" && (
          <CalendarGrid
            currentDate={currentDate}
            events={visibleEvents}
            countdowns={countdowns}
            onDayClick={openCreateModal}
            onChipClick={openEditModal}
            onCountdownClick={openCountdownModal}
          />
        )}
        {view === "year" && (
          <YearView
            currentDate={currentDate}
            events={visibleEvents}
            countdowns={countdowns}
            onMonthClick={handleMonthClick}
          />
        )}
      </div>

      {modal.open && (
        <EventModal
          initialDate={modal.initialDate}
          event={modal.editingEvent}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setModal({ open: false })}
          isSaving={calendarEvents.isCreating || calendarEvents.isUpdating}
          isDeleting={calendarEvents.isDeleting}
          onSwitchToCountdown={
            modal.editingEvent
              ? undefined
              : () => {
                  openNewCountdownModal(modal.initialDate);
                  setModal({ open: false });
                }
          }
        />
      )}

      {countdownModal.open && (
        <CountdownModal
          countdown={countdownModal.editingCountdown}
          initialDate={
            countdownModal.open ? countdownModal.initialDate : undefined
          }
          onSave={handleCountdownSave}
          onDelete={handleCountdownDelete}
          onClose={() => setCountdownModal({ open: false })}
          isSaving={isCreatingCountdown || isUpdatingCountdown}
          isDeleting={isDeletingCountdown}
          onSwitchToEvent={
            countdownModal.editingCountdown
              ? undefined
              : () => {
                  setModal({
                    open: true,
                    initialDate: countdownModal.initialDate ?? new Date(),
                  });
                  setCountdownModal({ open: false });
                }
          }
        />
      )}
    </div>
  );
}
