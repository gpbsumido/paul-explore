import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import RiskScoringApiContent from "./RiskScoringApiContent";

const TITLE = "Risk-scoring API | Thoughts";
const DESCRIPTION =
  "A real-time transaction risk-scoring API in Go: a rules engine behind one interface, a weighted score and band, and a live server-sent-events feed of flagged transactions.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/risk-scoring-api",
});

// Static write-up -- cache at CDN for 24h
export const revalidate = 86400;

export default function RiskScoringApiThoughtsPage() {
  return <RiskScoringApiContent />;
}
