"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import type { CalendarEvent, EventCard } from "@/types/calendar";
import BackLink from "./BackLink";
import EventCardTile from "@/components/calendar/EventCardTile";
import EventDetailSkeleton from "./EventDetailSkeleton";

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [event, setEvent] = useState<CalendarEvent | null>(null);
  const [cards, setCards] = useState<EventCard[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/calendar/events/${id}`).then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      }),
      fetch(`/api/calendar/events/${id}/cards`).then((r) => r.json()),
    ])
      .then(([eventData, cardsData]) => {
        setEvent(eventData.event ?? null);
        setCards(cardsData.cards ?? []);
        setLoaded(true);
      })
      .catch(() => {
        setError("Couldn't load this event.");
        setLoaded(true);
      });
  }, [id]);

  if (!loaded) {
    return <EventDetailSkeleton />;
  }

  if (error || !event) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <BackLink />
        <p className="text-sm text-red-600 dark:text-red-400 mt-6">
          {error ?? "Event not found."}
        </p>
      </div>
    );
  }

  const start = parseISO(event.startDate);
  const end = parseISO(event.endDate);

  const dateLabel = event.allDay
    ? `All day · ${format(start, "EEEE, MMMM d, yyyy")}`
    : `${format(start, "EEEE, MMMM d, yyyy")} · ${format(start, "h:mm aaa")} – ${format(end, "h:mm aaa")}`;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <BackLink />

      {/* Event header */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2.5">
          <div
            className="h-3 w-3 rounded-full shrink-0"
            style={{ backgroundColor: event.color }}
          />
          <h1 className="text-xl font-semibold text-foreground">{event.title}</h1>
        </div>
        <p className="text-sm text-muted pl-[22px]">{dateLabel}</p>
        {event.description && (
          <p className="text-sm text-foreground/80 pl-[22px] leading-relaxed">
            {event.description}
          </p>
        )}
      </div>

      {/* Cards section */}
      {cards.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">
            Cards ({cards.length})
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {cards.map((card) => (
              <EventCardTile key={card.id} card={card} />
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <div className="pt-2 border-t border-border">
        <Link
          href="/calendar"
          className="text-xs text-muted hover:text-foreground transition-colors"
        >
          View in calendar →
        </Link>
      </div>
    </div>
  );
}
