import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import TradeContent from "./TradeContent";

const TITLE = "NFL Trade Analyzer";
const DESCRIPTION =
  "Weigh an ESPN fantasy football trade between two league teams: lineup-aware projections for this week, next week and the rest of the season, plus each player's strength of schedule.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: `${SITE_URL}/fantasy/nfl/trade`,
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

// Page shell is static — the client fetches the league's player pool on mount.
export const revalidate = 3600;

export default function NflTradePage() {
  return <TradeContent />;
}
