import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import dynamic from "next/dynamic";

const DPContent = dynamic(() => import("./DPContent"));

const TITLE = "Dynamic Programming";
const DESCRIPTION =
  "Overlapping subproblems, optimal substructure — the real intuition behind DP. Interactive Fibonacci table, unique paths grid fill, and climbing stairs demos.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/learn/dynamic-programming",
  ogType: "website",
});

export default function DynamicProgrammingPage() {
  return <DPContent />;
}
