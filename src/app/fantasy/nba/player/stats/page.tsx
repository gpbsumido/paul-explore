import type { Metadata } from "next";
import StatsContent from "./StatsContent";
import { SITE_URL, OG_IMAGE } from "@/lib/site";

const TITLE = "NBA Player Stats";
const DESCRIPTION =
  "NBA player statistics by team — points, rebounds, assists, and more.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: `${SITE_URL}/fantasy/nba/player/stats`,
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

// Page shell is static — client fetches live ESPN data on mount
export const revalidate = 3600;

export default function StatsPage() {
  return <StatsContent />;
}
