"use client";

import { useState } from "react";
import { addDays, addWeeks, addMonths, addYears } from "date-fns";
import CalendarHeader from "@/components/calendar/CalendarHeader";
import CalendarGrid from "@/components/calendar/CalendarGrid";
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

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
      <CalendarHeader
        currentDate={currentDate}
        view={view}
        onNavigate={handleNavigate}
        onViewChange={setView}
        onToday={handleToday}
      />

      {view === "month" && (
        <CalendarGrid currentDate={currentDate} onDayClick={() => {}} />
      )}

      {view !== "month" && (
        <div className="border border-border rounded-xl p-12 text-center text-muted">
          {view.charAt(0).toUpperCase() + view.slice(1)} view coming in the next
          step.
        </div>
      )}
    </div>
  );
}
