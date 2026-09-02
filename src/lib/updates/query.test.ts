import { describe, it, expect } from "vitest";
import type { UpdateEntry, Ticket } from "./types";
import {
  searchEntries,
  filterEntriesByCategory,
  sortEntries,
  collectTags,
  searchTickets,
  filterTicketsByType,
  sortTickets,
  ticketsByStatus,
} from "./query";

/** A minimal valid entry; override only the fields a test cares about. */
const makeEntry = (over: Partial<UpdateEntry> = {}): UpdateEntry => ({
  id: "e-x",
  date: "2026-01-01",
  version: "1.0.0",
  category: "feature",
  tags: ["tcg"],
  title: "A title",
  summary: "A summary",
  body: ["A body paragraph."],
  resolvedTicketIds: [],
  ...over,
});

const makeTicket = (over: Partial<Ticket> = {}): Ticket => ({
  id: "t-x",
  type: "feature",
  status: "open",
  title: "A ticket",
  body: "The detail",
  votes: 0,
  createdAt: "2026-01-01T00:00:00.000Z",
  ...over,
});

describe("searchEntries", () => {
  it("returns every entry for an empty or whitespace query", () => {
    const entries = [makeEntry({ id: "a" }), makeEntry({ id: "b" })];
    expect(searchEntries(entries, "")).toHaveLength(2);
    expect(searchEntries(entries, "   ")).toHaveLength(2);
  });

  it("matches the title, summary, tags, and body, case-insensitively", () => {
    const byTitle = makeEntry({ id: "title", title: "Catalog rewrite" });
    const bySummary = makeEntry({ id: "summary", summary: "The CATALOG lists" });
    const byTag = makeEntry({ id: "tag", tags: ["catalog"] });
    const byBody = makeEntry({ id: "body", body: ["A note about the catalog."] });
    const miss = makeEntry({ id: "miss", title: "Unrelated" });
    const entries = [byTitle, bySummary, byTag, byBody, miss];

    const ids = searchEntries(entries, "catalog").map((e) => e.id);
    expect(ids).toEqual(["title", "summary", "tag", "body"]);
  });
});

describe("filterEntriesByCategory", () => {
  it("passes everything through for 'all'", () => {
    const entries = [
      makeEntry({ id: "a", category: "feature" }),
      makeEntry({ id: "b", category: "fix" }),
    ];
    expect(filterEntriesByCategory(entries, "all")).toHaveLength(2);
  });

  it("keeps only entries in the chosen category", () => {
    const entries = [
      makeEntry({ id: "a", category: "feature" }),
      makeEntry({ id: "b", category: "fix" }),
      makeEntry({ id: "c", category: "feature" }),
    ];
    expect(filterEntriesByCategory(entries, "feature").map((e) => e.id)).toEqual([
      "a",
      "c",
    ]);
  });
});

describe("sortEntries", () => {
  it("orders newest first, then oldest, without mutating the input", () => {
    const input = [
      makeEntry({ id: "mid", date: "2026-02-01" }),
      makeEntry({ id: "new", date: "2026-03-01" }),
      makeEntry({ id: "old", date: "2026-01-01" }),
    ];
    expect(sortEntries(input, "newest").map((e) => e.id)).toEqual([
      "new",
      "mid",
      "old",
    ]);
    expect(sortEntries(input, "oldest").map((e) => e.id)).toEqual([
      "old",
      "mid",
      "new",
    ]);
    // input untouched
    expect(input.map((e) => e.id)).toEqual(["mid", "new", "old"]);
  });

  it("keeps authored order for entries that share a date (stable)", () => {
    const input = [
      makeEntry({ id: "first", date: "2026-01-01" }),
      makeEntry({ id: "second", date: "2026-01-01" }),
    ];
    expect(sortEntries(input, "newest").map((e) => e.id)).toEqual([
      "first",
      "second",
    ]);
  });
});

describe("collectTags", () => {
  it("returns the unique tags across entries, sorted", () => {
    const entries = [
      makeEntry({ tags: ["tcg", "perf"] }),
      makeEntry({ tags: ["a11y", "tcg"] }),
    ];
    expect(collectTags(entries)).toEqual(["a11y", "perf", "tcg"]);
  });
});

describe("ticket queries", () => {
  it("searchTickets matches title and body, case-insensitively", () => {
    const tickets = [
      makeTicket({ id: "a", title: "Dark mode" }),
      makeTicket({ id: "b", body: "please add DARK theme" }),
      makeTicket({ id: "c", title: "Unrelated" }),
    ];
    expect(searchTickets(tickets, "dark").map((t) => t.id)).toEqual(["a", "b"]);
  });

  it("filterTicketsByType narrows to features or bugs, or all", () => {
    const tickets = [
      makeTicket({ id: "f", type: "feature" }),
      makeTicket({ id: "b", type: "bug" }),
    ];
    expect(filterTicketsByType(tickets, "bug").map((t) => t.id)).toEqual(["b"]);
    expect(filterTicketsByType(tickets, "all")).toHaveLength(2);
  });

  it("sortTickets 'top' ranks by votes then recency; 'newest' by recency", () => {
    const tickets = [
      makeTicket({ id: "old-hot", votes: 9, createdAt: "2026-01-01T00:00:00.000Z" }),
      makeTicket({ id: "new-cold", votes: 1, createdAt: "2026-03-01T00:00:00.000Z" }),
      makeTicket({ id: "new-hot", votes: 9, createdAt: "2026-02-01T00:00:00.000Z" }),
    ];
    expect(sortTickets(tickets, "top").map((t) => t.id)).toEqual([
      "new-hot",
      "old-hot",
      "new-cold",
    ]);
    expect(sortTickets(tickets, "newest").map((t) => t.id)).toEqual([
      "new-cold",
      "new-hot",
      "old-hot",
    ]);
  });
});

describe("ticketsByStatus", () => {
  it("groups tickets into the four columns in a fixed order", () => {
    const tickets = [
      makeTicket({ id: "s", status: "shipped" }),
      makeTicket({ id: "o", status: "open" }),
      makeTicket({ id: "p", status: "planned" }),
      makeTicket({ id: "i", status: "in_progress" }),
    ];
    const columns = ticketsByStatus(tickets);
    expect(columns.map((c) => c.status)).toEqual([
      "open",
      "planned",
      "in_progress",
      "shipped",
    ]);
    expect(columns.map((c) => c.label)).toEqual([
      "Open",
      "Planned",
      "In progress",
      "Shipped",
    ]);
    expect(columns[0].tickets.map((t) => t.id)).toEqual(["o"]);
    expect(columns[3].tickets.map((t) => t.id)).toEqual(["s"]);
  });

  it("orders each column by votes, highest first", () => {
    const tickets = [
      makeTicket({ id: "low", status: "open", votes: 2 }),
      makeTicket({ id: "high", status: "open", votes: 8 }),
    ];
    const open = ticketsByStatus(tickets)[0];
    expect(open.tickets.map((t) => t.id)).toEqual(["high", "low"]);
  });
});
