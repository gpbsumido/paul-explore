import type { Ticket } from "./types";

/**
 * Seed tickets for the public board.
 *
 * These stand in for real requests: some already shipped (and link to the
 * update that closed them), some are planned or in progress, some are still
 * open for votes. A visitor's own submissions and upvotes are layered on top of
 * these in their browser — see ticketStore.ts. The cross-links to entries are
 * checked in both directions by data.test.ts.
 */
export const SEED_TICKETS: Ticket[] = [
  {
    id: "t-global-search",
    type: "feature",
    status: "shipped",
    title: "A keyboard shortcut to jump anywhere",
    body: "Navigating by clicking through the hub is slow once you know where you're going. A search-as-you-type overlay would be faster.",
    votes: 21,
    createdAt: "2026-07-30T09:00:00.000Z",
    resolvedByEntryId: "e-command-palette",
  },
  {
    id: "t-pocket-unavailable",
    type: "bug",
    status: "shipped",
    title: "Pocket sets page says everything is unavailable",
    body: "The Pokémon Pocket sets page shows an 'unavailable right now' message even though the sets clearly exist.",
    votes: 14,
    createdAt: "2026-08-20T14:30:00.000Z",
    resolvedByEntryId: "e-tcg-catalog",
  },
  {
    id: "t-attendance-proof",
    type: "feature",
    status: "shipped",
    title: "Prove a volunteer actually showed up",
    body: "For events, a way to confirm someone turned up in person, without buying scanners or badges.",
    votes: 9,
    createdAt: "2026-08-01T11:15:00.000Z",
    resolvedByEntryId: "e-check-in",
  },
  {
    id: "t-card-trade",
    type: "feature",
    status: "in_progress",
    title: "Trade cards between two collections",
    body: "Let two people propose and accept a swap of cards from their collections, with both sides confirming.",
    votes: 15,
    createdAt: "2026-08-18T16:45:00.000Z",
  },
  {
    id: "t-operator-csv",
    type: "feature",
    status: "in_progress",
    title: "Download operator reports as a spreadsheet",
    body: "The operator dashboard charts are great on screen, but finance wants the same numbers as a CSV to work with offline.",
    votes: 8,
    createdAt: "2026-08-12T10:05:00.000Z",
  },
  {
    id: "t-ical-export",
    type: "feature",
    status: "planned",
    title: "Export a calendar to iCal",
    body: "A way to take a calendar out of here and into Apple Calendar or Google Calendar as a one-off .ics file.",
    votes: 12,
    createdAt: "2026-08-14T08:20:00.000Z",
  },
  {
    id: "t-tag-filter-updates",
    type: "feature",
    status: "planned",
    title: "Filter the updates feed by tag",
    body: "Once there are a lot of updates, being able to click a tag and see only those would help.",
    votes: 5,
    createdAt: "2026-08-28T13:00:00.000Z",
  },
  {
    id: "t-dark-calendar",
    type: "feature",
    status: "open",
    title: "Darker calendar palette at night",
    body: "The calendar is a little bright in a dark room. A dimmer set of colours in dark mode would be easier on the eyes.",
    votes: 7,
    createdAt: "2026-08-26T21:40:00.000Z",
  },
  {
    id: "t-rss-feed",
    type: "feature",
    status: "open",
    title: "An RSS feed for the updates page",
    body: "I'd like to follow the changelog in a reader rather than remembering to check the page.",
    votes: 6,
    createdAt: "2026-08-29T07:10:00.000Z",
  },
  {
    id: "t-mobile-world",
    type: "bug",
    status: "open",
    title: "Joystick drifts on small phones",
    body: "In the 3D Toronto world, the on-screen joystick sometimes keeps moving the explorer after I lift my thumb on a small screen.",
    votes: 4,
    createdAt: "2026-08-22T19:25:00.000Z",
  },
];
