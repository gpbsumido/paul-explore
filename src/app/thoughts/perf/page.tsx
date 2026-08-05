import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import PerfContent from "./PerfContent";

const TITLE = "Performance Improvements | Thoughts";
const DESCRIPTION =
  "Eliminating the dark-mode flash, adding ISR to static pages, lazy-loading below-fold landing sections, and caching public API routes -- a systematic pass through each Core Web Vital.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/perf",
});

// Static write-up -- cache at CDN for 24h
export const revalidate = 86400;

export default function PerfThoughtsPage() {
  return <PerfContent />;
}
