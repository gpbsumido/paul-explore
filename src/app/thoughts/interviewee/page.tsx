import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import IntervieweeThoughtsContent from "./IntervieweeThoughtsContent";

const TITLE = "Interviewee | Thoughts";
const DESCRIPTION =
  "Building an interview-prep deck around one data shape: topic cards fed from a markdown template, bullet-point answers with expandable detail, related-topic hops, number and arrow-key navigation, and answered topics demoted but kept reachable.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/interviewee",
});

// Static write-up -- cache at CDN for 24h
export const revalidate = 86400;

export default function IntervieweeThoughtsPage() {
  return <IntervieweeThoughtsContent />;
}
