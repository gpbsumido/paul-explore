import type { Metadata } from "next";
import CalendarAboutContent from "./CalendarAboutContent";

export const metadata: Metadata = {
  title: "Calendar | Thoughts",
  description:
    "How and why the calendar feature was built — full-stack architecture, date math, TCG card tracking, Auth0 BFF pattern, and trade-offs.",
};

export default function CalendarThoughtsPage() {
  return <CalendarAboutContent />;
}
