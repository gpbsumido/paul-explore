import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import DrillContent from "./DrillContent";

const TITLE = "Recognition drill | Interview prep";
const DESCRIPTION =
  "Read a LeetCode problem statement and name the pattern it wants. Misses come back tomorrow, hits drift out on a spaced-repetition ladder.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/learn/interview-prep/drill",
  ogType: "website",
});

export default function DrillPage() {
  return <DrillContent />;
}
