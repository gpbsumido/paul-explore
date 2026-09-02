import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import TicketBoardContent from "./TicketBoardContent";

const TITLE = "Ticket board | Updates";
const DESCRIPTION =
  "Suggest a feature or report a bug, upvote what you want built, and follow tickets from idea to shipped — where each shipped ticket links back to the update that closed it.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: `${SITE_URL}/updates/tickets`,
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

// Static shell — seeded tickets are build-time data; a visitor's own
// submissions and votes are layered on client-side from their browser.
export const revalidate = 86400;

export default function TicketBoardPage() {
  return <TicketBoardContent />;
}
