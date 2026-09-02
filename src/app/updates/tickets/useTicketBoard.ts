"use client";

import { useCallback, useSyncExternalStore } from "react";
import { SEED_TICKETS } from "@/lib/updates/tickets.data";
import {
  loadTickets,
  addTicket,
  toggleVote,
  type NewTicket,
  type TicketState,
} from "@/lib/updates/ticketStore";

/**
 * A tiny external store over localStorage for the ticket board, mirroring
 * useSourcePrefs: the pure merge/mutate logic lives in ticketStore.ts, and this
 * wires it to React through useSyncExternalStore rather than a setState-in-effect.
 *
 * The snapshot has to be referentially stable between reads or
 * useSyncExternalStore re-renders forever, so the merged state is cached and
 * only replaced when something writes. The server snapshot is the seeds, which
 * is what the first client paint matches before it reads the browser's own
 * submissions and votes.
 */
const SERVER_STATE: TicketState = { tickets: [...SEED_TICKETS], votedIds: [] };

let cache: TicketState | null = null;
const listeners = new Set<() => void>();

function getSnapshot(): TicketState {
  if (typeof window === "undefined") return SERVER_STATE;
  cache ??= loadTickets(SEED_TICKETS, window.localStorage);
  return cache;
}

const getServerSnapshot = (): TicketState => SERVER_STATE;

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function commit(next: TicketState): void {
  cache = next;
  listeners.forEach((l) => l());
}

/** Drop the cached snapshot. For tests and HMR, so a fresh store is read next. */
export function resetTicketStore(): void {
  cache = null;
}

/** The board's tickets plus the actions that mutate them, backed by localStorage. */
export function useTicketBoard() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const add = useCallback(
    (input: NewTicket) =>
      commit(addTicket(input, SEED_TICKETS, window.localStorage)),
    [],
  );

  const vote = useCallback(
    (id: string) => commit(toggleVote(id, SEED_TICKETS, window.localStorage)),
    [],
  );

  return { tickets: state.tickets, votedIds: state.votedIds, add, vote };
}
