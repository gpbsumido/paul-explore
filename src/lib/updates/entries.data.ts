import type { UpdateEntry } from "./types";

/**
 * The public changelog, curated for a reader.
 *
 * This is deliberately not a parse of the internal CHANGELOG.md — that file is
 * written for me, in the voice of a diff, and there are hundreds of entries.
 * This is the newsletter version: the handful of things worth telling a visitor
 * about, in plain language, newest first. When one closed a public ticket, it
 * lists the ticket id and the board links back.
 */
export const UPDATE_ENTRIES: UpdateEntry[] = [
  {
    id: "e-zeroproof-board-horizon",
    date: "2026-09-03",
    version: "5.23.0",
    category: "feature",
    tags: ["zeroproof"],
    title: "ZeroProof goes live, and the board opens on the next few days",
    summary:
      "Real football lines feed the lobby now, and the board shows the next three days by default — with a load-more, an auto-load-on-scroll toggle, and a collapse back.",
    body: [
      "The events board is fed by real odds now: they're pulled from a sportsbook data API on a schedule and stored to the database, so the lobby shows live lines with no vendor call riding on the page.",
      "Football is a weekly slate, so rather than a wall of games a week out, the board opens on the next three days. Load more adds three days at a time, a toggle switches to loading automatically as you scroll, and you can collapse back to three whenever you want — a filter over the list the page already has, so widening the window costs no fetch.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-zeroproof-lobby",
    date: "2026-09-03",
    version: "5.22.0",
    category: "feature",
    tags: ["zeroproof"],
    title: "ZeroProof: a no-loss sportsbook, now with a lobby",
    summary:
      "The public events board is live — real lines over a real double-entry ledger, with the dollars simulated on purpose.",
    body: [
      "ZeroProof is sports betting with the loss taken out: you lock a deposit for a term, bet it freely on real lines, and get the original deposit back at the end no matter your record — what you keep forever is the record itself. The ledger is real from the first row; the money is a button.",
      "This first slice of the front end is read-only: a lobby that shows the upcoming events board with the latest moneyline, spread and total lines, served straight from the database. The bet slip, the profile and the leaderboards come next, built on the same slate. The write-up explains why it was built ledger-first.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-ai-components",
    date: "2026-09-02",
    version: "5.21.0",
    category: "feature",
    tags: ["design-system", "a11y"],
    title: "Ten AI-app components join the design system gallery",
    summary:
      "A chat composer, streaming text, a command palette, a token meter and more — live in the showcase.",
    body: [
      "The shared component library grew a set of pieces aimed at AI surfaces: a chat composer and message bubble, text that streams in the way a model replies, a typing indicator, a code block with a copy button, a filterable combobox, a ⌘K command palette, a small rich-text editor, a toast stack, and a token-usage meter.",
      "Every one is now rendered live on the design-system page from the real published package, with its accessibility guarantees spelled out on the card — labelled controls, live regions for the streaming and typing pieces, and progressbar semantics on the meter. The gallery documents the whole package or the build goes red, so these couldn't be added quietly.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-tcg-catalog",
    date: "2026-08-31",
    version: "5.19.0",
    category: "fix",
    tags: ["tcg", "reliability"],
    title: "Pokémon sets load from our own catalog now",
    summary:
      "The set lists stopped depending on a third party that had quietly gone dark.",
    body: [
      "The Pokémon set and Pocket pages used to fetch a public card API at render time. When that service pointed its North-American traffic at a dead node, the pages didn't error loudly — they rendered empty and got cached that way for a day, so the lists looked abandoned when nothing was actually wrong.",
      "They now read from a catalog this site mirrors itself, and an empty list is told apart from a failed read: one says the catalog hasn't been built yet, the other says the read failed. Nothing in a production build calls a third party for these pages any more.",
    ],
    resolvedTicketIds: ["t-pocket-unavailable"],
  },
  {
    id: "e-check-in",
    date: "2026-08-30",
    version: "5.18.0",
    category: "feature",
    tags: ["events", "auth"],
    title: "Volunteer arrival check-in",
    summary:
      "Confirm someone actually turned up to a shift, without any hardware.",
    body: [
      "A display at the entrance shows a six-digit code that rotates every two minutes. A volunteer opens a link on their phone, signs in, and types the code, and the arrival is recorded against their real account rather than a name they typed into a box.",
      "The code is derived from the time window rather than stored, so nothing on this side ever holds a working code. The NFC-tap version was dropped on purpose: it works in Chrome on Android and not at all in Safari on iOS, so a tap would have silently failed for every iPhone.",
    ],
    resolvedTicketIds: ["t-attendance-proof"],
  },
  {
    id: "e-command-palette",
    date: "2026-08-10",
    version: "5.12.0",
    category: "feature",
    tags: ["navigation", "a11y"],
    title: "Jump anywhere with ⌘K",
    summary:
      "A command palette that fuzzy-searches every page, dev note, and action.",
    body: [
      "Hitting ⌘K (or Ctrl+K) opens a search box over whatever you're on. It matches every route, every write-up, and a set of actions, ranks them with a hand-rolled fuzzy matcher, and groups the results.",
      "It's a proper ARIA combobox: full keyboard navigation, screen-reader announcements for the result count, and focus returned to where you were when it closes.",
    ],
    resolvedTicketIds: ["t-global-search"],
  },
  {
    id: "e-operator",
    date: "2026-07-28",
    version: "5.6.0",
    category: "feature",
    tags: ["dashboard", "data"],
    title: "An operator dashboard for micro-retail",
    summary:
      "Fleet management for smart, unstaffed stores: polling, freshness, and charts.",
    body: [
      "A reconstruction of a real operations surface — a fleet of self-serve stores, each with stock, sales, and health. It polls at tiered intervals depending on how fresh a value needs to be, shows optimistic updates when you act, and sorts by severity so the store on fire is at the top.",
      "It's also where the charting story got worked out, and several of the dashboard's own write-ups live under it.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-design-system",
    date: "2026-07-12",
    version: "5.2.0",
    category: "feature",
    tags: ["design-system", "docs"],
    title: "A live gallery for the design system",
    summary:
      "Every shared primitive rendered interactively, with a props playground.",
    body: [
      "The shared component library now has a Storybook-style page: each primitive rendered live, a props playground that generates the code for what you configure, a token gallery, and a link to where each component actually ships.",
      "It's driven from a catalog with an integrity test, so a component that's added without an example, or an example that points at a dead usage, fails a build rather than rotting quietly.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-draft-lab",
    date: "2026-08-25",
    version: "5.16.0",
    category: "feature",
    tags: ["fantasy", "tools"],
    title: "Draft Lab, a fantasy-draft companion",
    summary:
      "Live recommendations, tiers, and a post-draft grade for every pick.",
    body: [
      "A companion for a live fantasy draft: it projects points, cuts players into tiers, and recommends who to take given who's left and what your roster still needs. After the draft it grades each pick by how much it improved your startable lineup versus what was on the board at that moment.",
      "It reconstructs the room from the league's own API so it works for any pool, and it keeps its data in the browser with file round-trips so a reload can't wipe a league setup.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-v5-landing",
    date: "2026-07-24",
    version: "5.0.0",
    category: "improvement",
    tags: ["landing", "design"],
    title: "A landing page that makes the case",
    summary:
      "The home page is now an argument for hiring a lead front-end developer.",
    body: [
      "The root of the site was rebuilt around a single job: making the case for a front-end lead. An asymmetric hero with a code-built 3D object, a proof strip of real counts, the craft traits each backed by a real page, and a bento of everything else.",
      "The older landing pages didn't disappear — they moved to an archive you can still browse, each behind a banner saying which version it was.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-world",
    date: "2026-07-28",
    version: "5.5.0",
    category: "experiment",
    tags: ["3d", "game"],
    title: "Explore Toronto in 3D",
    summary:
      "Walk a low-poly downtown Toronto like an RPG to reach the rest of the site.",
    body: [
      "A playable, low-poly downtown Toronto. You steer an explorer with the keyboard or an on-screen joystick past the CN Tower and City Hall to glowing exhibits, each of which opens a real feature of the site.",
      "The game core was built test-first, which is unusual for a 3D toy, and it respects reduced-motion and cleans up its canvas properly when you leave.",
    ],
    resolvedTicketIds: [],
  },
  {
    id: "e-vitals-alerts",
    date: "2026-08-05",
    version: "5.10.0",
    category: "improvement",
    tags: ["performance", "monitoring"],
    title: "Real-user performance now raises alerts",
    summary:
      "The vitals dashboard went from a chart you read to a thing that tells you.",
    body: [
      "Real-user Core Web Vitals were already collected and charted. They now feed an alert layer: when a metric slips past its budget across enough real sessions, that's surfaced rather than left for someone to notice on a graph.",
      "The honest-failure work came with it — a degraded read no longer renders as a healthy-looking empty state.",
    ],
    resolvedTicketIds: [],
  },
];
