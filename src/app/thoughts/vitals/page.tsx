import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import WebVitalsContent from "./WebVitalsContent";

const TITLE = "Web Vitals | Thoughts";
const DESCRIPTION =
  "Why I built a real-user vitals pipeline instead of just using Lighthouse — the collection stack, sendBeacon, P75, and what field data actually tells you.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "article",
    url: `${SITE_URL}/thoughts/vitals`,
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

export default function WebVitalsThoughtsPage() {
  return <WebVitalsContent />;
}
