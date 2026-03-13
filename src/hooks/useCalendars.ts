"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Calendar } from "@/types/calendar";
import { queryKeys } from "@/lib/queryKeys";

// ---- API helpers -----------------------------------------------------------

async function fetchCalendars(): Promise<Calendar[]> {
  const res = await fetch("/api/calendar/calendars");
  if (!res.ok) throw new Error("Failed to fetch calendars");
  const json = await res.json();
  return json.calendars as Calendar[];
}

async function apiCreateCalendar(
  fields: Pick<Calendar, "name" | "color" | "syncMode">,
): Promise<Calendar> {
  const res = await fetch("/api/calendar/calendars", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fields),
  });
  if (!res.ok) throw new Error("Failed to create calendar");
  const json = await res.json();
  return json.calendar as Calendar;
}

async function apiUpdateCalendar(
  id: string,
  fields: Partial<Pick<Calendar, "name" | "color" | "syncMode" | "googleCalId" | "googleCalName">>,
): Promise<Calendar> {
  const res = await fetch(`/api/calendar/calendars/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fields),
  });
  if (!res.ok) throw new Error("Failed to update calendar");
  const json = await res.json();
  return json.calendar as Calendar;
}

async function apiDeleteCalendar(id: string): Promise<void> {
  const res = await fetch(`/api/calendar/calendars/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete calendar");
}

// ---- Hook ------------------------------------------------------------------

/**
 * Manages the current user's calendars.
 *
 * Calendar mutations are infrequent (users rarely rename or delete calendars)
 * so there are no optimistic updates -- we just invalidate and let the query
 * refetch on settled. This keeps the code simple and ensures the UI always
 * reflects what the server says after a mutation.
 *
 * @returns calendars list, loading state, and create/update/delete mutators
 */
export function useCalendars() {
  const queryClient = useQueryClient();

  // ---- Read ----------------------------------------------------------------

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.calendar.calendars(),
    queryFn: fetchCalendars,
    staleTime: 60_000, // calendars don't change often; 1-minute stale is fine
  });

  const calendars = data ?? [];

  // ---- Mutations -----------------------------------------------------------

  const createMutation = useMutation({
    mutationFn: (fields: Pick<Calendar, "name" | "color" | "syncMode">) =>
      apiCreateCalendar(fields),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.calendar.calendars() });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      fields,
    }: {
      id: string;
      fields: Partial<Pick<Calendar, "name" | "color" | "syncMode" | "googleCalId" | "googleCalName">>;
    }) => apiUpdateCalendar(id, fields),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.calendar.calendars() });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDeleteCalendar(id),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.calendar.calendars() });
    },
  });

  return {
    calendars,
    isLoading,
    createCalendar: (fields: Pick<Calendar, "name" | "color" | "syncMode">) =>
      createMutation.mutateAsync(fields),
    updateCalendar: (
      id: string,
      fields: Partial<Pick<Calendar, "name" | "color" | "syncMode" | "googleCalId" | "googleCalName">>,
    ) => updateMutation.mutateAsync({ id, fields }),
    deleteCalendar: (id: string) => deleteMutation.mutateAsync(id),
  };
}
