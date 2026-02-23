"use client";

import { useState, useMemo } from "react";
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
import DayView from "@/components/calendar/DayView";
import WeekView from "@/components/calendar/WeekView";
import YearView from "@/components/calendar/YearView";
import EventModal from "@/components/calendar/EventModal";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import type { CalendarView, CalendarEvent, ModalState } from "@/types/calendar";

export default function CalendarContent() {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [view, setView] = useState<CalendarView>("month");
  const [modal, setModal] = useState<ModalState>({ open: false });

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

  const calendarEvents = useCalendarEvents({ start, end });

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

  // navigate to month view from year view if clicking month
  function handleMonthClick(date: Date) {
    setCurrentDate(date);
    setView("month");
  }

  function openCreateModal(date: Date) {
    setModal({ open: true, initialDate: date });
  }

  function openEditModal(event: CalendarEvent) {
    setModal({
      open: true,
      initialDate: parseISO(event.startDate),
      editingEvent: event,
    });
  }

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

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
      <CalendarHeader
        currentDate={currentDate}
        view={view}
        onNavigate={handleNavigate}
        onViewChange={setView}
        onToday={handleToday}
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
            events={calendarEvents.events}
            onSlotClick={openCreateModal}
            onChipClick={openEditModal}
          />
        )}
        {view === "week" && (
          <WeekView
            currentDate={currentDate}
            events={calendarEvents.events}
            onSlotClick={openCreateModal}
            onChipClick={openEditModal}
          />
        )}
        {view === "month" && (
          <CalendarGrid
            currentDate={currentDate}
            events={calendarEvents.events}
            onDayClick={openCreateModal}
            onChipClick={openEditModal}
          />
        )}
        {view === "year" && (
          <YearView currentDate={currentDate} onMonthClick={handleMonthClick} />
        )}
      </div>

      {modal.open && (
        <EventModal
          initialDate={modal.initialDate}
          event={modal.editingEvent}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setModal({ open: false })}
        />
      )}
    </div>
  );
}
