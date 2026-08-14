import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import { PROJECTS, FEATURES } from "@/app/work-portfolio/_data/catalog";
import WorkPortfolioThoughtsContent from "./WorkPortfolioThoughtsContent";

/**
 * The counts come from the catalog, not from memory.
 *
 * This page is a server component, so importing the catalog costs the client
 * nothing. The write-up itself is "use client", which is why the numbers are
 * handed down as props rather than imported there -- pulling 21KB of catalog
 * into a prose route to render two integers is the wrong trade.
 */
const TITLE = "Work Portfolio | Thoughts";
const DESCRIPTION = `Rebuilding ${FEATURES.length} features from ${PROJECTS.length} old jobs as self-contained demos: reconstruction over emulation, anonymizing client work, a no-new-deps rule, the dual-ticker UX, and shipping it as merge-order-independent PRs.`;

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/work-portfolio",
});

// Static write-up -- cache at CDN for 24h
export const revalidate = 86400;

export default function WorkPortfolioThoughtsPage() {
  return (
    <WorkPortfolioThoughtsContent
      featureCount={FEATURES.length}
      projectCount={PROJECTS.length}
    />
  );
}
