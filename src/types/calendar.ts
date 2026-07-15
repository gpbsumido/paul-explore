import type { z } from "zod";
import type {
  calendarSchema,
  calendarMemberSchema,
  calendarEventSchema,
  eventCardSchema,
  countdownSchema,
  countdownPageResponseSchema,
} from "@/lib/schemas";

export type CalendarView = "day" | "week" | "month" | "year";

/** A named calendar that groups events and optionally links to a Google Calendar. */
export type Calendar = z.infer<typeof calendarSchema>;

/** A member of a shared calendar. id is null for the synthesized owner entry. */
export type CalendarMember = z.infer<typeof calendarMemberSchema>;

export type CalendarEvent = z.infer<typeof calendarEventSchema>;

export type EventCard = z.infer<typeof eventCardSchema>;

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
export type Countdown = z.infer<typeof countdownSchema>;

/** One page of countdown results as returned by the paginated list endpoint. */
export type CountdownPage = z.infer<typeof countdownPageResponseSchema>;

export type CountdownModalState =
  | { open: false }
  | { open: true; editingCountdown?: Countdown; initialDate?: Date };

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
