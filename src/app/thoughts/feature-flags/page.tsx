import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import FeatureFlagsContent from "./FeatureFlagsContent";

const TITLE = "Feature Flags Service | Thoughts";
const DESCRIPTION =
  "Giving the feature-flags console a real backend in portfolio_api: public reads, an Auth0-gated write path with an audit trail, and a cron that resets the demo seed every six hours.";

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
