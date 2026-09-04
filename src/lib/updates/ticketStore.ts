import { ticketSchema, type Ticket, type TicketType } from "./types";

/**
 * A tiny persistence layer for the public ticket board.
 *
 * There is no server behind this on purpose (see the write-up): a visitor's
 * suggestions and upvotes live in their own browser. Two keys hold the delta on
 * top of the seed data — the tickets they submitted, and the ids they upvoted —
 * and every read recomputes the merged list, so the seeds are never copied into
 * storage and can change underneath a returning visitor without conflict.
 *
 * Storage is passed in rather than reached for, so the logic is testable
 * against an in-memory stand-in and safe to call from a component that guards
 * for the browser.
 */

const SUBMITTED_KEY = "paul-explore:updates:submitted:v1";
const VOTES_KEY = "paul-explore:updates:votes:v1";

/** Just the bits of Storage this module needs. */
export type StorageLike = Pick<Storage, "getItem" | "setItem">;

/** The merged view the board renders: tickets plus which ids the visitor upvoted. */
export type TicketState = {
  tickets: Ticket[];
  votedIds: string[];
};

/** Read a JSON array from storage, tolerating absent or corrupt values. */
function readArray<T>(storage: StorageLike, key: string, parse: (v: unknown) => T | null): T[] {
  try {
    const raw = storage.getItem(key);
    if (!raw) return [];
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value.map(parse).filter((v): v is T => v !== null);
  } catch {
    return [];
  }
}

const readSubmitted = (storage: StorageLike): Ticket[] =>
  readArray(storage, SUBMITTED_KEY, (v) => {
    const parsed = ticketSchema.safeParse(v);
    return parsed.success ? parsed.data : null;
  });

const readVotes = (storage: StorageLike): string[] =>
  readArray(storage, VOTES_KEY, (v) => (typeof v === "string" ? v : null));

function write(storage: StorageLike, key: string, value: unknown): void {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // A full or blocked store just means the change doesn't persist; the
    // in-memory result the caller got back is still correct for this session.
  }
}

/**
 * The current board: submitted tickets first (so a visitor's own ask sits on
 * top of Open), then the seeds, with an upvoted ticket showing one extra vote.
 */
export function loadTickets(
  seeds: readonly Ticket[],
  storage: StorageLike,
): TicketState {
  const submitted = readSubmitted(storage);
  const votedIds = readVotes(storage);
  const voted = new Set(votedIds);
  const tickets = [...submitted, ...seeds].map((ticket) =>
    voted.has(ticket.id) ? { ...ticket, votes: ticket.votes + 1 } : ticket,
  );
  return { tickets, votedIds };
}

/** Fields a visitor supplies when suggesting something. */
export type NewTicket = { type: TicketType; title: string; body: string };

/** Deterministic overrides, so a test can pin the generated id and timestamp. */
export type AddMeta = { id?: string; createdAt?: string };

/**
 * Persist a new open ticket and return the refreshed board. The generated id is
 * prefixed `u-` so a submission can never collide with a seed id.
 */
export function addTicket(
  input: NewTicket,
  seeds: readonly Ticket[],
  storage: StorageLike,
  meta: AddMeta = {},
): TicketState {
  const submitted = readSubmitted(storage);
  const ticket: Ticket = {
    id: meta.id ?? `u-${Date.now()}-${submitted.length}`,
    type: input.type,
    status: "open",
    title: input.title.trim(),
    body: input.body.trim(),
    votes: 0,
    createdAt: meta.createdAt ?? new Date().toISOString(),
  };
  write(storage, SUBMITTED_KEY, [ticket, ...submitted]);
  return loadTickets(seeds, storage);
}

/** Toggle the visitor's upvote for a ticket and return the refreshed board. */
export function toggleVote(
  id: string,
  seeds: readonly Ticket[],
  storage: StorageLike,
): TicketState {
  const voted = new Set(readVotes(storage));
  if (voted.has(id)) voted.delete(id);
  else voted.add(id);
  write(storage, VOTES_KEY, [...voted]);
  return loadTickets(seeds, storage);
}
