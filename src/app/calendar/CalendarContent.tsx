"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  parseISO,
  format,
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfYear,
  endOfDay,
  endOfWeek,
  endOfMonth,
  endOfYear,
} from "date-fns";
import CalendarHeader from "@/components/calendar/CalendarHeader";
import CalendarGrid from "@/components/calendar/CalendarGrid";
import InfiniteCalendarScroll, {
  type InfiniteCalendarScrollHandle,
} from "@/components/calendar/InfiniteCalendarScroll";
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

// ---------------------------------------------------------------------------
// Period helpers — module-level so they never change identity between renders.
// ---------------------------------------------------------------------------

function normalizePeriod(view: CalendarView, date: Date): Date {
  switch (view) {
    case "day": return startOfDay(date);
    case "week": return startOfWeek(date);
    case "month": return startOfMonth(date);
    case "year": return startOfYear(date);
  }
}

/** Returns a "yyyy-MM-dd" key — parseISO-compatible, always unique per period. */
function periodKey(view: CalendarView, date: Date): string {
  switch (view) {
    case "day": return format(startOfDay(date), "yyyy-MM-dd");
    case "week": return format(startOfWeek(date), "yyyy-MM-dd");
    case "month": return format(startOfMonth(date), "yyyy-MM-dd");
    case "year": return format(startOfYear(date), "yyyy-MM-dd");
  }
}

function nextPeriod(view: CalendarView, date: Date): Date {
  switch (view) {
    case "day": return startOfDay(addDays(date, 1));
    case "week": return startOfWeek(addWeeks(date, 1));
    case "month": return startOfMonth(addMonths(date, 1));
    case "year": return startOfYear(addYears(date, 1));
  }
}

function prevPeriod(view: CalendarView, date: Date): Date {
  switch (view) {
    case "day": return startOfDay(addDays(date, -1));
    case "week": return startOfWeek(addWeeks(date, -1));
    case "month": return startOfMonth(addMonths(date, -1));
    case "year": return startOfYear(addYears(date, -1));
  }
}

function periodFetchStart(view: CalendarView, date: Date): string {
  switch (view) {
    case "day": return startOfDay(date).toISOString();
    case "week": return startOfWeek(date).toISOString();
    case "month": return startOfWeek(startOfMonth(date)).toISOString();
    case "year": return startOfYear(date).toISOString();
  }
}

function periodFetchEnd(view: CalendarView, date: Date): string {
  switch (view) {
    case "day": return endOfDay(date).toISOString();
    case "week": return endOfWeek(date).toISOString();
    case "month": return endOfWeek(endOfMonth(date)).toISOString();
    case "year": return endOfYear(date).toISOString();
  }
}

// ---------------------------------------------------------------------------

interface CalendarContentProps {
  initialEvents?: CalendarEvent[];
}

export default function CalendarContent({ initialEvents }: CalendarContentProps) {
  const [view, setView] = useState<CalendarView>("month");

  // currentDate is the period currently visible in the scroll area.
  // Updated both by the header nav buttons (via scrollToDate) and by the
  // InfiniteCalendarScroll's onVisibleDateChange callback.
  const [currentDate, setCurrentDate] = useState(() => normalizePeriod("month", new Date()));

  const [modal, setModal] = useState<ModalState>({ open: false });
  const [countdownModal, setCountdownModal] = useState<CountdownModalState>({ open: false });

  const [selectedCalendarId, setSelectedCalendarId] = useState<
    string | null | undefined
  >(undefined);

  const { calendars } = useCalendars();
  const effectiveCalendarId =
    selectedCalendarId === undefined
      ? (calendars[0]?.id ?? null)
      : selectedCalendarId;

  // Fetch range covers all periods currently rendered in the infinite scroll.
  // Starts as the initial 3-period window, then expands as the user scrolls.
  const [fetchRange, setFetchRange] = useState(() => {
    const now = normalizePeriod("month", new Date());
    return {
      start: periodFetchStart("month", prevPeriod("month", now)),
      end: periodFetchEnd("month", nextPeriod("month", now)),
    };
  });

  const calendarEvents = useCalendarEvents({
    start: fetchRange.start,
    end: fetchRange.end,
    calendarId: effectiveCalendarId,
    initialEvents,
  });

  const {
    countdowns,
    createCountdown,
    isCreating: isCreatingCountdown,
    updateCountdown,
    isUpdating: isUpdatingCountdown,
    deleteCountdown,
    isDeleting: isDeletingCountdown,
  } = useCountdowns();

  const visibleEvents = useMemo(
    () => calendarEvents.events,
    [calendarEvents.events],
  );

  // Ref to the InfiniteCalendarScroll for imperative scrollToDate calls.
  const infiniteRef = useRef<InfiniteCalendarScrollHandle>(null);

  // ---------------------------------------------------------------------------
  // Period callbacks — stable per view (useCallback captures view in deps).
  // ---------------------------------------------------------------------------

  const getNextPeriod = useCallback(
    (date: Date) => nextPeriod(view, date),
    [view],
  );
  const getPrevPeriod = useCallback(
    (date: Date) => prevPeriod(view, date),
    [view],
  );
  const getPeriodKey = useCallback(
    (date: Date) => periodKey(view, date),
    [view],
  );

  const handlePeriodsChange = useCallback(
    (periods: Date[]) => {
      if (periods.length === 0) return;
      setFetchRange({
        start: periodFetchStart(view, periods[0]),
        end: periodFetchEnd(view, periods[periods.length - 1]),
      });
    },
    [view],
  );

  // ---------------------------------------------------------------------------
  // Navigation — scroll to the adjacent period instead of paginating.
  // ---------------------------------------------------------------------------

  function handleNavigate(dir: -1 | 1) {
    const target = dir > 0
      ? nextPeriod(view, currentDate)
      : prevPeriod(view, currentDate);
    infiniteRef.current?.scrollToDate(target);
  }

  function handleToday() {
    infiniteRef.current?.scrollToDate(normalizePeriod(view, new Date()));
  }

  const handleViewChange = useCallback((newView: CalendarView) => {
    const normalized = normalizePeriod(newView, currentDate);
    setCurrentDate(normalized);
    setView(newView);
    // The key={view} on InfiniteCalendarScroll causes it to remount with the new initialDate.
  }, [currentDate]);

  const handleMonthClick = useCallback((date: Date) => {
    setCurrentDate(normalizePeriod("month", date));
    setView("month");
  }, []);

  // ---------------------------------------------------------------------------
  // Modal handlers
  // ---------------------------------------------------------------------------

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

  async function handleCountdownSave(data: Omit<Countdown, "id" | "createdAt">) {
    if (countdownModal.open && countdownModal.editingCountdown) {
      await updateCountdown(countdownModal.editingCountdown.id, data);
    } else {
      await createCountdown(data);
    }
  }

  async function handleCountdownDelete(id: string) {
    await deleteCountdown(id);
  }

  // ---------------------------------------------------------------------------
  // Render period — the view-specific content for one period in the scroll list.
  // ---------------------------------------------------------------------------

  const renderPeriod = useCallback(
    (date: Date) => {
      switch (view) {
        case "day":
          return (
            <DayView
              currentDate={date}
              events={visibleEvents}
              countdowns={countdowns}
              onSlotClick={openCreateModal}
              onChipClick={openEditModal}
              onCountdownClick={openCountdownModal}
            />
          );
        case "week":
          return (
            <WeekView
              currentDate={date}
              events={visibleEvents}
              countdowns={countdowns}
              onSlotClick={openCreateModal}
              onChipClick={openEditModal}
              onCountdownClick={openCountdownModal}
            />
          );
        case "month":
          return (
            <div>
              <div className="text-xs font-semibold text-muted/60 uppercase tracking-widest pb-2">
                {format(date, "MMMM yyyy")}
              </div>
              <CalendarGrid
                currentDate={date}
                events={visibleEvents}
                countdowns={countdowns}
                onDayClick={openCreateModal}
                onChipClick={openEditModal}
                onCountdownClick={openCountdownModal}
              />
            </div>
          );
        case "year":
          return (
            <div>
              <div className="text-xs font-semibold text-muted/60 uppercase tracking-widest pb-2">
                {format(date, "yyyy")}
              </div>
              <YearView
                currentDate={date}
                events={visibleEvents}
                countdowns={countdowns}
                onMonthClick={handleMonthClick}
              />
            </div>
          );
      }
    },
    [
      view,
      visibleEvents,
      countdowns,
      openCreateModal,
      openEditModal,
      openCountdownModal,
      handleMonthClick,
    ],
  );

  // Initial date for the scroll container — normalized to the period start for the current view.
  const initialDate = useMemo(
    () => normalizePeriod(view, currentDate),
    // Only recompute when view changes (not on scroll-driven currentDate updates).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [view],
  );

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-8">
      <CalendarHeader
        currentDate={currentDate}
        view={view}
        onNavigate={handleNavigate}
        onViewChange={handleViewChange}
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

      <div className={calendarEvents.loading ? "opacity-60 pointer-events-none" : ""}>
        <InfiniteCalendarScroll
          // key forces a remount (and list reset) when the view changes.
          key={view}
          ref={infiniteRef}
          initialDate={initialDate}
          getNextPeriod={getNextPeriod}
          getPrevPeriod={getPrevPeriod}
          getPeriodKey={getPeriodKey}
          renderPeriod={renderPeriod}
          onVisibleDateChange={setCurrentDate}
          onPeriodsChange={handlePeriodsChange}
          containerHeight="calc(100dvh - 210px)"
        />
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
          defaultCalendarId={effectiveCalendarId}
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
