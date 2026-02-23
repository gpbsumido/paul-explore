"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui";
import { useDebounce } from "@/hooks/useDebounce";
import type { CalendarEvent } from "@/types/calendar";
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

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // key that uniquely identifies the current backend fetch params
  const filterKey = `${startDate}|${endDate}|${debouncedCardName}`;
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const loading = loadedKey !== filterKey;

  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

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

    fetch(`/api/calendar/events${qs ? `?${qs}` : ""}`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error("fetch failed");
        return res.json();
      })
      .then((data) => {
        if (!controller.signal.aborted) {
          setEvents(data.events ?? []);
          setError(null);
          setLoadedKey(filterKey);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setError("Couldn't load events — check your connection.");
          setLoadedKey(filterKey);
        }
      });

    return () => controller.abort();
  }, [startDate, endDate, debouncedCardName, filterKey]);

  // title filter runs client-side on whatever the backend returned
  const displayed = events
    .filter(
      (e) =>
        !debouncedTitle ||
        e.title.toLowerCase().includes(debouncedTitle.toLowerCase()),
    )
    .sort((a, b) => b.startDate.localeCompare(a.startDate));

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
      ) : error ? (
        <p className="text-sm text-red-600 dark:text-red-400 py-8 text-center">
          {error}
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
