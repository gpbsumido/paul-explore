"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Calendar, CalendarMember } from "@/types/calendar";
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

// ---- Sharing API helpers ---------------------------------------------------

async function apiFetchMembers(calendarId: string): Promise<CalendarMember[]> {
  const res = await fetch(`/api/calendar/calendars/${calendarId}/members`);
  if (!res.ok) throw new Error("Failed to fetch members");
  const json = await res.json();
  return json.members as CalendarMember[];
}

async function apiInviteMember(
  calendarId: string,
  email: string,
  role: "editor" | "viewer",
): Promise<CalendarMember> {
  const res = await fetch(`/api/calendar/calendars/${calendarId}/members`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, role }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to invite member");
  }
  const json = await res.json();
  return json.member as CalendarMember;
}

async function apiUpdateMemberRole(
  calendarId: string,
  memberSub: string,
  role: "editor" | "viewer",
): Promise<CalendarMember> {
  const res = await fetch(
    `/api/calendar/calendars/${calendarId}/members/${encodeURIComponent(memberSub)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    },
  );
  if (!res.ok) throw new Error("Failed to update member role");
  const json = await res.json();
  return json.member as CalendarMember;
}

async function apiRemoveMember(
  calendarId: string,
  memberSub: string,
): Promise<{ googleAclRemoved: boolean }> {
  const res = await fetch(
    `/api/calendar/calendars/${calendarId}/members/${encodeURIComponent(memberSub)}`,
    { method: "DELETE" },
  );
  if (!res.ok) throw new Error("Failed to remove member");
  return res.json();
}

// ---- Hooks -----------------------------------------------------------------

/**
 * Manages the current user's calendars (owned and shared).
 * Also exposes sharing mutations: inviteMember, updateMemberRole, removeMember.
 */
export function useCalendars() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.calendar.calendars(),
    queryFn: fetchCalendars,
    staleTime: 60_000,
  });

  const calendars = data ?? [];

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

  const inviteMutation = useMutation({
    mutationFn: ({
      calendarId,
      email,
      role,
    }: {
      calendarId: string;
      email: string;
      role: "editor" | "viewer";
    }) => apiInviteMember(calendarId, email, role),
    onSettled: (_data, _err, { calendarId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.calendar.calendars() });
      queryClient.invalidateQueries({ queryKey: queryKeys.calendar.calendarMembers(calendarId) });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({
      calendarId,
      memberSub,
      role,
    }: {
      calendarId: string;
      memberSub: string;
      role: "editor" | "viewer";
    }) => apiUpdateMemberRole(calendarId, memberSub, role),
    onSettled: (_data, _err, { calendarId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.calendar.calendarMembers(calendarId) });
    },
  });

  const removeMutation = useMutation({
    mutationFn: ({ calendarId, memberSub }: { calendarId: string; memberSub: string }) =>
      apiRemoveMember(calendarId, memberSub),
    onSettled: (_data, _err, { calendarId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.calendar.calendars() });
      queryClient.invalidateQueries({ queryKey: queryKeys.calendar.calendarMembers(calendarId) });
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
    inviteMember: (calendarId: string, email: string, role: "editor" | "viewer") =>
      inviteMutation.mutateAsync({ calendarId, email, role }),
    updateMemberRole: (calendarId: string, memberSub: string, role: "editor" | "viewer") =>
      updateRoleMutation.mutateAsync({ calendarId, memberSub, role }),
    removeMember: (calendarId: string, memberSub: string) =>
      removeMutation.mutateAsync({ calendarId, memberSub }),
  };
}

/**
 * Fetches the member list for a specific calendar.
 * Returns the owner entry (synthesized, id=null) plus all members.
 * Enabled only when calendarId is non-null.
 */
export function useCalendarMembers(calendarId: string | null) {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.calendar.calendarMembers(calendarId ?? ""),
    queryFn: () => apiFetchMembers(calendarId!),
    enabled: !!calendarId,
    staleTime: 30_000,
  });

  return { members: data ?? [], isLoading };
}
