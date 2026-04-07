import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import StylingContent from "./StylingContent";

const TITLE = "Styling Decisions | Thoughts";
const DESCRIPTION =
  "How I set up design tokens, reusable components, and theming — told as a conversation.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "article",
    url: `${SITE_URL}/thoughts/styling`,
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

// Static write-up -- cache at CDN for 24h
export const revalidate = 86400;

export default function StylingPage() {
  return <StylingContent />;
}
