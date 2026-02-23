import { format, startOfWeek } from "date-fns";
import type { CalendarView } from "@/types/calendar";

export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export const VIEWS: CalendarView[] = ["day", "week", "month", "year"];

export const VIEW_LABELS: Record<CalendarView, string> = {
  day: "Day",
  week: "Week",
  month: "Month",
  year: "Year",
};

export function formatHeading(date: Date, view: CalendarView): string {
  switch (view) {
    case "day":
      return format(date, "EEEE, MMMM d, yyyy");
    case "week":
      return format(startOfWeek(date), "'Week of' MMM d, yyyy");
    case "month":
      return format(date, "MMMM yyyy");
    case "year":
      return format(date, "yyyy");
  }
}
