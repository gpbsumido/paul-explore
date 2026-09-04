import {
  TICKET_STATUSES,
  TICKET_STATUS_LABELS,
  type UpdateEntry,
  type UpdateCategory,
  type Ticket,
  type TicketType,
  type TicketStatus,
} from "./types";

/**
 * Pure search / sort / filter helpers behind the Updates feed and ticket board.
 *
 * They take arrays and return new arrays, never mutating the input, so the
 * components can hold the raw data and derive the visible slice on every
 * render. Keeping them here (rather than inline in the components) is what
 * makes the behaviour testable without a DOM.
 */

/** Lowercased haystack for an entry: everything a reader might search by. */
const entryHaystack = (entry: UpdateEntry): string =>
  [entry.title, entry.summary, ...entry.tags, ...entry.body]
    .join(" ")
    .toLowerCase();

/** Entries whose text contains the query. Empty query returns everything. */
export function searchEntries(
  entries: readonly UpdateEntry[],
  query: string,
): UpdateEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...entries];
  return entries.filter((entry) => entryHaystack(entry).includes(q));
}

/** Entries in the given category, or all of them for "all". */
export function filterEntriesByCategory(
  entries: readonly UpdateEntry[],
  category: UpdateCategory | "all",
): UpdateEntry[] {
  if (category === "all") return [...entries];
  return entries.filter((entry) => entry.category === category);
}

/**
 * Entries sorted by date. Dates are ISO (YYYY-MM-DD) so a string compare is a
 * chronological one; the sort is stable, so entries sharing a date keep their
 * authored order.
 */
export function sortEntries(
  entries: readonly UpdateEntry[],
  order: "newest" | "oldest",
): UpdateEntry[] {
  return [...entries].sort((a, b) => {
    const cmp = a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
    return order === "newest" ? -cmp : cmp;
  });
}

/** The unique tags across the entries, sorted, for a tag filter. */
export function collectTags(entries: readonly UpdateEntry[]): string[] {
  return [...new Set(entries.flatMap((entry) => entry.tags))].sort();
}

/** Lowercased haystack for a ticket. */
const ticketHaystack = (ticket: Ticket): string =>
  `${ticket.title} ${ticket.body}`.toLowerCase();

/** Tickets whose title or body contains the query. */
export function searchTickets(
  tickets: readonly Ticket[],
  query: string,
): Ticket[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...tickets];
  return tickets.filter((ticket) => ticketHaystack(ticket).includes(q));
}

/** Tickets of the given type, or all of them for "all". */
export function filterTicketsByType(
  tickets: readonly Ticket[],
  type: TicketType | "all",
): Ticket[] {
  if (type === "all") return [...tickets];
  return tickets.filter((ticket) => ticket.type === type);
}

/**
 * Tickets sorted for a list view. "top" ranks by votes and breaks ties by
 * recency; "newest" is purely by recency.
 */
export function sortTickets(
  tickets: readonly Ticket[],
  order: "top" | "newest",
): Ticket[] {
  return [...tickets].sort((a, b) => {
    if (order === "top" && b.votes !== a.votes) return b.votes - a.votes;
    return b.createdAt < a.createdAt ? -1 : b.createdAt > a.createdAt ? 1 : 0;
  });
}

/** A single board column: a status, its label, and the tickets in it. */
export type StatusColumn = {
  status: TicketStatus;
  label: string;
  tickets: Ticket[];
};

/**
 * Tickets grouped into the four status columns, always in the same order, each
 * column ranked by votes so the loudest asks sit at the top.
 */
export function ticketsByStatus(
  tickets: readonly Ticket[],
): StatusColumn[] {
  return TICKET_STATUSES.map((status) => ({
    status,
    label: TICKET_STATUS_LABELS[status],
    tickets: sortTickets(
      tickets.filter((ticket) => ticket.status === status),
      "top",
    ),
  }));
}
