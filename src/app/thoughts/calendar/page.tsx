import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import CalendarAboutContent from "./CalendarAboutContent";

const TITLE = "Calendar | Thoughts";
const DESCRIPTION =
  "How and why the calendar feature was built — full-stack architecture, date math, TCG card tracking, Auth0 BFF pattern, and trade-offs.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "article",
    url: `${SITE_URL}/thoughts/calendar`,
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

export default function CalendarThoughtsPage() {
  return <CalendarAboutContent />;
}
