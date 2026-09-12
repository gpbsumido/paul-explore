import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import RiskScoringApiContent from "./RiskScoringApiContent";

const TITLE = "Risk-scoring API | Thoughts";
const DESCRIPTION =
  "Learning Go by building a real-time transaction risk-scoring API: interfaces, goroutines, mutexes, and channels on one side; rules, weights, bands, and risk appetite on the other.";

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
