import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import CalendarAboutContent from "./CalendarAboutContent";

const TITLE = "Calendar | Thoughts";
const DESCRIPTION =
  "How and why the calendar feature was built — full-stack architecture, date math, TCG card tracking, Auth0 BFF pattern, and trade-offs.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/calendar",
});

// Static write-up -- cache at CDN for 24h
export const revalidate = 86400;

export default function CalendarThoughtsPage() {
  return <CalendarAboutContent />;
}
