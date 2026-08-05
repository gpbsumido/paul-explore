import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import PlayoffsContent from "./PlayoffsContent";

const TITLE = "NBA Playoffs Bracket | Thoughts";
const DESCRIPTION =
  "How the playoffs bracket picker was built — TDD with MSW, derived state, TBD resolution, submit vs. auto-save design, and leaderboard before results.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/playoffs",
});

// Static write-up -- cache at CDN for 24h
export const revalidate = 86400;

export default function PlayoffsThoughtsPage() {
  return <PlayoffsContent />;
}
