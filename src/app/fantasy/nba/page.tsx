import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import FantasyHubContent from "./FantasyHubContent";

const TITLE = "Fantasy NBA";
const DESCRIPTION =
  "The NBA hub: playoff bracket, live player stats, weekly matchups, shot charts, and league history.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: `${SITE_URL}/fantasy/nba`,
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

export default function FantasyNbaHubPage() {
  return <FantasyHubContent />;
}
