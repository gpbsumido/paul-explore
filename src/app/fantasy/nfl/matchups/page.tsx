import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import MatchupContent from "./MatchupContent";

const TITLE = "NFL Matchups";
const DESCRIPTION =
  "Head-to-head ESPN fantasy football matchups: team scores, per-player actual and projected points, and a projection-based win probability.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: `${SITE_URL}/fantasy/nfl/matchups`,
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

// Page shell is static — the client fetches live ESPN data on mount.
export const revalidate = 3600;

export default function NflMatchupsPage() {
  return <MatchupContent />;
}
