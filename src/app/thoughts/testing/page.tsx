import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import TestingContent from "./TestingContent";

const TITLE = "Testing | Thoughts";
const DESCRIPTION =
  "How 108 tests got added to a codebase with zero — the setup, what got tested and why, and the MSW delay() trick for proving optimistic updates actually work.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "article",
    url: `${SITE_URL}/thoughts/testing`,
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

export default function TestingThoughtsPage() {
  return <TestingContent />;
}
