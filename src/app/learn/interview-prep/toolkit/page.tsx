import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import ToolkitContent from "./ToolkitContent";

const TITLE = "The JavaScript toolkit | Interview prep";
const DESCRIPTION =
  "ListNode, TreeNode, a heap with a comparator, a queue without shift(), and the sorting, number and string traps that break JavaScript LeetCode answers.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/learn/interview-prep/toolkit",
});

export default function ToolkitPage() {
  return <ToolkitContent />;
}
