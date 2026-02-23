"use client";

import { useState } from "react";
import { addDays, addWeeks, addMonths, addYears } from "date-fns";
import CalendarHeader from "@/components/calendar/CalendarHeader";
import CalendarGrid from "@/components/calendar/CalendarGrid";
import DayView from "@/components/calendar/DayView";
import WeekView from "@/components/calendar/WeekView";
import YearView from "@/components/calendar/YearView";
import type { CalendarView } from "@/types/calendar";

export default function CalendarContent() {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [view, setView] = useState<CalendarView>("month");

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
        <DayView currentDate={currentDate} onSlotClick={() => {}} />
      )}
      {view === "week" && (
        <WeekView currentDate={currentDate} onSlotClick={() => {}} />
      )}
      {view === "month" && (
        <CalendarGrid currentDate={currentDate} onDayClick={() => {}} />
      )}
      {view === "year" && (
        <YearView currentDate={currentDate} onMonthClick={handleMonthClick} />
      )}
    </div>
  );
}
