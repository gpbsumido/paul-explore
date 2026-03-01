"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui";
import { useDebounce } from "@/hooks/useDebounce";
import type { CalendarEvent } from "@/types/calendar";
import { queryKeys } from "@/lib/queryKeys";
import EventRow from "./EventRow";
import EventListSkeleton from "./EventListSkeleton";

export default function EventsContent() {
  const [titleQuery, setTitleQuery] = useState("");
  const [cardName, setCardName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // card name filter triggers a backend refetch; title is filtered client-side
  const debouncedCardName = useDebounce(cardName, 400);
  const debouncedTitle = useDebounce(titleQuery, 200);

  /**
   * Fetches events from the backend filtered by date range and card name.
   * staleTime: 0 means every mount triggers a background check — events can
   * change any time the user adds or edits calendar events elsewhere.
   * When startDate, endDate, or debouncedCardName changes the key changes
   * and TanStack Query fires a fresh fetch automatically, replacing the old
   * useEffect + AbortController + filterKey/loadedKey pattern.
   */
  const eventsQuery = useQuery({
    queryKey: queryKeys.calendar.eventsList({
      startDate,
      endDate,
      cardName: debouncedCardName,
    }),
    queryFn: async ({ signal }): Promise<CalendarEvent[]> => {
      const params = new URLSearchParams();
      if (startDate) params.set("start", new Date(startDate).toISOString());
      if (endDate) {
        // end of the selected day
        const d = new Date(endDate);
        d.setHours(23, 59, 59, 999);
        params.set("end", d.toISOString());
      }
      if (debouncedCardName) params.set("cardName", debouncedCardName);
      const qs = params.toString();
      const res = await fetch(
        `/api/calendar/events${qs ? `?${qs}` : ""}`,
        { signal },
      );
      if (!res.ok) throw new Error("Couldn't load events — check your connection.");
      const data = await res.json();
      return data.events ?? [];
    },
    staleTime: 0,
  });

  const loading = eventsQuery.isLoading;

  // title filter runs client-side on whatever the backend returned
  const displayed = useMemo(() => {
    const events = eventsQuery.data ?? [];
    return events
      .filter(
        (e) =>
          !debouncedTitle ||
          e.title.toLowerCase().includes(debouncedTitle.toLowerCase()),
      )
      .sort((a, b) => b.startDate.localeCompare(a.startDate));
  }, [eventsQuery.data, debouncedTitle]);

  const hasFilters = titleQuery || cardName || startDate || endDate;

  function clearFilters() {
    setTitleQuery("");
    setCardName("");
    setStartDate("");
    setEndDate("");
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      {/* Filter bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
        <Input
          label="Search by title"
          size="sm"
          type="search"
          autoComplete="off"
          value={titleQuery}
          onChange={(e) => setTitleQuery(e.target.value)}
          placeholder="Filter by title…"
        />
        <Input
          label="Card contains"
          size="sm"
          type="search"
          autoComplete="off"
          value={cardName}
          onChange={(e) => setCardName(e.target.value)}
          placeholder="Filter by card name…"
        />
        <Input
          label="From"
          size="sm"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <Input
          label="To"
          size="sm"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>

      {hasFilters && (
        <button
          type="button"
          onClick={clearFilters}
          className="mb-5 text-xs text-muted hover:text-foreground transition-colors"
        >
          Clear filters
        </button>
      )}

      {/* Results */}
      {loading ? (
        <EventListSkeleton />
      ) : eventsQuery.isError ? (
        <p className="text-sm text-red-600 dark:text-red-400 py-8 text-center">
          {eventsQuery.error?.message ?? "Couldn't load events."}
        </p>
      ) : displayed.length === 0 ? (
        <p className="text-sm text-muted py-16 text-center">
          {hasFilters ? "No events match your filters." : "No events yet."}
        </p>
      ) : (
        <ul className="space-y-2">
          {displayed.map((event) => (
            <EventRow key={event.id} event={event} />
          ))}
        </ul>
      )}
    </div>
  );
}
