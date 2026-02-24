import Link from "next/link";
import { format, parseISO } from "date-fns";
import type { CalendarEvent } from "@/types/calendar";

/** How many characters of the description to show before truncating. */
const PREVIEW_LEN = 100;

/** Single row in the events list — color dot, title, date, description preview. */
export default function EventRow({ event }: { event: CalendarEvent }) {
  const start = parseISO(event.startDate);
  const end = parseISO(event.endDate);

  const dateLabel = event.allDay
    ? format(start, "EEE, MMM d, yyyy")
    : `${format(start, "EEE, MMM d, yyyy")} · ${format(start, "h:mm aaa")} – ${format(end, "h:mm aaa")}`;

  const preview =
    event.description && event.description.length > PREVIEW_LEN
      ? `${event.description.slice(0, PREVIEW_LEN)}…`
      : event.description;

  return (
    <li>
      <Link
        href={`/calendar/events/${event.id}`}
        className="flex items-start gap-3 rounded-lg border border-border bg-surface px-4 py-3 hover:border-foreground/20 transition-colors group"
      >
        <div
          className="mt-1.5 h-2.5 w-2.5 rounded-full shrink-0"
          style={{ backgroundColor: event.color }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground group-hover:text-red-400 transition-colors truncate">
            {event.title}
          </p>
          <p className="text-xs text-muted mt-0.5">{dateLabel}</p>
          {preview && (
            <p className="text-xs text-muted mt-1 line-clamp-1">{preview}</p>
          )}
        </div>
        <svg
          width="5"
          height="9"
          viewBox="0 0 5 9"
          fill="none"
          className="mt-1.5 shrink-0 text-muted group-hover:text-foreground transition-colors"
        >
          <path
            d="M1 1l3 3.5L1 8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>
    </li>
  );
}
