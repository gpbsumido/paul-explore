import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import HarnessVisualPlanContent from "./HarnessVisualPlanContent";

const TITLE = "Visual Plans | Thoughts";
const DESCRIPTION =
  "How I bracket every real change with a visual plan before any code and a visual recap after it ships: structured wireframes, a data model, the RED test list, and an honest record of where reality drifted from the plan.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/harness-visual-plan",
});

// Static write-up -- cache at CDN for 24h
export const revalidate = 86400;

export default function HarnessVisualPlanPage() {
  return <HarnessVisualPlanContent />;
}
