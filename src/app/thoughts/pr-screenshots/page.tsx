import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import PrScreenshotsContent from "./PrScreenshotsContent";

const TITLE = "PR Screenshots From an Unattended Agent | Thoughts";
const DESCRIPTION =
  "How the claude-harness agent embeds before/after screenshots inline in PR descriptions with only the gh CLI — why the clean methods (user-attachments, gists, release assets) all failed, and why we don't prune the PNGs at release time.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "article",
    url: `${SITE_URL}/thoughts/pr-screenshots`,
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

export const revalidate = 86400;

export default function PrScreenshotsThoughtsPage() {
  return <PrScreenshotsContent />;
}
