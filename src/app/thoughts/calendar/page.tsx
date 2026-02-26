import type { Metadata } from "next";
import dynamic from "next/dynamic";
import ThoughtsSkeleton from "@/components/ThoughtsSkeleton";

export const metadata: Metadata = {
  title: "Calendar | Thoughts",
  description:
    "How and why the calendar feature was built — full-stack architecture, date math, TCG card tracking, Auth0 BFF pattern, and trade-offs.",
};

// Lazy-load — the calendar write-up is long and pulls in nothing critical
// for other pages, so splitting it out keeps cross-page navigation snappier.
const CalendarAboutContent = dynamic(() => import("./CalendarAboutContent"), {
  loading: () => <ThoughtsSkeleton />,
});

export default function CalendarThoughtsPage() {
  return <CalendarAboutContent />;
}
