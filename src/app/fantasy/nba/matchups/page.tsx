import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import MatchupContent from "./MatchupContent";

const TITLE = "Matchups";
const DESCRIPTION =
  "Head-to-head ESPN fantasy basketball matchups with category breakdowns.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: `${SITE_URL}/fantasy/nba/matchups`,
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

export default function MatchupsPage() {
  return <MatchupContent />;
}
