import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import TreeShakingTwoContent from "./TreeShakingTwoContent";

const TITLE = "Tree Shaking, Round 2 | Thoughts";
const DESCRIPTION =
  "A second efficiency pass for 2.3.0, starting from green dead-code checks: tree-shaking the barrel packages Next doesn't optimize by default, measuring the 148KB it moved, and a Lighthouse web-vitals check that named unused JavaScript as the same lever behind a soft LCP.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "article",
    url: `${SITE_URL}/thoughts/tree-shaking-2`,
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

export default function TreeShakingTwoThoughtsPage() {
  return <TreeShakingTwoContent />;
}
