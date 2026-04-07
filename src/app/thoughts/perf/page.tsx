import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import PerfContent from "./PerfContent";

const TITLE = "Performance Improvements | Thoughts";
const DESCRIPTION =
  "Eliminating the dark-mode flash, adding ISR to static pages, lazy-loading below-fold landing sections, and caching public API routes -- a systematic pass through each Core Web Vital.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "article",
    url: `${SITE_URL}/thoughts/perf`,
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE.url],
  },
};

// Static write-up -- cache at CDN for 24h
export const revalidate = 86400;

export default function PerfThoughtsPage() {
  return <PerfContent />;
}
