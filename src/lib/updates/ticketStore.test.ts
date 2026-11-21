import { describe, it, expect, vi } from "vitest";
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

describe("a browser's stored data can't be trusted", () => {
  const SUBMITTED_KEY = "paul-explore:updates:submitted:v1";
  const VOTES_KEY = "paul-explore:updates:votes:v1";
  const seeds = [seed({ id: "a", votes: 3 })];

  it.each([
    ["unparseable text", "{not json"],
    ["something that isn't a list", JSON.stringify({ id: "x" })],
  ])("falls back to the seeds when the submissions are %s", (_label, stored) => {
    const storage = makeStorage();
    storage.setItem(SUBMITTED_KEY, stored);

    expect(loadTickets(seeds, storage).tickets.map((t) => t.id)).toEqual(["a"]);
  });

  it("drops a stored submission that doesn't match the ticket schema, keeping the good ones", () => {
    const storage = makeStorage();
    const good = seed({ id: "u-good", title: "Kept" });
    storage.setItem(SUBMITTED_KEY, JSON.stringify([{ id: "u-bad", title: "" }, good]));

    expect(loadTickets(seeds, storage).tickets.map((t) => t.id)).toEqual(["u-good", "a"]);
  });

  it("ignores stored votes that aren't ids", () => {
    const storage = makeStorage();
    storage.setItem(VOTES_KEY, JSON.stringify([42, null, "a"]));

    const { tickets, votedIds } = loadTickets(seeds, storage);

    expect(votedIds).toEqual(["a"]);
    expect(tickets[0].votes).toBe(4);
  });

  it("still hands back the right board for this session when storage refuses a write", () => {
    const storage = makeStorage();
    vi.spyOn(storage, "setItem").mockImplementation(() => {
      throw new DOMException("quota exceeded", "QuotaExceededError");
    });

    const { tickets, votedIds } = toggleVote("a", seeds, storage);

    // Nothing was saved, so the reload shows the seeds untouched; the call must
    // not throw into the click handler.
    expect(votedIds).toEqual([]);
    expect(tickets[0].votes).toBe(3);
  });
});

describe("submitting and voting together", () => {
  it("keeps a visitor's earlier submissions when they add another, newest first", () => {
    const seeds = [seed({ id: "a" })];
    const storage = makeStorage();
    addTicket({ type: "feature", title: "First", body: "one" }, seeds, storage, { id: "u-1" });

    const { tickets } = addTicket({ type: "bug", title: "Second", body: "two" }, seeds, storage, {
      id: "u-2",
    });

    expect(tickets.map((t) => t.id)).toEqual(["u-2", "u-1", "a"]);
  });

  it("lets a visitor upvote their own submission", () => {
    const seeds = [seed({ id: "a" })];
    const storage = makeStorage();
    addTicket({ type: "feature", title: "Mine", body: "detail" }, seeds, storage, { id: "u-1" });

    const { tickets } = toggleVote("u-1", seeds, storage);

    expect(tickets.find((t) => t.id === "u-1")?.votes).toBe(1);
  });

  it("generates a u- prefixed id, so a submission can't collide with a seed", () => {
    const { tickets } = addTicket(
      { type: "feature", title: "Mine", body: "detail" },
      [seed({ id: "a" })],
      makeStorage(),
    );

    expect(tickets[0].id).toMatch(/^u-/);
  });
});
