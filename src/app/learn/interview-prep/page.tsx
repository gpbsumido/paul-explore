import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import LeetCodeHub from "./LeetCodeHub";

const TITLE = "Interview prep: the LeetCode pattern playbook";
const DESCRIPTION =
  "Learn to recognise which pattern a LeetCode problem wants from its wording, then practise it with JavaScript templates, problem ladders, a recognition drill and spaced re-solves.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/learn/interview-prep",
  ogType: "website",
});

export default function InterviewPrepPage() {
  return <LeetCodeHub />;
}
