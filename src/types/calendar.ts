export type CalendarView = "day" | "week" | "month" | "year";

export type CalendarEvent = {
  id: string;
  title: string;
  description?: string;
  startDate: string; // ISO string, local datetime
  endDate: string;
  color: string;
  allDay: boolean;
};

export type ModalState =
  | { open: false }
  | { open: true; initialDate: Date; editingEvent?: CalendarEvent };
