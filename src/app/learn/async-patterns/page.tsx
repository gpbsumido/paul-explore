import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import dynamic from "next/dynamic";

const AsyncContent = dynamic(() => import("./AsyncContent"));

const TITLE = "Async Patterns";
const DESCRIPTION =
  "JavaScript is single-threaded. Interactive event loop simulator, Promise.all vs race vs allSettled timelines, and sequential vs parallel pitfalls.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/learn/async-patterns",
  ogType: "website",
});

export default function AsyncPatternsPage() {
  return <AsyncContent />;
}
