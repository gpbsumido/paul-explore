import { describe, it, expect } from "vitest";
import type { Ticket } from "./types";
import { loadTickets, addTicket, toggleVote } from "./ticketStore";

/** A tiny in-memory Storage stand-in, so the store never touches a real DOM. */
const makeStorage = (): Storage => {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => {
      map.set(k, String(v));
    },
    removeItem: (k) => {
      map.delete(k);
    },
    clear: () => map.clear(),
    key: (i) => [...map.keys()][i] ?? null,
    get length() {
      return map.size;
    },
  };
};

const seed = (over: Partial<Ticket> = {}): Ticket => ({
  id: "t-seed",
  type: "feature",
  status: "open",
  title: "Seeded",
  body: "A seeded ticket",
  votes: 3,
  createdAt: "2026-01-01T00:00:00.000Z",
  ...over,
});

describe("loadTickets", () => {
  it("returns the seeds untouched when storage is empty", () => {
    const seeds = [seed({ id: "a" }), seed({ id: "b" })];
    const { tickets, votedIds } = loadTickets(seeds, makeStorage());
    expect(tickets.map((t) => t.id)).toEqual(["a", "b"]);
    expect(votedIds).toEqual([]);
  });

  it("keeps every seed when merging stored submissions in front", () => {
    const seeds = [seed({ id: "a" }), seed({ id: "b" })];
    const storage = makeStorage();
    addTicket(
      { type: "feature", title: "Mine", body: "Detail" },
      seeds,
      storage,
      { id: "u-1", createdAt: "2026-05-01T00:00:00.000Z" },
    );
    const { tickets } = loadTickets(seeds, storage);
    expect(tickets.map((t) => t.id)).toEqual(["u-1", "a", "b"]);
  });
});

describe("addTicket", () => {
  it("prepends an open ticket of the chosen type and persists it", () => {
    const seeds = [seed({ id: "a" })];
    const storage = makeStorage();
    const { tickets } = addTicket(
      { type: "bug", title: "  Broken thing  ", body: "  steps  " },
      seeds,
      storage,
      { id: "u-1", createdAt: "2026-05-01T00:00:00.000Z" },
    );
    const added = tickets[0];
    expect(added.id).toBe("u-1");
    expect(added.status).toBe("open");
    expect(added.type).toBe("bug");
    expect(added.votes).toBe(0);
    expect(added.title).toBe("Broken thing");
    expect(added.body).toBe("steps");

    // survives a fresh load from the same storage
    expect(loadTickets(seeds, storage).tickets[0].id).toBe("u-1");
  });
});

describe("toggleVote", () => {
  it("adds one vote, then removes it on a second toggle, persisting each time", () => {
    const seeds = [seed({ id: "a", votes: 3 })];
    const storage = makeStorage();

    const first = toggleVote("a", seeds, storage);
    expect(first.tickets[0].votes).toBe(4);
    expect(first.votedIds).toEqual(["a"]);
    expect(loadTickets(seeds, storage).tickets[0].votes).toBe(4);

    const second = toggleVote("a", seeds, storage);
    expect(second.tickets[0].votes).toBe(3);
    expect(second.votedIds).toEqual([]);
    expect(loadTickets(seeds, storage).tickets[0].votes).toBe(3);
  });
});
