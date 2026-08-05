import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import dynamic from "next/dynamic";

const FromScratchContent = dynamic(() => import("./FromScratchContent"));

const TITLE = "From Scratch";
const DESCRIPTION =
  "Implement once(), pipe(), Promise.all(), bind(), and Array.map() from scratch. Guided line-by-line walkthroughs with inline annotations and test runners.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/learn/from-scratch",
  ogType: "website",
});

export default function FromScratchPage() {
  return <FromScratchContent />;
}
