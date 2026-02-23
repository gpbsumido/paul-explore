"use client";

import { useState } from "react";
import { addDays, addWeeks, addMonths, addYears, parseISO } from "date-fns";
import CalendarHeader from "@/components/calendar/CalendarHeader";
import CalendarGrid from "@/components/calendar/CalendarGrid";
import DayView from "@/components/calendar/DayView";
import WeekView from "@/components/calendar/WeekView";
import YearView from "@/components/calendar/YearView";
import EventModal from "@/components/calendar/EventModal";
import type { CalendarView, CalendarEvent, ModalState } from "@/types/calendar";

export default function CalendarContent() {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [view, setView] = useState<CalendarView>("month");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [modal, setModal] = useState<ModalState>({ open: false });

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
    setModal({ open: true, initialDate: parseISO(event.startDate), editingEvent: event });
  }

  function handleSave(event: CalendarEvent) {
    setEvents((prev) => {
      const idx = prev.findIndex((e) => e.id === event.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = event;
        return next;
      }
      return [...prev, event];
    });
  }

  function handleDelete(id: string) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
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

      {view === "day" && (
        <DayView
          currentDate={currentDate}
          events={events}
          onSlotClick={openCreateModal}
          onChipClick={openEditModal}
        />
      )}
      {view === "week" && (
        <WeekView
          currentDate={currentDate}
          events={events}
          onSlotClick={openCreateModal}
          onChipClick={openEditModal}
        />
      )}
      {view === "month" && (
        <CalendarGrid
          currentDate={currentDate}
          events={events}
          onDayClick={openCreateModal}
          onChipClick={openEditModal}
        />
      )}
      {view === "year" && (
        <YearView currentDate={currentDate} onMonthClick={handleMonthClick} />
      )}

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
