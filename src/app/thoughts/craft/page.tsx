import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import CraftThoughtsContent from "./CraftThoughtsContent";

const TITLE = "Craft | Thoughts";
const DESCRIPTION =
  "Building the Craft page: naming the traits of a lead front-end developer and backing each one with real work in this project, plus the data-integrity test that fails on a dead evidence link.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "article",
    url: `${SITE_URL}/thoughts/craft`,
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

export default function CraftThoughtsPage() {
  return <CraftThoughtsContent />;
}
