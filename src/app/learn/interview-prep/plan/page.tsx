import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import PlanContent from "./PlanContent";

const TITLE = "Study plan | Interview prep";
const DESCRIPTION =
  "A routine for every LeetCode problem, an eight-week schedule across the patterns, and a script for the coding interview itself.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/learn/interview-prep/plan",
});

export default function PlanPage() {
  return <PlanContent />;
}
