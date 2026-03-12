"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { useMemo } from "react";
import {
  fetchCountdowns,
  createCountdown as createCountdownApi,
  updateCountdown as updateCountdownApi,
  deleteCountdown as deleteCountdownApi,
} from "@/lib/calendar";
import type { Countdown, CountdownPage } from "@/types/calendar";
import { queryKeys } from "@/lib/queryKeys";

// Single cache key — countdowns aren't scoped by date range, so there's
// only ever one infinite query to snapshot, update, and invalidate.
const COUNTDOWNS_KEY = queryKeys.calendar.countdowns();

export interface UseCountdownsReturn {
  /** All countdowns across every page that has been loaded so far. */
  countdowns: Countdown[];
  loading: boolean;
  error: string | null;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
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

interface Options {
  /** SSR seed from the server component. Seeds the first page so the list
   *  renders without a loading state on first paint. Same pattern as
   *  initialEvents in useCalendarEvents. */
  initialPage?: CountdownPage;
}

/**
 * Manages the current user's countdowns with cursor-based pagination.
 *
 * Cursor format is "YYYY-MM-DD__<uuid>" — a composite of the last seen
 * target_date and id. The backend uses this for keyset pagination so inserts
 * or deletes between pages don't shift items the way OFFSET would.
 *
 * staleTime is 0 so each mount re-validates immediately. initialPage feeds the
 * first page via initialData so SSR-seeded countdowns show with no loading
 * state on first paint; staleTime: 0 ensures a background refetch fires right
 * after mount without blocking the UI.
 *
 * All three mutations use the optimistic update pattern across the full paged
 * cache. The snapshot/restore covers every loaded page so rollbacks are
 * complete even if the user has scrolled through multiple pages before a
 * write fails.
 */
export function useCountdowns({
  initialPage,
}: Options = {}): UseCountdownsReturn {
  const queryClient = useQueryClient();
  // ---- Read ----------------------------------------------------------------

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error: queryError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: COUNTDOWNS_KEY,
    queryFn: ({ pageParam }) =>
      fetchCountdowns(pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: CountdownPage) =>
      lastPage.nextCursor ?? undefined,
    staleTime: 0,
    initialData: initialPage
      ? ({
          pages: [initialPage],
          pageParams: [undefined],
        } as InfiniteData<CountdownPage, string | undefined>)
      : undefined,
  });

  // flatten all loaded pages into one stable array for callers that just want
  // the full list (calendar views, countdown list sorting)
  const countdowns = useMemo(
    () => data?.pages.flatMap((p) => p.countdowns) ?? [],
    [data],
  );

  const loading = isLoading || isFetching;

  const error = isError
    ? queryError instanceof Error
      ? queryError.message
      : "Couldn't load countdowns. Check your connection and try again."
    : null;

  // ---- Mutations -----------------------------------------------------------

  /**
   * Optimistically push a temp countdown into the first page. Display sort
   * handles the visual position; the real id arrives after invalidation
   * refetches.
   */
  const createMutation = useMutation({
    mutationFn: (data: Omit<Countdown, "id" | "createdAt">) =>
      createCountdownApi(data),
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: COUNTDOWNS_KEY });
      const snapshot =
        queryClient.getQueryData<InfiniteData<CountdownPage>>(COUNTDOWNS_KEY);
      const temp: Countdown = {
        ...newData,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      queryClient.setQueryData<InfiniteData<CountdownPage>>(
        COUNTDOWNS_KEY,
        (prev) => {
          if (!prev) {
            return {
              pages: [{ countdowns: [temp], nextCursor: null }],
              pageParams: [undefined],
            };
          }
          return {
            ...prev,
            pages: prev.pages.map((page, i) =>
              i === 0
                ? { ...page, countdowns: [...page.countdowns, temp] }
                : page,
            ),
          };
        },
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

  /** Optimistically update the matching countdown across all loaded pages. */
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
      const snapshot =
        queryClient.getQueryData<InfiniteData<CountdownPage>>(COUNTDOWNS_KEY);
      queryClient.setQueryData<InfiniteData<CountdownPage>>(
        COUNTDOWNS_KEY,
        (prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            pages: prev.pages.map((page) => ({
              ...page,
              countdowns: page.countdowns.map((c) =>
                c.id === id ? { ...c, ...fields } : c,
              ),
            })),
          };
        },
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

  /** Optimistically remove the countdown from whichever page contains it. */
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCountdownApi(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: COUNTDOWNS_KEY });
      const snapshot =
        queryClient.getQueryData<InfiniteData<CountdownPage>>(COUNTDOWNS_KEY);
      queryClient.setQueryData<InfiniteData<CountdownPage>>(
        COUNTDOWNS_KEY,
        (prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            pages: prev.pages.map((page) => ({
              ...page,
              countdowns: page.countdowns.filter((c) => c.id !== id),
            })),
          };
        },
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
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    createCountdown: (data) => createMutation.mutateAsync(data),
    isCreating: createMutation.isPending,
    updateCountdown: (id, fields) => updateMutation.mutateAsync({ id, fields }),
    isUpdating: updateMutation.isPending,
    deleteCountdown: (id) => deleteMutation.mutateAsync(id),
    isDeleting: deleteMutation.isPending,
  };
}
