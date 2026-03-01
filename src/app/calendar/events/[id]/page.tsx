import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { auth0 } from "@/lib/auth0";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import type { CalendarEvent, EventCard } from "@/types/calendar";
import BackLink from "./BackLink";
import EventCardTile from "@/components/calendar/EventCardTile";
import EventDetailSkeleton from "./EventDetailSkeleton";

const TITLE = "Event";
const DESCRIPTION = "View event details and attached Pokémon cards.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: `${SITE_URL}/calendar/events`,
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE.url],
  },
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

/**
 * Fetches event and its attached cards in parallel directly from the backend.
 * Same BFF pattern as CalendarWithData -- call the backend with an access token
 * rather than going through the /api/ proxy to avoid a loopback round-trip.
 * Graceful fallback if auth or the backend is unavailable.
 */
async function EventDetailWithData({ id }: { id: string }) {
  let event: CalendarEvent | null = null;
  let cards: EventCard[] = [];
  let error: string | null = null;

  try {
    const { token } = await auth0.getAccessToken();
    if (token) {
      const [eventRes, cardsRes] = await Promise.all([
        fetch(`${API_URL}/api/calendar/events/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }),
        fetch(`${API_URL}/api/calendar/events/${id}/cards`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }),
      ]);

      if (!eventRes.ok) {
        error =
          eventRes.status === 404
            ? "Event not found."
            : "Couldn't load this event.";
      } else {
        const data = await eventRes.json();
        event = data.event ?? null;
      }

      if (cardsRes.ok) {
        const data = await cardsRes.json();
        cards = data.cards ?? [];
      }
    }
  } catch {
    // auth error or backend down
    error = "Couldn't load this event.";
  }

  if (error || !event) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <BackLink />
        <p className="mt-6 text-sm text-red-600 dark:text-red-400">
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
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6">
      <BackLink />

      {/* Event header */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2.5">
          <div
            className="h-3 w-3 shrink-0 rounded-full"
            style={{ backgroundColor: event.color }}
          />
          <h1 className="text-xl font-semibold text-foreground">
            {event.title}
          </h1>
        </div>
        <p className="pl-[22px] text-sm text-muted">{dateLabel}</p>
        {event.description && (
          <p className="pl-[22px] text-sm leading-relaxed text-foreground/80">
            {event.description}
          </p>
        )}
      </div>

      {/* Cards section -- only shown when there are cards attached */}
      {cards.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
            Cards ({cards.length})
          </h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
            {cards.map((card) => (
              <EventCardTile key={card.id} card={card} />
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <div className="border-t border-border pt-2">
        <Link
          href="/calendar"
          className="text-xs text-muted transition-colors hover:text-foreground"
        >
          View in calendar →
        </Link>
      </div>
    </div>
  );
}

/**
 * Event detail page. Fetches event and cards server-side so the first paint
 * shows real content instead of a blank skeleton. The Suspense fallback streams
 * in the skeleton while the two backend fetches resolve in parallel.
 */
export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense fallback={<EventDetailSkeleton />}>
      <EventDetailWithData id={id} />
    </Suspense>
  );
}
