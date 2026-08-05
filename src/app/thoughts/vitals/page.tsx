import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import WebVitalsContent from "./WebVitalsContent";

const TITLE = "Web Vitals | Thoughts";
const DESCRIPTION =
  "Why I built a real-user vitals pipeline instead of just using Lighthouse — the collection stack, sendBeacon, P75, and what field data actually tells you.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/vitals",
});

// Static write-up -- cache at CDN for 24h
export const revalidate = 86400;

export default function WebVitalsThoughtsPage() {
  return <WebVitalsContent />;
}
