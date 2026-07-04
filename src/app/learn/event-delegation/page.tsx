import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import EventDelegationContent from "./EventDelegationContent";

const TITLE = "Event Delegation";
const DESCRIPTION =
  "Attach one handler to the parent instead of one per child. Interactive bubbling visualizer, cost comparison, dynamic list demo, and capture vs bubble diagram.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: `${SITE_URL}/learn/event-delegation`,
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

export default function EventDelegationPage() {
  return <EventDelegationContent />;
}
