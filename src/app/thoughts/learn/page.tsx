import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import LearnContent from "./LearnContent";

const TITLE = "Thirteen Demos, One Player | Thoughts";
const DESCRIPTION =
  "The Learn pages started as thirteen interactive algorithm walkthroughs that each rebuilt the same stepper. Extracting one useStepPlayer hook, the off-by-one the new tests caught, and why the fix was to stop from the callback rather than the updater.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/learn",
});

export const revalidate = 86400;

export default function LearnThoughtsPage() {
  return <LearnContent />;
}
