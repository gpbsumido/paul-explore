import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import LeagueContent from "./LeagueContent";

const TITLE = "League History";
const DESCRIPTION =
  "ESPN fantasy basketball league standings, records, and rosters.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: `${SITE_URL}/fantasy/nba/league-history`,
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

export default function LeagueHistoryPage() {
  return <LeagueContent />;
}
