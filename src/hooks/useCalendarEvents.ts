"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createEvent,
  updateEvent,
  deleteEvent,
} from "@/lib/calendar";
import type { CalendarEvent } from "@/types/calendar";
import { queryKeys } from "@/lib/queryKeys";

// Prefix used to cancel and invalidate all calendar event queries at once.
// A create, update, or delete can affect any cached range (multi-day events
// near month boundaries) so we broadcast the invalidation rather than
// targeting only the currently visible window.
const EVENTS_PREFIX = ["calendar", "events"] as const;

interface Options {
  start: string;
  end: string;
  /** SSR seed data from the server component. When provided, the initial
   *  client-side fetch is skipped for that range. */
  initialEvents?: CalendarEvent[];
}

export interface UseCalendarEventsReturn {
  events: CalendarEvent[];
  loading: boolean;
  error: string | null;
  createEvent: (event: Omit<CalendarEvent, "id">) => Promise<CalendarEvent>;
  isCreating: boolean;
  updateEvent: (
    id: string,
    fields: Partial<Omit<CalendarEvent, "id">>,
  ) => Promise<CalendarEvent>;
  isUpdating: boolean;
  deleteEvent: (id: string) => Promise<void>;
  isDeleting: boolean;
}

/**
 * Manages calendar events for a given date window.
 *
 * The read side uses useQuery so navigating between months automatically
 * triggers a fresh fetch and results are cached per range. staleTime is 0
 * because calendar events can change at any time (another tab, another device)
 * and we want every mount to verify the data is still current rather than
 * silently serving a cached copy. The trade-off is slightly more network
 * traffic, but for a personal calendar that's the right call -- correctness
 * beats bandwidth savings here.
 *
 * initialEvents feeds initialData so SSR-seeded events show up immediately
 * with no loading state on first paint. initialDataUpdatedAt is set to 29
 * seconds ago so TanStack Query sees the data as almost stale and queues a
 * background refetch shortly after mount without blocking the UI.
 *
 * All three mutations use the optimistic update pattern:
 *   onMutate  -- cancel in-flight fetches, snapshot the cache, apply the
 *                change immediately so the grid reacts without waiting for
 *                the server response
 *   onError   -- restore the snapshot so nothing is left in a broken state
 *                if the write fails
 *   onSettled -- invalidate all calendar event queries via EVENTS_PREFIX
 *                so any cached range syncs with the server after the write
 */
export function useCalendarEvents({
  start,
  end,
  initialEvents,
}: Options): UseCalendarEventsReturn {
  const queryClient = useQueryClient();

  // ---- Read ---------------------------------------------------------------

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error: queryError,
  } = useQuery({
    queryKey: queryKeys.calendar.events({ start, end }),
    queryFn: async ({ signal }): Promise<CalendarEvent[]> => {
      const params = new URLSearchParams({ start, end });
      const res = await fetch(`/api/calendar/events?${params}`, { signal });
      if (!res.ok) throw new Error("Failed to fetch events");
      const json = await res.json();
      return json.events as CalendarEvent[];
    },
    staleTime: 0,
    initialData: initialEvents,
    initialDataUpdatedAt: initialEvents ? Date.now() - 29_000 : undefined,
  });

  /** Flat list of events for the current date window. */
  const events = data ?? [];

  /** True while the initial fetch or a background refetch is in-flight. */
  const loading = isLoading || isFetching;

  /** Human-readable error message, or null when the last fetch succeeded. */
  const error = isError
    ? queryError instanceof Error
      ? queryError.message
      : "Couldn't load events. Check your connection and try again."
    : null;

  // ---- Mutations ----------------------------------------------------------

  /**
   * Optimistically push a temp event with a client-assigned id. The server
   * id replaces it once onSettled invalidation re-fetches.
   */
  const createMutation = useMutation({
    mutationFn: (event: Omit<CalendarEvent, "id">) => createEvent(event),
    onMutate: async (event) => {
      await queryClient.cancelQueries({ queryKey: EVENTS_PREFIX });
      const snapshot = queryClient.getQueryData<CalendarEvent[]>(
        queryKeys.calendar.events({ start, end }),
      );
      const tempEvent: CalendarEvent = { ...event, id: crypto.randomUUID() };
      queryClient.setQueryData(
        queryKeys.calendar.events({ start, end }),
        (prev: CalendarEvent[] | undefined) => [...(prev ?? []), tempEvent],
      );
      return { snapshot };
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(
        queryKeys.calendar.events({ start, end }),
        context?.snapshot,
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: EVENTS_PREFIX });
    },
  });

  /** Optimistically update the matching event in place. */
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      fields,
    }: {
      id: string;
      fields: Partial<Omit<CalendarEvent, "id">>;
    }) => updateEvent(id, fields),
    onMutate: async ({ id, fields }) => {
      await queryClient.cancelQueries({ queryKey: EVENTS_PREFIX });
      const snapshot = queryClient.getQueryData<CalendarEvent[]>(
        queryKeys.calendar.events({ start, end }),
      );
      queryClient.setQueryData(
        queryKeys.calendar.events({ start, end }),
        (prev: CalendarEvent[] | undefined) =>
          (prev ?? []).map((e) => (e.id === id ? { ...e, ...fields } : e)),
      );
      return { snapshot };
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(
        queryKeys.calendar.events({ start, end }),
        context?.snapshot,
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: EVENTS_PREFIX });
    },
  });

  /** Optimistically filter out the deleted event, restore the snapshot on error. */
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEvent(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: EVENTS_PREFIX });
      const snapshot = queryClient.getQueryData<CalendarEvent[]>(
        queryKeys.calendar.events({ start, end }),
      );
      queryClient.setQueryData(
        queryKeys.calendar.events({ start, end }),
        (prev: CalendarEvent[] | undefined) =>
          (prev ?? []).filter((e) => e.id !== id),
      );
      return { snapshot };
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(
        queryKeys.calendar.events({ start, end }),
        context?.snapshot,
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: EVENTS_PREFIX });
    },
  });

  return {
    events,
    loading,
    error,
    createEvent: (event) => createMutation.mutateAsync(event),
    isCreating: createMutation.isPending,
    updateEvent: (id, fields) => updateMutation.mutateAsync({ id, fields }),
    isUpdating: updateMutation.isPending,
    deleteEvent: (id) => deleteMutation.mutateAsync(id),
    isDeleting: deleteMutation.isPending,
  };
}
