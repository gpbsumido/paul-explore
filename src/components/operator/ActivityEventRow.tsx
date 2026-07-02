"use client";

import { formatDistanceToNow } from "date-fns";
import type { ActivityEvent as ActivityEventType } from "@/types/operator";
import { getActivityTypeConfig } from "@/lib/operator-detail";

interface ActivityEventRowProps {
  event: ActivityEventType;
  even: boolean;
}

/**
 * Single row in the activity feed showing the event type icon, description,
 * actor, and timestamp. Alternating row backgrounds for readability.
 */
export default function ActivityEventRow({
  event,
  even,
}: ActivityEventRowProps) {
  const config = getActivityTypeConfig(event.type);

  return (
    <div
      className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-3 ${
        even ? "bg-surface" : "bg-surface-raised/40"
      }`}
    >
      {/* Type icon */}
      <span className={`shrink-0 ${config.color}`}>
        <ActivityIcon type={event.type} />
      </span>

      {/* Type label */}
      <span
        className={`shrink-0 text-[11px] font-medium uppercase tracking-wider ${config.color}`}
      >
        {config.label}
      </span>

      {/* Description */}
      <p className="min-w-0 flex-1 text-sm text-foreground">
        {event.description}
      </p>

      {/* Actor */}
      {event.actor && (
        <span className="shrink-0 text-xs text-muted truncate max-w-[140px]">
          {event.actor}
        </span>
      )}

      {/* Timestamp */}
      <span className="shrink-0 text-xs text-muted tabular-nums">
        {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
      </span>
    </div>
  );
}

function ActivityIcon({ type }: { type: ActivityEventType["type"] }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden
    >
      {ICON_PATHS[type]}
    </svg>
  );
}

const ICON_PATHS: Record<ActivityEventType["type"], React.ReactNode> = {
  restock: (
    // box with up arrow
    <path d="M2 4l6-2 6 2v8l-6 2-6-2V4zm6-2v12M2 4l6 2 6-2M8 8V5M6.5 6.5L8 5l1.5 1.5" />
  ),
  maintenance: (
    // wrench
    <path d="M10.5 2.5a3.5 3.5 0 0 0-3.27 4.73L3 11.5V13h1.5l4.27-4.23A3.5 3.5 0 1 0 10.5 2.5Z" />
  ),
  "alert-acknowledged": (
    // check circle
    <path d="M8 1a7 7 0 1 1 0 14A7 7 0 0 1 8 1Zm-1 9.5L4.5 8 3.75 8.75 7 12l5.25-5.25L11.5 6 7 10.5Z" />
  ),
  "status-change": (
    // refresh arrows
    <path d="M2.5 8a5.5 5.5 0 0 1 9.37-3.9L10 6h4V2l-1.76 1.76A7 7 0 0 0 1 8h1.5Zm11 0a5.5 5.5 0 0 1-9.37 3.9L6 10H2v4l1.76-1.76A7 7 0 0 0 15 8h-1.5Z" />
  ),
  "price-update": (
    // dollar sign
    <path d="M8 1v14M5 4.5C5 3.12 6.34 2 8 2s3 1.12 3 2.5S9.66 7 8 7 5 8.12 5 9.5 6.34 12 8 12s3-1.12 3-2.5" />
  ),
};
