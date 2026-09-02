import { z } from "zod";

/**
 * The shape of the public Updates feature: curated changelog entries and the
 * public tickets that feed it. Schemas live here (the trust boundary is the
 * data files and, for tickets, whatever a browser has stored), and the rest of
 * the feature derives its types from them so there is one source of truth.
 */

/** The kind of change an update describes. Colour and label key off this. */
export const UPDATE_CATEGORIES = [
  "feature",
  "improvement",
  "fix",
  "experiment",
] as const;

export const updateCategorySchema = z.enum(UPDATE_CATEGORIES);
export type UpdateCategory = z.infer<typeof updateCategorySchema>;

/** A single public changelog entry, written for a reader rather than a diff. */
export const updateEntrySchema = z.object({
  /** Stable slug, also the `#entry-<id>` anchor. */
  id: z.string().min(1),
  /** ISO date, YYYY-MM-DD, so it both sorts and reads. */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  /** The app version this shipped in. */
  version: z.string().min(1),
  category: updateCategorySchema,
  tags: z.array(z.string().min(1)),
  title: z.string().min(1),
  /** One-line lead shown collapsed. */
  summary: z.string().min(1),
  /** The expanded body, as paragraphs. */
  body: z.array(z.string().min(1)).min(1),
  /** Tickets this entry closed. Each must point back (checked by a test). */
  resolvedTicketIds: z.array(z.string().min(1)).default([]),
});

export type UpdateEntry = z.infer<typeof updateEntrySchema>;

/** A public ticket is either an ask or a bug report. */
export const TICKET_TYPES = ["feature", "bug"] as const;
export const ticketTypeSchema = z.enum(TICKET_TYPES);
export type TicketType = z.infer<typeof ticketTypeSchema>;

/** The lifecycle a ticket moves through, in board-column order. */
export const TICKET_STATUSES = [
  "open",
  "planned",
  "in_progress",
  "shipped",
] as const;
export const ticketStatusSchema = z.enum(TICKET_STATUSES);
export type TicketStatus = z.infer<typeof ticketStatusSchema>;

export const ticketSchema = z.object({
  id: z.string().min(1),
  type: ticketTypeSchema,
  status: ticketStatusSchema,
  title: z.string().min(1),
  body: z.string().min(1),
  votes: z.number().int().nonnegative(),
  /** ISO timestamp, used for the "newest" sort. */
  createdAt: z.string().min(1),
  /** Set only on a shipped ticket: the entry that closed it. */
  resolvedByEntryId: z.string().min(1).optional(),
});

export type Ticket = z.infer<typeof ticketSchema>;

/** Human labels for each status column, keyed by the status value. */
export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Open",
  planned: "Planned",
  in_progress: "In progress",
  shipped: "Shipped",
};

/** Human labels for each category, used on filter chips and badges. */
export const UPDATE_CATEGORY_LABELS: Record<UpdateCategory, string> = {
  feature: "Feature",
  improvement: "Improvement",
  fix: "Fix",
  experiment: "Experiment",
};
