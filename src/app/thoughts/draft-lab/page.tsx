import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import DraftLabContent from "./DraftLabContent";

const TITLE = "Draft Lab | Thoughts";
const DESCRIPTION =
  "Draft Lab — a Firefox extension that rides along inside the ESPN fantasy draft room: pick sync, tier supply, keeper handling, and live recommendations under my league's exact scoring.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/draft-lab",
});

// Static write-up -- cache at CDN for 24h
export const revalidate = 86400;

export default function DraftLabThoughtsPage() {
  return <DraftLabContent />;
}
