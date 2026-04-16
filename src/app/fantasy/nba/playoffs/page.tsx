import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import PlayoffBracketContent from "./PlayoffBracketContent";

const TITLE = "NBA Playoffs Bracket";
const DESCRIPTION =
  "Pick your NBA playoff bracket: choose series winners, scores, Finals MVP, and last game combined score.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: `${SITE_URL}/fantasy/nba/playoffs`,
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

export const revalidate = 3600;

export default function PlayoffsPage() {
  return <PlayoffBracketContent />;
}
