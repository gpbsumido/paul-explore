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
 * Fetches calendar events for the given date window and keeps local state in
 * sync when you create, update, or delete events. Re-fetches automatically
 * whenever start/end changes (i.e. user navigates to a different month/week).
 *
 * loading is derived from whether the current range has been resolved yet,
 * so no setState ever fires synchronously inside the effect body.
 */
export function useCalendarEvents({
  start,
  end,
}: Options): UseCalendarEventsReturn {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  // tracks the range that was last resolved — loading is derived from this
  // so the effect body itself never calls setState directly
  const [loadedRange, setLoadedRange] = useState<string | null>(null);
  const rangeKey = `${start}|${end}`;
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
