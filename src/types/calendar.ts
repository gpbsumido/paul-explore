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

export type EventCard = {
  id: string;
  eventId: string;
  cardId: string;
  cardName: string;
  cardSetId?: string;
  cardSetName?: string;
  cardImageUrl?: string;
  quantity: number;
  notes?: string;
  createdAt: string;
};

/**
 * A card entry that may be staged locally (pending) or already persisted.
 * The `pending` flag is set to true for cards added in the current session
 * that haven't been written to the backend yet.
 */
export type DraftCard = EventCard & { pending?: true };

/** Filters for the event search/list page. All fields optional — omit to skip that filter. */
export type EventSearchFilters = {
  start?: string;
  end?: string;
  cardName?: string;
};

export type ModalState =
  | { open: false }
  | { open: true; initialDate: Date; editingEvent?: CalendarEvent };

/** A named date you want to count down to (or up from, if it's passed). */
export type Countdown = {
  id: string;
  title: string;
  description?: string;
  /** ISO date string, "YYYY-MM-DD". No time component, no timezone. */
  targetDate: string;
  color: string;
  createdAt: string;
};

export type CountdownModalState =
  | { open: false }
  | { open: true; editingCountdown?: Countdown };

/** Computed geometry for one event in the day/week time grid after overlap resolution. */
export type EventLayout = {
  ev: CalendarEvent;
  topPx: number;
  heightPx: number;
  /** 0-based column index within the concurrent event group. */
  column: number;
  /** Total columns in this event's overlap group — used to compute width. */
  totalColumns: number;
};
