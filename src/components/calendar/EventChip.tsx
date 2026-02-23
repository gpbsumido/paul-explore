"use client";

import { Chip } from "@/components/ui";
import type { CalendarEvent } from "@/types/calendar";

interface EventChipProps {
  event: CalendarEvent;
  onClick: () => void;
}

export default function EventChip({ event, onClick }: EventChipProps) {
  return (
    <Chip
      label={event.title}
      color={event.color}
      fullWidth
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="mb-0.5"
    />
  );
}
