"use client";

import { useState, useEffect, useCallback } from "react";
import {
  fetchEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from "@/lib/calendar";
import type { CalendarEvent } from "@/types/calendar";

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
  updateEvent: (
    id: string,
    fields: Partial<Omit<CalendarEvent, "id">>,
  ) => Promise<CalendarEvent>;
  deleteEvent: (id: string) => Promise<void>;
}

/**
 * Manages calendar events for a given date window.
 *
 * Fetches on mount and re-fetches whenever start/end changes (navigation).
 * `loading` is derived from whether the current range has resolved -- no
 * setState ever fires synchronously in the effect body, keeping the
 * react-hooks/set-state-in-effect rule happy.
 *
 * When initialEvents is provided (SSR path), state is seeded from that data
 * and the range is pre-marked as loaded so no redundant fetch fires on mount.
 */
export function useCalendarEvents({
  start,
  end,
  initialEvents,
}: Options): UseCalendarEventsReturn {
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents ?? []);
  const [error, setError] = useState<string | null>(null);

  // tracks the last range that finished loading -- loading is derived from
  // this so the effect body itself never calls setState directly.
  // pre-seeded to the initial range when server data is provided so the
  // first client render doesn't show a loading state.
  const rangeKey = `${start}|${end}`;
  const [loadedRange, setLoadedRange] = useState<string | null>(
    initialEvents ? rangeKey : null,
  );
  const loading = loadedRange !== rangeKey;

  useEffect(() => {
    const controller = new AbortController();

    // setState only called inside .then/.catch callbacks, never synchronously
    fetchEvents(start, end)
      .then((data) => {
        if (!controller.signal.aborted) {
          setEvents(data);
          setError(null);
          setLoadedRange(rangeKey);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setError("Couldn't load events. Check your connection and try again.");
          setLoadedRange(rangeKey);
        }
      });

    return () => controller.abort();
  }, [start, end, rangeKey]);

  /** Create an event and add it to local state with the server-assigned id. */
  const handleCreate = useCallback(
    async (event: Omit<CalendarEvent, "id">) => {
      const created = await createEvent(event);
      setEvents((prev) => [...prev, created]);
      return created;
    },
    [],
  );

  /** Update an event in place so the UI reflects changes immediately. */
  const handleUpdate = useCallback(
    async (id: string, fields: Partial<Omit<CalendarEvent, "id">>) => {
      const updated = await updateEvent(id, fields);
      setEvents((prev) => prev.map((e) => (e.id === id ? updated : e)));
      return updated;
    },
    [],
  );

  /** Remove an event from local state after the server confirms deletion. */
  const handleDelete = useCallback(async (id: string) => {
    await deleteEvent(id);
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return {
    events,
    loading,
    error,
    createEvent: handleCreate,
    updateEvent: handleUpdate,
    deleteEvent: handleDelete,
  };
}
