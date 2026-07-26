import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import TestTiersContent from "./TestTiersContent";

const TITLE = "Tiered Testing Strategy | Thoughts";
const DESCRIPTION =
  "Why you shouldn't run every test on every commit: split tests by cost — fast unit tests per push, integration on merge, e2e nightly, flaky ones quarantined — grounded in this repo's ci.yml.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "article",
    url: `${SITE_URL}/thoughts/test-tiers`,
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

export default function TestTiersThoughtsPage() {
  return <TestTiersContent />;
}
