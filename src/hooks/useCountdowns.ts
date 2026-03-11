"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchCountdowns,
  createCountdown as createCountdownApi,
  updateCountdown as updateCountdownApi,
  deleteCountdown as deleteCountdownApi,
} from "@/lib/calendar";
import type { Countdown } from "@/types/calendar";
import { queryKeys } from "@/lib/queryKeys";

// countdowns are fetched all at once, not by date range, so there's only
// ever one cache entry to snapshot and restore on error. Cancelling and
// invalidating by this key is all we need.
const COUNTDOWNS_KEY = queryKeys.calendar.countdowns();

export interface UseCountdownsReturn {
  countdowns: Countdown[];
  loading: boolean;
  error: string | null;
  createCountdown: (
    data: Omit<Countdown, "id" | "createdAt">,
  ) => Promise<Countdown>;
  isCreating: boolean;
  updateCountdown: (
    id: string,
    fields: Partial<Omit<Countdown, "id" | "createdAt">>,
  ) => Promise<Countdown>;
  isUpdating: boolean;
  deleteCountdown: (id: string) => Promise<void>;
  isDeleting: boolean;
}

/**
 * Manages the current user's countdowns.
 *
 * staleTime is 0 so the list is verified on every mount. Countdowns don't
 * change as often as calendar events, but the list is small enough that
 * a quick re-fetch is painless and correctness matters more than skipping
 * the occasional network call.
 *
 * All three mutations use the optimistic update pattern:
 *   onMutate  -- cancel any in-flight fetch, snapshot the cache, apply the
 *                change immediately so the UI responds without waiting for
 *                the server
 *   onError   -- restore the snapshot so nothing is left broken if the
 *                write fails
 *   onSettled -- invalidate the countdowns cache so the server's version
 *                wins after everything settles
 */
export function useCountdowns(): UseCountdownsReturn {
  const queryClient = useQueryClient();

  // ---- Read ----------------------------------------------------------------

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error: queryError,
  } = useQuery({
    queryKey: COUNTDOWNS_KEY,
    queryFn: fetchCountdowns,
    staleTime: 0,
  });

  const countdowns = data ?? [];

  const loading = isLoading || isFetching;

  const error = isError
    ? queryError instanceof Error
      ? queryError.message
      : "Couldn't load countdowns. Check your connection and try again."
    : null;

  // ---- Mutations -----------------------------------------------------------

  /**
   * Optimistically push a temp countdown with a client-assigned id. The
   * real id from the server replaces it when the invalidation re-fetches.
   */
  const createMutation = useMutation({
    mutationFn: (data: Omit<Countdown, "id" | "createdAt">) =>
      createCountdownApi(data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: COUNTDOWNS_KEY });
      const snapshot = queryClient.getQueryData<Countdown[]>(COUNTDOWNS_KEY);
      const temp: Countdown = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      queryClient.setQueryData<Countdown[]>(COUNTDOWNS_KEY, (prev) => [
        ...(prev ?? []),
        temp,
      ]);
      return { snapshot };
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(COUNTDOWNS_KEY, context?.snapshot);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: COUNTDOWNS_KEY });
    },
  });

  /** Optimistically update the matching countdown in place. */
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      fields,
    }: {
      id: string;
      fields: Partial<Omit<Countdown, "id" | "createdAt">>;
    }) => updateCountdownApi(id, fields),
    onMutate: async ({ id, fields }) => {
      await queryClient.cancelQueries({ queryKey: COUNTDOWNS_KEY });
      const snapshot = queryClient.getQueryData<Countdown[]>(COUNTDOWNS_KEY);
      queryClient.setQueryData<Countdown[]>(COUNTDOWNS_KEY, (prev) =>
        (prev ?? []).map((c) => (c.id === id ? { ...c, ...fields } : c)),
      );
      return { snapshot };
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(COUNTDOWNS_KEY, context?.snapshot);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: COUNTDOWNS_KEY });
    },
  });

  /** Optimistically filter out the deleted countdown, restore on error. */
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCountdownApi(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: COUNTDOWNS_KEY });
      const snapshot = queryClient.getQueryData<Countdown[]>(COUNTDOWNS_KEY);
      queryClient.setQueryData<Countdown[]>(COUNTDOWNS_KEY, (prev) =>
        (prev ?? []).filter((c) => c.id !== id),
      );
      return { snapshot };
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(COUNTDOWNS_KEY, context?.snapshot);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: COUNTDOWNS_KEY });
    },
  });

  return {
    countdowns,
    loading,
    error,
    createCountdown: (data) => createMutation.mutateAsync(data),
    isCreating: createMutation.isPending,
    updateCountdown: (id, fields) =>
      updateMutation.mutateAsync({ id, fields }),
    isUpdating: updateMutation.isPending,
    deleteCountdown: (id) => deleteMutation.mutateAsync(id),
    isDeleting: deleteMutation.isPending,
  };
}
