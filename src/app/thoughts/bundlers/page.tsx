import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import BundlersContent from "./BundlersContent";

const TITLE = "Bundlers | Thoughts";
const DESCRIPTION =
  "Which bundler this project runs and why, whether it's the right one, and the real situations where a lead reaches for a different bundler entirely — the deliverable and the dominant constraint pick it, not taste.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "article",
    url: `${SITE_URL}/thoughts/bundlers`,
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

export default function BundlersThoughtsPage() {
  return <BundlersContent />;
}
