import type { Metadata } from "next";
import { TOPICS } from "@/lib/interviewee/topics.data";
import IntervieweeContent from "./IntervieweeContent";

/**
 * Prep notes I open during an interview, so kept out of search engines even
 * though the page itself is public — the content is mine to rehearse, not to
 * index.
 */
export const metadata: Metadata = {
  title: "Interviewee",
  description:
    "A keyboard-driven deck of interview topics: bullet-point answers, expandable detail, and related topics a keystroke away.",
  robots: { index: false, follow: false },
};

export default function IntervieweePage() {
  return <IntervieweeContent topics={TOPICS} />;
}
