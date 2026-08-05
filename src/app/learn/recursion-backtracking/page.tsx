import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import dynamic from "next/dynamic";

const RecursionBacktrackingContent = dynamic(
  () => import("./RecursionBacktrackingContent"),
);

const TITLE = "Recursion & Backtracking";
const DESCRIPTION =
  "Solve it by solving a smaller version. Undo what doesn't work. Interactive Fibonacci call tree with memoization toggle and backtracking subsets demo.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/learn/recursion-backtracking",
  ogType: "website",
});

export default function RecursionBacktrackingPage() {
  return <RecursionBacktrackingContent />;
}
