import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import TreeShakingContent from "./TreeShakingContent";

const TITLE = "Tree Shaking | Thoughts";
const DESCRIPTION =
  "A methodical pass at dead weight — the three kinds it comes in, why removing an unused export is not a bundle win, the judgment calls a depcheck report can't make for you, and wiring the whole thing into CI as a blocking check.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "article",
    url: `${SITE_URL}/thoughts/tree-shaking`,
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

export default function TreeShakingThoughtsPage() {
  return <TreeShakingContent />;
}
