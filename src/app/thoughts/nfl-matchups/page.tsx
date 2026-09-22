import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import NflMatchupsContent from "./NflMatchupsContent";

const TITLE = "NFL Fantasy Matchups | Thoughts";
const DESCRIPTION =
  "Building the NFL sibling to the fantasy basketball matchups page — a week-based scoreboard, per-player actual vs. projected points, and a win probability I had to derive myself.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/nfl-matchups",
});

// Static write-up -- cache at CDN for 24h
export const revalidate = 86400;

export default function NflMatchupsThoughtsPage() {
  return <NflMatchupsContent />;
}
