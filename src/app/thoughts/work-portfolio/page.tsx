import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import WorkPortfolioThoughtsContent from "./WorkPortfolioThoughtsContent";

const TITLE = "Work Portfolio | Thoughts";
const DESCRIPTION =
  "Rebuilding 24 features from 11 old jobs as self-contained demos: reconstruction over emulation, anonymizing client work, a no-new-deps rule, the dual-ticker UX, and shipping it as merge-order-independent PRs.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "article",
    url: `${SITE_URL}/thoughts/work-portfolio`,
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

export default function WorkPortfolioThoughtsPage() {
  return <WorkPortfolioThoughtsContent />;
}
