import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import FeatureFlagsContent from "./FeatureFlagsContent";

const TITLE = "Feature Flags | Thoughts";
const DESCRIPTION =
  "Design decisions behind the feature-flag console — an engine-first build with deterministic FNV-1a bucketing, sticky and monotonic rollouts, first-match targeting, an explainable evaluation reason, and an audit log.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "article",
    url: `${SITE_URL}/thoughts/feature-flags`,
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

export default function FeatureFlagsThoughtsPage() {
  return <FeatureFlagsContent />;
}
