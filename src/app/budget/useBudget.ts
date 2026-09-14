"use client";

import { useCallback, useSyncExternalStore } from "react";
import { STARTER_BUDGET } from "@/lib/budget/categories.data";
import type { Budget } from "@/lib/budget/types";
import {
  loadBudget,
  addExpense,
  addPerson,
  setActivePerson,
  setCycleStartDay,
  joinBudget,
  setVisibility,
  requestToJoin,
  approveJoinRequest,
  denyJoinRequest,
  type NewExpense,
  type JoinRequestInput,
} from "@/lib/budget/budgetStore";

/**
 * An external store over localStorage for the budget, mirroring useTicketBoard:
 * the pure reducers live in budgetStore.ts, and this wires them to React
 * through useSyncExternalStore rather than a setState-in-effect.
 *
 * The snapshot must be referentially stable between reads or useSyncExternalStore
 * re-renders forever, so the loaded budget is cached and only replaced when a
 * reducer writes. The server snapshot is the starter budget, which is what the
 * first client paint matches before it reads the browser's own data.
 */
const SERVER_STATE: Budget = STARTER_BUDGET;

let cache: Budget | null = null;
const listeners = new Set<() => void>();

function getSnapshot(): Budget {
  if (typeof window === "undefined") return SERVER_STATE;
  cache ??= loadBudget(window.localStorage);
  return cache;
}

const getServerSnapshot = (): Budget => SERVER_STATE;

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function commit(next: Budget): void {
  cache = next;
  listeners.forEach((l) => l());
}

/** Drop the cached snapshot. For tests and HMR, so a fresh store is read next. */
export function resetBudgetStore(): void {
  cache = null;
}

/** The budget plus the actions that mutate it, backed by localStorage. */
export function useBudget() {
  const budget = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const add = useCallback(
    (input: NewExpense) => commit(addExpense(input, window.localStorage)),
    [],
  );
  const addPersonNamed = useCallback(
    (name: string) => commit(addPerson(name, window.localStorage)),
    [],
  );
  const selectPerson = useCallback(
    (personId: string) => commit(setActivePerson(personId, window.localStorage)),
    [],
  );
  const setCycleDay = useCallback(
    (day: number) => commit(setCycleStartDay(day, window.localStorage)),
    [],
  );
  const join = useCallback(
    (token: string, name: string) =>
      commit(joinBudget(token, name, window.localStorage)),
    [],
  );
  const setVisible = useCallback(
    (visibility: Budget["visibility"], ownerEmail?: string) =>
      commit(setVisibility(visibility, window.localStorage, { ownerEmail })),
    [],
  );
  const requestJoin = useCallback(
    (input: JoinRequestInput) => commit(requestToJoin(input, window.localStorage)),
    [],
  );
  const approveRequest = useCallback(
    (id: string) => commit(approveJoinRequest(id, window.localStorage)),
    [],
  );
  const denyRequest = useCallback(
    (id: string) => commit(denyJoinRequest(id, window.localStorage)),
    [],
  );

  return {
    budget,
    add,
    addPersonNamed,
    selectPerson,
    setCycleDay,
    join,
    setVisible,
    requestJoin,
    approveRequest,
    denyRequest,
  };
}
