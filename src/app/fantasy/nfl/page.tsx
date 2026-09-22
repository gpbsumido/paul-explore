import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import FantasyNflHubContent from "./FantasyNflHubContent";

const TITLE = "Fantasy NFL";
const DESCRIPTION =
  "The NFL hub: head-to-head fantasy football matchups with team scores, player breakdowns, and win probability.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: `${SITE_URL}/fantasy/nfl`,
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

export default function FantasyNflHubPage() {
  return <FantasyNflHubContent />;
}
