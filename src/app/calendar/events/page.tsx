import type { Metadata } from "next";
import EventsContent from "./EventsContent";

export const metadata: Metadata = {
  title: "Events",
  description: "Search and filter your calendar events.",
};

export default function EventsPage() {
  return (
    <>
      <h1 className="sr-only">Events</h1>
      <EventsContent />
    </>
  );
}
