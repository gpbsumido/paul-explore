"use client";

import { useCallback, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import * as api from "@/lib/budget/api";
import type { BudgetDto } from "@/lib/budget/api";
import type { NewExpense, ExpensePatch } from "@/lib/budget/budgetStore";

const KEY = queryKeys.budgetDetail("mine");

/**
 * The signed-in budget, backed by the server through the BFF. Mirrors the local
 * useBudget's surface so the same presentational components render either source
 * — the difference is that every action here round-trips to the API and the
 * returned budget replaces the cache. The active person is local UI state the
 * server has no opinion on.
 */
export function useServerBudget() {
  const qc = useQueryClient();
  const [activePersonId, setActivePersonId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<BudgetDto> => {
      const budgets = await api.listBudgets();
      const owned = budgets.find((b) => b.role === "owner") ?? budgets[0];
      if (!owned) throw new Error("No budget");
      return api.getBudget(owned.id);
    },
  });

  const dto = query.data;
  const budgetId = dto?.id;
  const activeId = activePersonId ?? dto?.people[0]?.id ?? "";
  const onSuccess = (next: BudgetDto) => qc.setQueryData(KEY, next);
  const need = (): string => {
    if (!budgetId) throw new Error("No budget loaded");
    return budgetId;
  };

  const addMut = useMutation({
    mutationFn: (input: NewExpense) =>
      api.createExpense(need(), {
        categoryId: input.categoryId,
        amountCents: input.amountCents,
        occurredAt: input.occurredAt ?? new Date().toISOString(),
        personId: activeId || undefined,
        tags: input.tags ?? [],
        note: input.note ?? null,
        vendor: input.vendor ?? null,
      }),
    onSuccess,
  });
  const editMut = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: ExpensePatch }) =>
      api.updateExpense(need(), id, {
        categoryId: patch.categoryId,
        amountCents: patch.amountCents,
        occurredAt: patch.occurredAt,
        personId: patch.personId,
        tags: patch.tags,
        note: patch.note ?? null,
        vendor: patch.vendor ?? null,
        splits: patch.splits ?? null,
      }),
    onSuccess,
  });
  const removeMut = useMutation({
    mutationFn: (id: string) => api.deleteExpense(need(), id),
    onSuccess,
  });
  const personMut = useMutation({
    mutationFn: (name: string) => api.addPerson(need(), name),
    onSuccess,
  });
  const visibilityMut = useMutation({
    mutationFn: (visibility: BudgetDto["visibility"]) =>
      api.updateBudget(need(), { visibility }),
    onSuccess,
  });
  const cycleMut = useMutation({
    mutationFn: (day: number) => api.updateBudget(need(), { cycleStartDay: day }),
    onSuccess,
  });
  const approveMut = useMutation({
    mutationFn: (requestId: string) => api.approveRequest(need(), requestId),
    onSuccess,
  });
  const denyMut = useMutation({
    mutationFn: (requestId: string) => api.denyRequest(need(), requestId),
    onSuccess,
  });
  const joinMut = useMutation({
    mutationFn: (input: { name: string; email: string }) =>
      api.requestToJoin(input.email, input.name),
  });

  return {
    status: query.status,
    dto,
    activePersonId: activeId,
    selectPerson: setActivePersonId,
    add: useCallback((input: NewExpense) => addMut.mutate(input), [addMut]),
    edit: useCallback((id: string, patch: ExpensePatch) => editMut.mutate({ id, patch }), [editMut]),
    remove: useCallback((id: string) => removeMut.mutate(id), [removeMut]),
    addPersonNamed: useCallback((name: string) => personMut.mutate(name), [personMut]),
    setVisible: useCallback(
      (v: BudgetDto["visibility"]) => visibilityMut.mutate(v),
      [visibilityMut],
    ),
    setCycleDay: useCallback((day: number) => cycleMut.mutate(day), [cycleMut]),
    approveRequest: useCallback((id: string) => approveMut.mutate(id), [approveMut]),
    denyRequest: useCallback((id: string) => denyMut.mutate(id), [denyMut]),
    requestJoin: useCallback(
      (input: { name: string; email: string }) => joinMut.mutate(input),
      [joinMut],
    ),
  };
}
