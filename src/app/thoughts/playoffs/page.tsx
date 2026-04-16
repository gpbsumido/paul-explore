import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import PlayoffsContent from "./PlayoffsContent";

const TITLE = "NBA Playoffs Bracket | Thoughts";
const DESCRIPTION =
  "How the playoffs bracket picker was built — TDD with MSW, derived state, TBD resolution, submit vs. auto-save design, and leaderboard before results.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "article",
    url: `${SITE_URL}/thoughts/playoffs`,
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

export default function PlayoffsThoughtsPage() {
  return <PlayoffsContent />;
}
