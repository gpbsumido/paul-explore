import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import MessengerAuthContent from "./MessengerAuthContent";

const TITLE = "Messenger Auth Bug | Thoughts";
const DESCRIPTION =
  "Why links opened in Facebook Messenger showed a logged-in hub for users who were not authenticated — two root causes, two fixes.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "article",
    url: `${SITE_URL}/thoughts/messenger-auth`,
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

export const revalidate = 86400;

export default function MessengerAuthPage() {
  return <MessengerAuthContent />;
}
