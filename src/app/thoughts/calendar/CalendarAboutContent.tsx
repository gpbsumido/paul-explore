"use client";

import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import { CalendarChat } from "./sections/CalendarChat";
import { CalendarSummary } from "./sections/CalendarSummary";

export default function CalendarAboutContent() {
  return (
    <ThoughtLayout
      breadcrumb="Calendar"
      title="Calendar"
      intro={
        <>
          A full-stack personal calendar with four views, Google Calendar sync,
          event sharing, and Pokémon card attachments — built on Postgres and
          date-fns.
        </>
      }
      chat={<CalendarChat />}
    >
      <CalendarSummary />
    </ThoughtLayout>
  );
}
